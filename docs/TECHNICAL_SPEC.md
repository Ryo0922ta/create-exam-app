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
| `app/page.tsx` | メインページ。CSV取込・プレビュー・PDF出力の統括 |
| `components/CsvUploader.tsx` | CSVファイルの選択、D&D、リセット |
| `components/LayoutSettingsModal.tsx` | レイアウト設定（問題数・行数・列数） |
| `components/PreviewPanel.tsx` | タブ切替、問題用紙・解答用紙プレビュー |
| `components/QuestionPaperPreview.tsx` | 問題用紙プレビューのHTML描画 |
| `components/AnswerSheetPreview.tsx` | 解答用紙プレビューのHTML描画 |

### データ処理・ヘルパー

| ファイル | 責務 |
| -------- | ---- |
| `types/question.ts` | 問題形式・Question 判別可能ユニオン |
| `types/layout.ts` | 問題形式ごとのレイアウト型 |
| `types/exam.ts` | 試験プレビュー・displayNumber 型 |
| `utils/csvParser.ts` | 文字コード判定、CSVパース、バリデーション |
| `lib/examLayout.ts` | 形式別抽出、連番採番、レイアウト検証 |

### PDF生成

| ファイル | 責務 |
| -------- | ---- |
| `lib/generateExamPdf.ts` | 動的インポート、PDF並列生成、結合、ダウンロード |
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

## A.5 CSV解析と状態管理

- UTF-8 厳密デコード失敗時のみ Shift-JIS 再デコード
- 問題形式の正規化（単語/語句/一問一答 → `"単語"` 等）
- `columns * rows >= count` のレイアウト検証
- エラー状態: `csvErrors`, `pdfError`, `settingsError` を独立管理

## A.6 PDF生成・結合

1. 動的 `import()` で @react-pdf/renderer / pdf-lib をロード
2. 問題用紙・解答用紙を別 Blob 生成
3. pdf-lib で結合し1ファイルダウンロード
4. 問題用紙・解答用紙のページ番号は独立ナンバリング

## A.7 フォント・ライセンス

- `public/fonts/NotoSansJP-Regular.otf` を PDF に埋め込み
- ライセンス: `public/fonts/OFL.txt`

## A.8 既知の制約（Part A）

- CSV内 ID 重複時の検証なし（後勝ち上書き）
- 改ページ位置は @react-pdf/renderer のレンダリング結果に依存
- 大量問題時はクライアント側で数秒の処理時間を要する場合あり

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
| `components/editor/AnswerSheetCanvasEditor.tsx` | Fabric 初期化、イベント、エクスポート、モーダル統括 |
| `components/editor/EditorToolbar.tsx` | ツールバー UI |
| `components/editor/modals/QuestionEditModal.tsx` | 大問作成・編集（リアルタイムプレビュー付き） |
| `components/editor/modals/ImportTextModal.tsx` | 問題文から小問記号を自動抽出 |
| `components/editor/modals/BatchReplaceModal.tsx` | 観点記号の一括置換 |
| `lib/editor/questionBlockBuilder.ts` | 大問ブロック生成（Fabric + モーダルプレビュー） |
| `lib/editor/basicPartBuilder.ts` | 基本パーツ（考査見出し枠・年組氏名欄・観点別得点枠）ブロック生成 |
| `lib/editor/fabricBlocks.ts` | 短答欄・記述欄等の汎用 Fabric ブロック |
| `lib/editor/alignmentGuides.ts` | ドラッグ中の配置ガイド・吸着 |
| `lib/editor/exportPdf.ts` | B4横 / A4分割 PDF 出力 |
| `lib/editor/exportWord.ts` | Word docx 出力 |
| `lib/editor/paperSizes.ts` | 用紙サイズ定数 |
| `lib/editor/symbolParser.ts` | 問題文から小問記号を抽出 |
| `types/editor.ts` | エディタ用型定義 |
| `.cursor/rules/` | AI 向けプロジェクトルール（描画仕様・ワークフロー） |

## B.4 Fabric アーキテクチャ

- React は `<canvas>` 要素を直接管理しない。`.fabric-canvas-host` div に Fabric をマウント
- 方眼グリッドは `app/globals.css` の `.fabric-canvas-host.grid-active` でホスト側に描画。1マス = 5mm（`GRID_CELL_MM`）、CSS 変数 `--grid-cell-x/y` は `AnswerSheetCanvasEditor` が `getGridCellSizePx()` × ズームで設定
- ズームは `canvas.setZoom()` で制御し、表示サイズと内部解像度を分離

## B.5 描画の二重化（必須原則）

大問ブロックの見た目変更時は **両方** を同じルールで更新する。

| 用途 | 関数 | 出力先 |
| ---- | ---- | ------ |
| 用紙 canvas | `createQuestionBlock()` | Fabric Group |
| モーダルプレビュー | `drawModalPreviewCanvas()` | HTML5 Canvas 2D |

## B.6 データモデル: QuestionBlockConfig

`types/editor.ts` で定義。主要フィールド:

| フィールド | 説明 |
| ---------- | ---- |
| `num`, `rubric`, `points` | 大問番号、観点区分、配点表示 |
| `pattern` | 解答枠パターン（下表） |
| `subRows/Cols/RowHeight/subLabels` | 小問複合枠用 |
| `gridRows/Cols/RowHeight` | 等分割グリッド用 |
| `circleRows/Cols/Height/circleCount` | 丸数字区分用（`circleCount = rows × cols` で後方互換） |
| `circleCommaEnabled` | 全セルに `,` を表示 |
| `circleCommaPaddingAuto/Ratio` | カンマ位置の自動/手動比率 |
| `splitRatio/splitHeight` | 左右2分割枠用 |
| `blockWidth` | 大問ブロック全体の横幅（px、200–1200、未指定時 630） |

### 解答枠パターン（pattern）

| 値 | UI名称 | 概要 |
| --- | ------ | ---- |
| `sub_parens` | (1)(2) 小問複合枠 | 行×列、小問ラベル付き |
| `grid` | 等分割グリッド | 行×列の空マス |
| `circle_comma` | 丸数字区分 | ①②③…、`,` 区切りオプション |
| `split_2` | 左右2分割枠 | 50:50 / 30:70 / 70:30 |

大問ブロックは `fabric.Group` として生成され、`customType: "question-block"` と `questionConfig`（設定の deep copy）を保持。ツールバーの「プロパティ」で `QuestionBlockPropertyPanel`（右側サイドパネル）を任意で開き、位置を維持したままリアルタイム/デバウンスでプロパティ（高さ・文字列・パターン等）を再生成・置換する。

### プロパティ編集サイドパネル（QuestionBlockPropertyPanel.tsx）

- 大問ブロックおよび基本パーツ（考査見出し枠・年組氏名欄・観点別得点枠）を選択後、ツールバーの「プロパティ」ボタンで右側からスライドイン表示。パネル内の閉じるボタンで非表示（キャンバス上の選択は維持）。選択解除で自動クローズ
- 選択されたオブジェクトの `customType` に応じて専用フォームを描画:
  - `question-block`: 番号、配点、指示文、解答枠パターン、行数・列数・高さ・カンマ設定など
  - `exam-header`: 見出し文字列、枠の幅、枠の高さ
  - `namebox`: 第1〜4欄の各ラベル（年・組・番・氏名）、枠の幅、枠の高さ
  - `score-table`: 各列の観点区分名（知・技 等）と配点注記（/50 等）、枠の幅、枠の高さ
- 高さ・幅・行数・列数などの数値/スライダー変更は即時（キャンバスを再生成して座標維持で置換）
- テキスト入力はデバウンス（300ms）および blur 時に即時確定
- 新規大問作成はツールバーの「大問を作成・追加」（`QuestionEditModal`）を使用

## B.7 丸数字（circle_comma）描画仕様

- レイアウト: `buildCircleCommaLayout()` — `cellW = blockWidth / cols`, `totalHeight = rows × rowHeight`
- 番号付け: 行優先 `index = r * cols + c`（①〜⑮、以降は数値フォールバック）
- 枠線: **外枠1本** + 列間縦線（`cols - 1`）+ 行間横線（`rows - 1`）。セル個別枠は使わない
- カンマ: `padding = max(5px, cellW × ratio)`。比率は **列数** をキーにアンカー補間（3→0.467 … 7→0.402）
- 後方互換: `circleCols ?? circleCount`, `circleRows ?? 1`

## B.8 配置ガイド（alignmentGuides.ts）

- ドラッグ中: rose 色破線で余白内側・折り目内側・他オブジェクト整列位置を表示
- 3点以上の等分配置スナップ: 左/右 A4 面（横）・全幅（縦）で gap 等分
- 吸着（スナップ）: `getGridCellSizePx('x'/'y')`（5mm 相当）ベース + ガイド位置への吸着
- エクスポート時: `stripAlignmentGuidesForExport()` でガイド線を一時除去

### 余白ガイド（marginGuides.ts）

- `PaperMargins`: `verticalMm`（10–25）, `outerHorizontalMm`（外端 10–20）, `foldHorizontalMm`（折り目内側 10–20）
- 表示: HTML オーバーレイ（外端4本 + 折り目内側2本 + 上下2本）。PDF 非含有
- スナップ領域: `computeMarginRegions()` で左/右 A4 面の有効配置エリアを算出

## B.9 用紙サイズ

| 定数 | 値 |
| ---- | --- |
| デフォルト用紙 | B4横 1376×972 px |
| 大問ブロック標準幅 | `SECTION_STANDARD_WIDTH = 630` px |
| 方眼1マス | `GRID_CELL_MM = 5` mm（B4横で横約 18.9px・縦約 18.9px） |
| 方眼スナップ | `getGridCellSizePx('x'/'y')` |

## B.10 エクスポート

### PDF（exportPdf.ts）

1. `getCleanCanvasDataUrl()` — 選択解除、ガイド除去、方眼 OFF、zoom=1、白背景、multiplier=2 で PNG 化
2. **B4横 PDF** — 1ページに全 canvas を embed
3. **A4分割 PDF** — canvas 左半/右半をそれぞれ A4 1ページに embed（計2ページ）

### Word（exportWord.ts）

- canvas を PNG 化し docx に埋め込み（ラスターベース）

## B.11 基本パーツおよびその他 Fabric オブジェクト

基本パーツ（`basicPartBuilder.ts` で生成）:

- **考査見出し枠 (`exam-header`)**: `createExamHeaderBlock()`, `ExamHeaderConfig`
- **年組氏名欄 (`namebox`)**: `createNameboxBlock()`, `NameboxConfig`
- **観点別得点枠 (`score-table`)**: `createScoreTableBlock()`, `ScoreTableConfig`

`fabricBlocks.ts` で定義される汎用ブロック（`customType` 例）:

- `短答欄`, `年組氏名・得点欄`, `タイトル`, `記述欄(N行)`, `マス目(N字)`, `端数セル`

## B.12 既知の制約（Part B）

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
2. 問題用紙・解答用紙の通し番号が一致すること
3. PDF 結合ダウンロードが正常に動作すること

### Part B 検証

1. `/editor` で初期サンプル大問が表示・ドラッグできること
2. 大問のダブルクリック編集でプレビューと canvas の見た目が一致すること
3. B4横 PDF / A4分割 PDF / Word docx がダウンロードできること
4. 配置ガイド ON 時、エクスポート PDF にガイド線が含まれないこと
