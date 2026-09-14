# 解答用紙作成アプリ 技術仕様書

関連ドキュメント:

- [利用ガイド](./USER_GUIDE.md) — 操作手順（利用者向け）
- [業務フロー](./BUSINESS_WORKFLOW.md) — 機能間関係・データの流れ（開発者向け）

本アプリは **2つの独立機能** で構成される。いずれもブラウザ完結型のクライアントサイド処理であり、サーバーへのデータ送信は行わない。

| 機能 | ルート | 主な技術 |
|------|--------|----------|
| Part A: CSV 試験用紙ジェネレータ | `/` | PapaParse, `@react-pdf/renderer`, pdf-lib |
| Part B: 解答用紙キャンバスエディタ | `/editor` | Fabric.js, pdf-lib, docx |

トップページ（`app/page.tsx`）から `/editor` へのリンクでエディタへ遷移できる。

---

# Part A: CSV 試験用紙ジェネレータ

## A.1 システム概要

Next.js App Router、React、TypeScript、Tailwind CSSで構築。CSVファイルの解析、状態管理、プレビュー描画、PDFの生成および結合ダウンロードをブラウザ上で実行する。

## A.2 使用技術スタック

- **フロントエンドフレームワーク**: Next.js (App Router), React
- **プログラミング言語**: TypeScript
- **スタイリング**: Tailwind CSS, PostCSS
- **CSV解析**: PapaParse
- **PDF生成・結合**: @react-pdf/renderer, pdf-lib

## A.3 ディレクトリ・モジュール構造

### UIコンポーネント

| ファイル | 責務 |
| -------- | ---- |
| `app/page.tsx` | メインページ。CSV取込・プレビュー・編集・同期・PDF/CSV出力の統括 |
| `components/CsvUploader.tsx` | CSVファイルの選択、D&D、リセット |
| `components/LayoutSettingsModal.tsx` | レイアウト設定（問題数・行数・列数） |
| `components/PreviewPanel.tsx` | タブ切替、同期・CSV出力・PDF対象選択、問題用紙・解答用紙プレビュー |
| `components/QuestionPaperPreview.tsx` | 問題用紙プレビューのHTML描画（インライン編集対応） |
| `components/AnswerSheetPreview.tsx` | 解答用紙プレビューのHTML描画 |

### データ処理・ヘルパー

| ファイル | 責務 |
| -------- | ---- |
| `types/question.ts` | 問題形式・Question 判別可能ユニオン |
| `types/layout.ts` | 問題形式ごとのレイアウト型 |
| `types/exam.ts` | 試験プレビュー・displayNumber 型 |
| `utils/csvParser.ts` | 文字コード判定、CSVパース・バリデーション、CSVエクスポート |
| `lib/examLayout.ts` | 形式別抽出、連番採番、レイアウト検証 |

### PDF生成

| ファイル | 責務 |
| -------- | ---- |
| `lib/generateExamPdf.ts` | 動的インポート、PDF並列生成、結合、ダウンロード（出力対象選択） |
| `components/pdfDocuments.tsx` | @react-pdf/renderer による問題用紙・解答用紙レイアウト |

## A.4 データモデル

### Question（判別可能ユニオン）

```ts
type QuestionType = "4択" | "単語" | "自由記述";
type Question = ChoiceQuestion | WordQuestion | EssayQuestion;
```

### LayoutSettings

各形式の `count`（出力件数）、`columns`（横）、`rows`（縦）を管理。

### NumberedQuestion / QuestionGroups

元CSVのIDとは別に `displayNumber` を付与。問題用紙・解答用紙・PDFで同一番号を参照。

### PdfDownloadTarget

```ts
type PdfDownloadTarget = "all" | "question" | "answer";
```

## A.5 状態管理

`app/page.tsx` で管理する主要状態:

| 状態 | 説明 |
|------|------|
| `questions` | 現在の問題データ（プレビュー編集を反映） |
| `originalQuestions` | CSVアップロード直後のスナップショット |
| `syncedQuestions` | 解答用紙プレビュー・PDF解答用紙に反映済みの問題データ |
| `appliedSettings` | 確定済みレイアウト設定 |
| `isEdited` | `questions !== originalQuestions` |
| `hasUnsyncedChanges` | `questions !== syncedQuestions` |

**問題用紙と解答用紙の分離:**

- 問題用紙プレビュー・PDF（問題用紙）は `questions`（＋`createExamPreview(questions, ...)`）を参照
- 解答用紙プレビュー・PDF（解答用紙）は `syncedQuestions` を参照
- 問題用紙を編集した後、ユーザーが「解答用紙に同期」を実行すると `syncedQuestions ← questions`

## A.6 CSV解析とレイアウト検証

- UTF-8 厳密デコード失敗時のみ Shift-JIS 再デコード
- 問題形式の正規化（単語/語句/一問一答 → `"単語"` 等）
- `columns * rows >= count` のレイアウト検証
- エラー状態: `csvErrors`, `pdfError`, `settingsError` を独立管理

## A.7 プレビュー編集・同期・エクスポート

### 問題用紙プレビュー編集

- `QuestionPaperPreview` → `onUpdateQuestion(id, partial)` で問題文・選択肢等をインライン編集
- 編集は `questions` に即時反映（解答用紙には自動反映されない）

### 解答用紙への同期

- `handleSyncToAnswerSheet()` — `syncedQuestions` を `questions` の内容で更新
- `hasUnsyncedChanges` が true のときのみ「解答用紙に同期」ボタンが有効

### CSV再エクスポート

- `exportQuestionsToCsv(questions, fileName)` — 編集後の `questions` を CSV としてダウンロード

### 編集のリセット

- `handleResetQuestions()` — `questions` と `syncedQuestions` を `originalQuestions` に戻す

## A.8 PDF生成・結合

1. 動的 `import()` で @react-pdf/renderer / pdf-lib をロード
2. `target` に応じて生成ページを選択:
   - `all`: 問題用紙 + 解答用紙を結合
   - `question`: 問題用紙のみ
   - `answer`: 解答用紙のみ（`syncedQuestions` ベース）
3. pdf-lib で結合し1ファイルダウンロード
4. 問題用紙・解答用紙のページ番号は独立ナンバリング

## A.9 フォント・ライセンス

- `public/fonts/NotoSansJP-Regular.otf` を PDF に埋め込み
- ライセンス: `public/fonts/OFL.txt`

## A.10 既知の制約（Part A）

- CSV内 ID 重複時の検証なし（後勝ち上書き）
- 改ページ位置は @react-pdf/renderer のレンダリング結果に依存
- 大量問題時はクライアント側で数秒の処理時間を要する場合あり
- Part B（エディタ）とのデータ連携なし

---

# Part B: 解答用紙キャンバスエディタ

## B.1 概要

B4横（364×257mm）サイズの Fabric.js キャンバス上で、大問ブロック・基本パーツを配置し、PDF / Word で出力するビジュアルエディタ。

- エントリ: `app/editor/page.tsx` → `AnswerSheetCanvasEditor`（`dynamic` + `ssr: false`）
- 状態はセッション内のみ（永続化・サーバー保存なし）
- Part A（CSV ジェネレータ）とのデータ連携は現状なし

## B.2 追加技術スタック

| パッケージ | 用途 |
| ---------- | ---- |
| `fabric` | キャンバス上のオブジェクト描画・ドラッグ |
| `docx` | Word (.docx) 出力 |
| `pdf-lib` | Canvas 画像の PDF 埋め込み |

## B.3 ディレクトリ構造

| パス | 責務 |
| ---- | ---- |
| `components/editor/AnswerSheetCanvasEditor.tsx` | Fabric 初期化、イベント、エクスポート、モーダル・サイドパネル統括 |
| `components/editor/EditorToolbar.tsx` | ツールバー UI（方眼・吸着・配置ガイド・余白ガイド・ズーム） |
| `components/editor/QuestionBlockPropertyPanel.tsx` | 選択ブロックのプロパティ編集サイドパネル |
| `components/editor/modals/QuestionEditModal.tsx` | 大問の新規作成（リアルタイムプレビュー付き） |
| `components/editor/modals/ImportTextModal.tsx` | 問題文から小問記号を自動抽出 |
| `components/editor/modals/BatchReplaceModal.tsx` | 観点記号の一括置換 |
| `lib/editor/questionBlockBuilder.ts` | 大問ブロック生成（Fabric + モーダルプレビュー） |
| `lib/editor/basicPartBuilder.ts` | 基本パーツ（考査見出し枠・年組氏名欄・観点別得点枠）ブロック生成 |
| `lib/editor/fabricBlocks.ts` | 短答欄・記述欄等の汎用 Fabric ブロック |
| `lib/editor/alignmentGuides.ts` | ドラッグ中の配置ガイド・吸着 |
| `lib/editor/marginGuides.ts` | 余白ガイド線・有効配置領域の算出 |
| `lib/editor/exportPdf.ts` | B4横 / A4分割 PDF 出力 |
| `lib/editor/exportWord.ts` | Word docx 出力 |
| `lib/editor/paperSizes.ts` | 用紙サイズ・方眼・大問横幅定数 |
| `lib/editor/symbolParser.ts` | 問題文から小問記号を抽出 |
| `types/editor.ts` | エディタ用型定義 |
| `.cursor/rules/` | AI 向けプロジェクトルール（描画仕様・ワークフロー） |

## B.4 Fabric アーキテクチャ

- React は `<canvas>` 要素を直接管理しない。`.fabric-canvas-host` div に Fabric をマウント
- 方眼グリッドは `app/globals.css` の `.fabric-canvas-host.grid-active` でホスト側に描画
  - 1マス = `GRID_CELL_MM`（5mm）、`getGridCellSizePx()` で px 換算
  - 太線方眼: `GRID_MAJOR_CELL_COUNT = 5`（25mm ごと）
  - CSS 変数 `--grid-cell-x/y`, `--grid-major-x/y` はズームに追従
- ズームは `canvas.setZoom()` で制御し、表示サイズと内部解像度を分離

## B.5 描画の二重化（必須原則）

大問ブロックの見た目変更時は **両方** を同じルールで更新する。

| 用途 | 関数 | 出力先 |
| ---- | ---- | ------ |
| 用紙 canvas | `createQuestionBlock()` | Fabric Group |
| モーダルプレビュー（新規作成時） | `drawModalPreviewCanvas()` | HTML5 Canvas 2D |

既存大問の編集はプロパティパネル経由で canvas 上を直接再生成する（モーダルプレビューは使用しない）。

## B.6 データモデル

### QuestionBlockConfig（大問ブロック）

| フィールド | 説明 |
| ---------- | ---- |
| `num`, `rubric`, `points` | 大問番号、観点区分、配点表示 |
| `pattern` | 解答枠パターン（下表） |
| `subRows/Cols/RowHeight/subLabels` | 小問複合枠用 |
| `gridRows/Cols/RowHeight` | 等分割グリッド用 |
| `circleRows/Cols/Height/circleCount` | 既存の丸数字区分用（`circleCount = rows × cols` で後方互換） |
| `circleCommaEnabled` | 既存の丸数字区分で全セルに `,` を表示 |
| `circleCommaPaddingAuto/Ratio` | 既存の丸数字区分のカンマ位置 |
| `splitRatio/splitHeight` | 左右2分割枠用 |
| `blockWidth` | 大問ブロック全体の横幅（px、200–1200、未指定時 630） |

### EditorBlockType / 基本パーツ設定型

```ts
type EditorBlockType = "question-block" | "exam-header" | "namebox" | "score-table";

interface ExamHeaderConfig { text: string; width: number; height: number; }
interface NameboxConfig {
  width: number;
  height: number;
  labels: [string, string, string, string];
  /** 第1〜3欄の幅（px）。第4欄（氏名）は全体幅の残り。 */
  columnWidths?: [number, number, number];
}
interface ScoreTableConfig {
  width: number;
  height: number;
  colHeaders: string[];
  maxScores: string[];
  /** [観点名行, 配点行] の高さ（px）。未指定時は総高さを50:50で分割。 */
  rowHeights?: [number, number];
}
```

### PaperMargins（余白ガイド）

```ts
interface PaperMargins {
  verticalMm: number;        // 上下余白
  outerHorizontalMm: number; // 用紙外端（左端・右端）
  foldHorizontalMm: number;  // 中央折り目内側
}
```

- 既定値: `DEFAULT_PAPER_MARGINS` — vertical 10mm, outer 10mm, fold 5mm
- 制限: `MARGIN_LIMITS` — vertical 5–25mm, outer 5–20mm, fold 5–20mm

### 解答枠パターン（pattern）

| 値 | UI名称 | 概要 |
| --- | ------ | ---- |
| `sub_parens` | (1)(2) 小問複合枠 | 行×列、小問ラベル付き |
| `grid` | 等分割グリッド | 行×列の空マス |
| `circle_comma` | 丸数字区分（既存） | ①②③…、`,` 区切りオプション |
| `split_2` | 左右2分割枠 | 50:50 / 30:70 / 70:30 |

### Fabric Group が保持する設定

| customType | 保持フィールド | 生成関数 |
|------------|---------------|----------|
| `question-block` | `questionConfig` | `createQuestionBlock()` |
| `exam-header` | `examHeaderConfig` | `createExamHeaderBlock()` |
| `namebox` | `nameboxConfig` | `createNameboxBlock()` |
| `score-table` | `scoreTableConfig` | `createScoreTableBlock()` |

## B.7 編集フロー（新規 vs 既存）

| 操作 | UI | 処理 |
|------|-----|------|
| 大問の新規作成 | 「大問を作成・追加」→ `QuestionEditModal` | モーダルプレビュー + 確定時 `createQuestionBlock` |
| 大問の既存編集 | 選択 → ツールバー「プロパティ」→ `QuestionBlockPropertyPanel` | `replaceSelectedBlock` で座標維持・再生成 |
| 基本パーツ編集 | 選択 → 「プロパティ」 | 同上（各 builder 関数で再生成） |
| 問題文インポート | `ImportTextModal` | 記号抽出 → 小問複合枠の大問を新規追加 |

プロパティパネルの更新挙動:

- 数値・スライダー変更: 即時再生成
- テキスト入力: 300ms デバウンス + blur 時即時確定
- パネル閉じる: 選択は維持。選択解除で自動クローズ

## B.8 既存の丸数字（circle_comma）描画仕様

- レイアウト: `buildCircleCommaLayout()` — `cellW = blockWidth / cols`, `totalHeight = rows × rowHeight`
- 番号付け: 行優先 `index = r * cols + c`（①〜⑮、以降は数値フォールバック）
- 枠線: **外枠1本** + 列間縦線（`cols - 1`）+ 行間横線（`rows - 1`）。セル個別枠は使わない
- カンマ: `padding = max(5px, cellW × ratio)`。比率は **列数** をキーにアンカー補間（3→0.467 … 7→0.402）
- 後方互換: `circleCols ?? circleCount`, `circleRows ?? 1`

## B.9 配置ガイド・余白ガイド

### 配置ガイド（alignmentGuides.ts）

- ドラッグ中: rose 色破線（`#f43f5e`）で余白内側・折り目内側・他オブジェクト整列位置を表示
- 3点以上の等分配置スナップ: 左/右 A4 面（横）・全幅（縦）で gap 等分
- 吸着: `getGridCellSizePx('x'/'y')`（5mm 相当）ベース + ガイド位置への吸着
- エクスポート時: `stripAlignmentGuidesForExport()` で Fabric 上のガイド線を一時除去

### 余白ガイド（marginGuides.ts）

- `computeMarginGuideLines()` — mm → px 換算で外端4本 + 折り目内側2本 + 上下2本
- 表示: HTML オーバーレイ（amber 点線）。PDF/Word には含まれない
- `computeMarginRegions()` — 左/右 A4 面の有効配置領域を算出し、配置ガイドの吸着に利用
- ツールバー: 「余白ガイド」ON + スライダー（上下 / 外側 / 折り目）

## B.10 用紙サイズ

| 定数 | 値 |
| ---- | --- |
| デフォルト用紙 | B4横 1376×972 px |
| 大問ブロック標準幅 | `SECTION_STANDARD_WIDTH = 630` px |
| 大問横幅制限 | `QUESTION_BLOCK_WIDTH_LIMITS` — min 200, max 1200 |
| 方眼1マス | `GRID_CELL_MM = 5` mm |
| 方眼スナップ | `getGridCellSizePx('x'/'y')` |

## B.11 エクスポート

### PDF（exportPdf.ts）

1. `getCleanCanvasDataUrl()` — 選択解除、配置ガイド除去、方眼 OFF、zoom=1、白背景、multiplier=2 で PNG 化
2. **B4横 PDF** — 1ページに全 canvas を embed
3. **A4分割 PDF** — canvas 左半/右半をそれぞれ A4 1ページに embed（計2ページ）

余白ガイドは HTML オーバーレイのため、エクスポート処理の対象外（最初から canvas に含まれない）。

### Word（exportWord.ts）

- canvas を PNG 化し docx に埋め込み（ラスターベース）

## B.12 その他 Fabric オブジェクト

`fabricBlocks.ts` で定義される汎用ブロック（`customType` 例）:

- `短答欄`, `年組氏名・得点欄`, `タイトル`, `記述欄(N行)`, `マス目(N字)`, `端数セル`

## B.13 既知の制約（Part B）

- レイアウトデータの保存/読込機能なし（リロードで初期状態に戻る）
- PDF/Word は画像ベースのため、テキスト選択・再編集不可
- A4分割 PDF は B4横 canvas の左右半分を切り出す方式（折り目位置固定）

---

## 品質検証

```bash
npm run build
```

TypeScript 型チェック、ESLint、Next.js 静的生成がエラーなく完了することを確認する。

### Part A 検証

1. `public/sample-questions.csv` をアップロードし各問題形式がプレビューされること
2. 問題用紙プレビューで問題文を編集し、「解答用紙に同期」後に解答用紙へ反映されること
3. 問題用紙・解答用紙の通し番号が一致すること（同期後）
4. PDF 対象選択（全部 / 問題のみ / 解答のみ）が正常に動作すること
5. CSV エクスポートで編集内容が出力されること

### Part B 検証

1. `/editor` で初期サンプル大問が表示・ドラッグできること
2. 大問を選択しプロパティパネルで編集後、canvas の見た目が更新されること
3. 新規大問作成モーダルのプレビューと canvas の見た目が一致すること
4. 余白ガイド ON/OFF・スライダー変更が表示に反映されること
5. B4横 PDF / A4分割 PDF / Word docx がダウンロードできること
6. 配置ガイド ON 時、エクスポート PDF にガイド線が含まれないこと
7. 余白ガイドが PDF/Word に含まれないこと
