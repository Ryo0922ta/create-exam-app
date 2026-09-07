# 解答用紙作成アプリ 技術仕様書

## 1. システム概要

### 1.1 アーキテクチャの概要

Next.js App Router、React、TypeScript、Tailwind CSSで構築したブラウザ完結型のクライアントサイドSPA（Single Page Application）です。CSVファイルの解析、状態管理、プレビュー描画、PDFの生成および結合ダウンロードに至るすべての処理をブラウザ上で実行します。サーバーへのデータ送信は行いません。

### 1.2 使用技術スタック

- **フロントエンドフレームワーク**: Next.js (App Router), React
- **プログラミング言語**: TypeScript
- **スタイリング**: Tailwind CSS, PostCSS
- **CSV解析**: PapaParse
- **PDF生成・結合**: @react-pdf/renderer, pdf-lib

## 2. ディレクトリ・モジュール構造

### 2.1 主要ファイルとコンポーネントの責務一覧

#### UIコンポーネント

| ファイル                              | 責務                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `app/page.tsx`                        | メインページ。画面全体の状態管理とイベントハンドリング、各コンポーネントの統括 |
| `components/CsvUploader.tsx`          | CSVファイルの選択、ドラッグ&ドロップ、ファイル名表示、リセット操作             |
| `components/LayoutSettingsModal.tsx`  | レイアウト設定（問題数・行数・列数）のモーダル入力と検証エラー表示             |
| `components/PreviewPanel.tsx`         | タブ切替、プレビュー操作、問題用紙・解答用紙プレビューの切替                   |
| `components/QuestionPaperPreview.tsx` | 問題用紙プレビューのHTML描画                                                   |
| `components/AnswerSheetPreview.tsx`   | 解答用紙プレビューのHTML描画                                                   |

#### データ処理・ヘルパー

| ファイル             | 責務                                                          |
| -------------------- | ------------------------------------------------------------- |
| `types/question.ts`  | CSV行データ、問題形式、問題ドメインモデルの型定義             |
| `types/layout.ts`    | 問題形式ごとの表示件数・横・縦のレイアウト型定義              |
| `types/exam.ts`      | 問題グループと表示番号を含む試験プレビュー共有型定義          |
| `utils/csvParser.ts` | 文字コード判定、CSVパース、バリデーション、問題データへの変換 |
| `lib/examLayout.ts`  | 問題の形式別抽出、表示番号採番、レイアウト設定の初期化・検証  |

#### PDF生成ロジック

| ファイル                      | 責務                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `lib/generateExamPdf.ts`      | PDF生成エンジン。動的インポート、PDF並列生成、結合、Blobダウンロード            |
| `components/pdfDocuments.tsx` | `@react-pdf/renderer` を用いた問題用紙・解答用紙PDFドキュメントのレイアウト定義 |

## 3. データ構造（データモデル）

### 3.1 問題データモデル（Question 判別可能ユニオン）

`Question` は問題形式を `type` プロパティで識別する判別可能ユニオン（Discriminated Union）です。

```ts
type QuestionType = "4択" | "単語" | "自由記述";

type ChoiceQuestion = {
    id: number;
    type: "4択";
    question: string;
    choices: [string, string, string, string];
};

type WordQuestion = {
    id: number;
    type: "単語";
    question: string;
};

type EssayQuestion = {
    id: number;
    type: "自由記述";
    question: string;
    maxChars?: number;
};

type Question = ChoiceQuestion | WordQuestion | EssayQuestion;
```

### 3.2 レイアウト設定モデル（LayoutSettings）

各問題形式における「出力件数（count）」「列数（columns）」「行数（rows）」を管理します。

```ts
type QuestionLayout = {
    count: number;
    columns: number;
    rows: number;
};

type LayoutSettings = {
    choice: QuestionLayout;
    word: QuestionLayout;
    essay: QuestionLayout;
};
```

### 3.3 試験プレビュー・連番管理モデル（NumberedQuestion）

元CSVのIDとは別に、試験全体で通し番号（displayNumber）を付与して問題を管理します。

```ts
type NumberedQuestion = {
    question: Question;
    displayNumber: number;
};

type QuestionGroups = {
    choice: NumberedQuestion[];
    word: NumberedQuestion[];
    essay: NumberedQuestion[];
};
```

## 4. データ処理仕様

### 4.1 CSV解析と自動判定

- **文字コード判定（UTF-8 / Shift-JIS）**: `decodeCsvFile()` は最初にUTF-8として厳密（fatal: true）にデコードし、失敗した場合のみShift-JISとして再デコードします。
- **問題形式の自動正規化**:
    - `単語`、`語句`、`一問一答` → 単語回答（`"単語"`）へ正規化
    - `自由記述`、`記述`、`論述` → 自由記述（`"自由記述"`）へ正規化
    - 未指定または未知の値 → 4択（`"4択"`）としてフォールバック
    - 自由記述の文字数制限は、正の整数として解釈できる場合のみ保存
- **バリデーションとエラーの非表示処理**:
    - `問題番号` と `問題文` の必須存在チェック
    - 問題番号が数値であること、問題文が空でないことの検証
    - PapaParse解析時の末尾の空列などに起因する `TooFewFields`、`TooManyFields` をエラー表示から除外

### 4.2 状態管理と連番（displayNumber）の生成

- **問題用紙・解答用紙間の表示番号同期アルゴリズム**:
    1. CSVから得た全問題を形式別（choice, word, essay）に分類します。
    2. `appliedSettings` の各 `count` に応じて各形式から問題を抽出します。
    3. 抽出された全問題を元CSVの `id` 昇順に並べ替え、1から昇順に通し番号 `displayNumber` を採番します。
    4. 問題用紙、解答用紙、PDFの各レンダラーが同一の `NumberedQuestion` / `displayNumbers` マップを参照することで、すべての用紙間で問題番号が完全に一致します。
- **レイアウト境界条件の検証ルール**:
  設定変更・確定時に、各形式について以下の条件を検証します。
    - `count <= CSV内の該当問題数`（CSVに存在する問題数を超えて指定できない）
    - `columns * rows >= count`（指定したグリッド枠数以上に出力件数が収まっていること）

### 4.3 エラー状態の保持と隔離

エラーの種類に応じて独立した状態を管理し、操作による誤消去や混同を防止します。

- `csvErrors`: CSVの解析・バリデーションエラー
- `pdfError`: PDF生成処理時のエラー
- `settingsError`: レイアウト設定モーダルでの検証エラー

※ PDF生成を試行しても `csvErrors` は維持され、独立してユーザーへ通知されます。

## 5. PDF生成・結合エンジン

### 5.1 生成フローと動的ローディング

初期バンドルサイズを削減するため、`@react-pdf/renderer`、`pdf-lib`、およびPDF用コンポーネントはPDFダウンロードの実行時にのみ `import()` で動的読み込みを行います。

1. ユーザーがPDFダウンロードをクリックします。
2. 必要なライブラリとPDFコンポーネントを動的ロードします。
3. `QuestionSheetDocument` と `AnswerSheetDocument` を並列にBlobとしてレンダリングします。

### 5.2 問題用紙・解答用紙の独立生成と結合（pdf-lib）

- `pdf-lib` の `PDFDocument.load()` を使用して、問題用紙Blobと解答用紙Blobを別々に読み込みます。
- 新規の `PDFDocument` を作成し、`copyPages()` で問題用紙の全ページ、続いて解答用紙の全ページの順に結合します。
- 生成したバイト列をBlob化し、一時オブジェクトURLを発行してブラウザから自動ダウンロードします。
- ダウンロード開始後にオブジェクトURLを安全に解放します。

### 5.3 用紙別独立ページナンバリング仕様

問題用紙と解答用紙を別々のドキュメントとして生成してから結合するため、それぞれのフッターに表示されるページ番号（例: `1 / 2`）は各用紙の総ページ数を参照します。結合後も用紙をまたいでページ番号が通しになることはなく、問題用紙は「問題用紙の総ページ」、解答用紙は「解答用紙の総ページ」として独立してナンバリングされます。

### 5.4 レイアウト制御（Flexbox配置と改ページ抑制 wrap={false}）

- **Flexbox配置**: `@react-pdf/renderer` はCSS Gridをサポートしないため、解答用紙のマス目はFlexboxの折り返し（`flexWrap: 'wrap'`）と `columns` から動的に算出した幅（例: 2列なら `50%`、3列なら `33.33%`）で均等配置します。
- **改ページ抑制**: 各問題ブロックおよび各解答欄コンポーネントに `wrap={false}` を指定し、枠の途中での不自然な改ページを抑止します。

## 6. アセット・ライセンス管理

### 6.1 フォント埋め込み仕様（NotoSansJP-Regular.otf）

- 日本語フォントとして `public/fonts/NotoSansJP-Regular.otf` を `NotoSansJP` ファミリとして登録します。
- PDF生成時にフォントデータをバイナリ埋め込みするため、macOS/Windows/iOS/Android等の環境差異に関わらず文字化けせず正確に日本語を描画します。

### 6.2 ライセンスと静的配信管理（public/）

- フォントのライセンス文書は `public/fonts/OFL.txt`（SIL Open Font License）にて管理します。
- `public/` ディレクトリから静的アセットとして配信し、差し替え時もライセンス文書とセットで管理します。

## 7. 外部依存関係（外部ライブラリ）

### 7.1 利用パッケージと使用目的

| パッケージ            | 用途                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `papaparse`           | CSVファイルの解析、ヘッダーマッピング                                 |
| `@react-pdf/renderer` | ReactコンポーネントからのクライアントサイドPDF生成                    |
| `pdf-lib`             | 生成された複数のPDFドキュメント（問題用紙・解答用紙）の読み込みと結合 |

## 8. 既知の制約事項・制限仕様

### 8.1 ID重複時の挙動

CSV内の問題番号（ID）が重複している場合のエラー検証は行われません。表示番号マップ作成時、同一IDが存在すると後勝ちで上書きされます。

### 8.2 レンダリング依存の改ページ仕様

`rows` の設定値はレイアウト設定時の容量検証（`columns * rows >= count`）に使用されます。実際のPDF上での改ページ位置は、問題文の長さやフォントのレンダリング結果に基づき `@react-pdf/renderer` が動的に決定します。

### 8.3 クライアントサイド生成におけるパフォーマンス制限

PDF生成処理（レイアウト計算、フォント埋め込み、結合）はすべてクライアントのブラウザ（JavaScriptメインスレッド）上で動作します。問題数や文字数が多い場合、生成完了まで数秒程度の処理時間を要する場合があります。

## 9. 品質検証（テスト手順）

### 9.1 ビルド・型チェック検証

```bash
npm run build
```

TypeScriptの型チェック、ESLint、Next.jsの静的生成がエラーなく完了することを確認します。

### 9.2 画面表示・レイアウト変更検証

1. `public/sample-questions.csv` をアップロードし、4択・単語・自由記述の各問題が正しくプレビューされることを確認します。
2. 問題用紙プレビューと解答用紙プレビューで問題の通し番号（1〜N）が一致していることを確認します。
3. レイアウト設定モーダルを開き、問題数・列数・行数を変更して容量バリデーション（`columns * rows >= count`）が機能することを確認します。
4. 設定確定後、解答用紙プレビューの列数が正しく反映されることを確認します。

### 9.3 クロスブラウザ・出力PDF検証

1. 「PDFダウンロード」ボタンをクリックし、問題用紙と解答用紙が結合された単一のPDFが正常に保存されることを確認します。
2. macOS（Chrome, Safari）およびWindows（Chrome, Edge）で生成PDFを開き、以下を確認します：
    - 日本語の文字化けがないこと（Noto Sans JPの埋め込み確認）
    - 問題用紙・解答用紙それぞれのページ番号（独立ナンバリング）が正しく表示されていること
    - 解答欄の枠組みが途中で改ページにより分断されていないこと
