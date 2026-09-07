# 解答用紙作成アプリ 技術仕様書

## 1. アーキテクチャ

Next.js App Router、React、TypeScript、Tailwind CSSで構築したクライアントサイドアプリケーションです。CSVの解析とPDF生成はブラウザで実行します。

## 2. 主要ファイルと責務

| ファイル                              | 責務                                                                 |
| ------------------------------------- | -------------------------------------------------------------------- |
| `app/page.tsx`                        | 画面状態とイベントを各コンポーネント・ユーティリティへ接続          |
| `components/CsvUploader.tsx`          | CSVファイル選択、ドラッグ&ドロップ、ファイル名、リセット操作        |
| `components/LayoutSettingsModal.tsx`  | レイアウト設定の入力と検証エラー表示                                |
| `components/PreviewPanel.tsx`         | タブ切替、プレビュー操作、問題・解答用紙プレビューの切替            |
| `components/QuestionPaperPreview.tsx` | 問題用紙プレビューの描画                                            |
| `components/AnswerSheetPreview.tsx`   | 解答用紙プレビューの描画                                            |
| `types/question.ts`                   | CSV行、問題形式、問題データの型定義                                  |
| `types/layout.ts`                     | 問題形式ごとの表示件数・横・縦のレイアウト型                         |
| `types/exam.ts`                       | 問題グループと表示番号を含む試験プレビューの共有型                   |
| `utils/csvParser.ts`                  | 文字コードの判定、CSV解析、問題データへの変換                        |
| `lib/examLayout.ts`                   | 問題の形式別抽出、表示番号作成、レイアウト初期化・検証               |
| `components/pdfDocuments.tsx`         | React PDF形式の問題用紙・解答用紙の描画                              |
| `lib/generateExamPdf.ts`              | PDF生成、結合、ダウンロード                                          |
| `public/fonts/NotoSansJP-Regular.otf` | PDFへ埋め込む日本語フォント                                          |
| `public/fonts/OFL.txt`                | 同梱フォントのライセンス                                             |

## 3. データモデル

`Question` は問題形式を `type` で識別する判別可能ユニオンです。

```ts
type QuestionType = "4択" | "単語" | "自由記述";

type Question = ChoiceQuestion | WordQuestion | EssayQuestion;

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

type NumberedQuestion = {
    question: Question;
    displayNumber: number;
};
```

`ChoiceQuestion` は4つの選択肢を持ち、`EssayQuestion` は任意の `maxChars` を持ちます。`WordQuestion` に形式固有の追加属性はありません。

## 4. CSV解析

`decodeCsvFile()` は最初にUTF-8として厳密にデコードし、失敗した場合のみShift-JISとして再デコードします。

`parseQuestionsCsv()` はPapaParseでヘッダー付きCSVを解析し、次を実施します。

- ヘッダーの前後空白を除去する
- `問題番号` と `問題文` の存在を検証する
- 問題番号が数値であること、問題文が空でないことを検証する
- `単語`、`語句`、`一問一答` を単語回答へ正規化する
- `自由記述`、`記述`、`論述` を自由記述へ正規化する
- 空の末尾列などに起因する `TooFewFields`、`TooManyFields` をエラー表示から除外する

未指定または未知の問題形式は4択として扱います。自由記述の文字数制限は、正の整数として解釈できる場合だけ保存します。

## 5. 画面状態とプレビュー

`app/page.tsx` はCSV、レイアウト、タブ、PDF生成の状態を保持し、具体的なUIは各コンポーネントへ委譲します。`lib/examLayout.ts` はCSVから得た全問題を形式ごとに分け、`appliedSettings` の表示件数で切り出します。切り出した全問題をCSVの `id` 昇順に並べ、`previewQuestions` で `displayNumber` を1から採番します。

`displayNumbers` は問題IDと表示番号の対応表です。問題用紙、解答用紙、PDFはこの対応表を共有するため、用紙間で連番が一致します。

レイアウト設定の確定時には、各形式で以下を検証します。

```text
count <= CSV内の該当問題数
columns x rows >= count
```

エラー状態はCSV解析の `csvErrors`、PDF生成の `pdfError`、設定検証の `settingsError` に分けて保持します。これにより、PDF生成を試してもCSVの解析エラーは消去されません。

## 6. PDF生成

`generateExamPdf()` はPDFダウンロードのクリック時にのみ、`@react-pdf/renderer`、`pdf-lib`、PDF用コンポーネントを動的に読み込みます。

処理は次の順序です。

1. `QuestionSheetDocument` と `AnswerSheetDocument` を並列にBlobへ生成する。
2. `pdf-lib` の `PDFDocument.load()` で各Blobを読み込む。
3. `copyPages()` で問題用紙、解答用紙の順に新しいPDFへ複製する。
4. 生成バイト列をBlob化し、一時URLを使ってダウンロードする。
5. ダウンロード後にBlob URLを解放する。

問題用紙と解答用紙は結合前に別々のPDFとして生成されます。各ドキュメントの固定フッターはそれぞれの総ページ数を参照するため、結合後もページ番号は用紙ごとに独立します。

`@react-pdf/renderer` はCSS Gridをサポートしないため、解答欄はFlexboxの折り返しと `columns` から計算した幅で配置します。問題ブロックと解答欄には `wrap={false}` を指定し、途中改ページを抑制します。

## 7. フォントとライセンス

PDFの全テキストには `NotoSansJP` として登録した `public/fonts/NotoSansJP-Regular.otf` を使用します。フォントをPDFに埋め込むため、macOSとWindowsで利用者の端末に日本語フォントがなくても文字化けしません。

フォントのライセンスは `public/fonts/OFL.txt` を参照します。フォントファイルは `public/` 配下の静的配信対象であるため、差し替える場合も再配布可能なフォントとライセンス文書をセットで管理します。

## 8. 依存関係

| パッケージ            | 用途                             |
| --------------------- | -------------------------------- |
| `papaparse`           | CSVの解析                        |
| `@react-pdf/renderer` | ReactコンポーネントからのPDF生成 |
| `pdf-lib`             | 問題用紙PDFと解答用紙PDFの結合   |

## 9. 既知の制約

- CSV内の問題番号が重複しているかは検証していません。表示番号の対応表では、同じIDの後の問題が上書きされます。
- 問題形式が空欄または未知の値の場合、4択として扱います。
- `rows` はレイアウト設定時の容量検証に使用します。PDFの実際の改ページは問題文の長さとPDFレンダラーのレイアウトで決まります。
- PDFはクライアント側で生成します。問題数や画像などのデータ量が大きい場合、生成開始まで時間がかかる可能性があります。

## 10. 検証手順

1. `npm run build` を実行し、コンパイル、lint、型チェック、静的生成が成功することを確認します。
2. `public/sample-questions.csv` を読み込み、各形式のプレビューと連番を確認します。
3. レイアウト設定を変更し、容量検証と解答欄の列数が反映されることを確認します。
4. PDFをダウンロードし、日本語、問題文、選択肢、文字数制限、解答欄、用紙別のページ番号を確認します。
5. macOSとWindowsの主要ブラウザでPDFを開き、文字化けやレイアウト崩れがないことを確認します。
