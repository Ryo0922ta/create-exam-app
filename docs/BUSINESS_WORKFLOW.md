# 解答用紙作成アプリ 業務フロー

関連ドキュメント:

- [利用ガイド](./USER_GUIDE.md) — 操作手順（利用者向け）
- [技術仕様書](./TECHNICAL_SPEC.md) — モジュール・型定義の詳細

**読者**: 開発・運用担当者（機能間関係・データの流れ）

---

## 1. システム全体像

本リポジトリは **2つの独立アプリケーション** を1つの Next.js プロジェクトに同居させている。

```mermaid
flowchart TB
    subgraph client [Browser Client]
        Home["/ app/page.tsx"]
        Editor["/editor app/editor/page.tsx"]
    end
    Home --> CSVFlow[CSV Parse Preview Edit Sync]
    Editor --> CanvasFlow[Fabric Canvas Edit Export]
    CSVFlow --> PDF1["PDF: 問題用紙 + 解答用紙"]
    CanvasFlow --> PDF2["PDF: B4横 or A4分割"]
    CanvasFlow --> DOCX["Word docx"]
```

**現状の制約**: 両機能間にデータ連携はない。CSV で生成した問題データをエディタへ渡す機能は未実装。

---

## 2. 機能マップ

| 機能 | ルート | 入口 UI | 入力 | 出力 |
|------|--------|---------|------|------|
| CSV ジェネレータ | `/` | CsvUploader | CSV ファイル | 問題+解答 PDF（@react-pdf）、編集後 CSV |
| キャンバスエディタ | `/editor` | トップリンク | 手動配置・テキスト貼付 | B4 PDF / A4分割 PDF / docx |

---

## 3. フローA: CSV ジェネレータ

```mermaid
sequenceDiagram
    participant User
    participant Page as app/page.tsx
    participant Parser as csvParser
    participant Layout as examLayout
    participant QPreview as QuestionPaperPreview
    participant APreview as AnswerSheetPreview
    participant PDF as generateExamPdf

    User->>Page: CSV アップロード
    Page->>Parser: decodeCsvFile + parseQuestionsCsv
    Parser-->>Page: Question[] or errors
    Page->>Layout: createLayoutSettings + validate
    User->>Page: レイアウト確定
    Page->>Layout: createExamPreview
    Layout-->>QPreview: questions ベース
    Layout-->>APreview: syncedQuestions ベース

    opt 問題用紙編集
        User->>QPreview: 問題文・選択肢を編集
        QPreview->>Page: handleUpdateQuestion
        Note over Page: hasUnsyncedChanges = true
        User->>Page: 解答用紙に同期
        Page->>Page: syncedQuestions <- questions
    end

    opt CSV再出力
        User->>Page: CSVエクスポート
        Page->>Parser: exportQuestionsToCsv
    end

    User->>Page: PDF ダウンロード target選択
    Page->>PDF: generateExamPdf
    PDF-->>User: PDF Blob
```

**状態の要点**:

| 状態 | 役割 |
|------|------|
| `questions` | 問題用紙プレビュー・PDF（問題用紙）のソース |
| `syncedQuestions` | 解答用紙プレビュー・PDF（解答用紙）のソース |
| `originalQuestions` | アップロード直後のスナップショット（リセット用） |
| `appliedSettings` | 確定済みレイアウト |
| `displayNumber` | 問題用紙・解答用紙・PDF で共有する通し番号（同期後） |

**PDF出力対象** (`PdfDownloadTarget`):

- `all` — 問題用紙 + 解答用紙
- `question` — 問題用紙のみ（`questions` ベース）
- `answer` — 解答用紙のみ（`syncedQuestions` ベース）

---

## 4. フローB: キャンバスエディタ

```mermaid
sequenceDiagram
    participant User
    participant Editor as AnswerSheetCanvasEditor
    participant Fabric as fabric.Canvas
    participant Modal as QuestionEditModal
    participant Panel as QuestionBlockPropertyPanel
    participant Builder as questionBlockBuilder
    participant Basic as basicPartBuilder
    participant Export as exportPdf/exportWord

    User->>Editor: /editor アクセス
    Editor->>Fabric: ホスト div に canvas 初期化
    Editor->>Fabric: サンプル大問・基本パーツ配置

    alt 大問新規作成
        User->>Modal: 大問を作成・追加
        Modal->>Builder: drawModalPreviewCanvas
        User->>Modal: 設定確定
        Modal->>Builder: createQuestionBlock
        Builder->>Fabric: Group 追加
    end

    alt 大問・基本パーツ編集
        User->>Fabric: 枠を選択
        User->>Panel: プロパティを開く
        Panel->>Editor: onUpdate config
        Editor->>Builder: replaceSelectedBlock
        Builder->>Fabric: Group 置換
    end

    alt 問題文インポート
        User->>Modal: ImportTextModal
        Modal->>Modal: extractSymbolsFromText
        Modal->>Builder: createQuestionBlock sub_parens
        Builder->>Fabric: Group 追加
    end

    User->>Editor: ドラッグ配置
    Editor->>Editor: alignmentGuides + marginRegions 吸着

    User->>Editor: PDF/Word 保存
    Editor->>Export: getCleanCanvasDataUrl
    Export-->>User: ファイルダウンロード
```

**状態の要点**:

- Fabric canvas 上のオブジェクトが唯一のソースオブジェクト
- 各 Group が `customType` と対応する config を保持:

| customType | config フィールド |
|------------|------------------|
| `question-block` | `questionConfig` |
| `exam-header` | `examHeaderConfig` |
| `namebox` | `nameboxConfig` |
| `score-table` | `scoreTableConfig` |

- 永続化レイヤーなし（リロードで消失）

---

## 5. 大問ブロック生成フロー

```mermaid
flowchart LR
    Config[QuestionBlockConfig] --> Builder[createQuestionBlock]
    Config --> Preview[drawModalPreviewCanvas]
    Builder --> LayoutFn[buildCircleCommaLayout 等]
    LayoutFn --> FabricItems[Rect Line Text]
    FabricItems --> Group[fabric.Group]
    Group --> Canvas[fabric.Canvas]
    Preview --> Canvas2D[HTML5 Canvas 2D]
```

| pattern | レイアウト関数 | 描画内容 |
|---------|---------------|----------|
| `sub_parens` | 行×列ループ | セル枠 + ラベル枠 |
| `grid` | 行×列ループ | セル枠のみ |
| `circle_comma` | `buildCircleCommaLayout` | 外枠1 + 縦横内部線 + 丸数字/カンマ |
| `split_2` | 比率計算 | 左右2 Rect |

`blockWidth` は `clampQuestionBlockWidth()` で 200–1200px に制限。未指定時 `SECTION_STANDARD_WIDTH`（630px）。

---

## 6. プレビュー・編集の3経路

```
QuestionBlockConfig
    ├─→ drawModalPreviewCanvas (width=580)  … 新規作成モーダルのプレビュー
    ├─→ createQuestionBlock (width=blockWidth) … Fabric canvas 上の Group
    └─→ QuestionBlockPropertyPanel … 既存ブロックの直接編集（プレビューなし、canvas 再生成）
```

**開発時ルール**（`.cursor/rules/answer-paper-editor-workflow.mdc`）:

- 描画変更は `createQuestionBlock` と `drawModalPreviewCanvas` を必ずペア更新
- 型変更は `types/editor.ts` + モーダル + プロパティパネル + デフォルト config まで一式

---

## 7. 余白ガイドと配置ガイドの連携

```mermaid
flowchart TD
    Margins[PaperMargins] --> Compute[computeMarginGuideLines]
    Compute --> Overlay[HTML amber オーバーレイ]
    Margins --> Regions[computeMarginRegions]
    Regions --> Align[alignmentGuides 吸着領域]
    Drag[オブジェクトドラッグ] --> Align
    Align --> Snap[rose 破線 + スナップ]
    Export[PDF/Word 出力] --> Strip[配置ガイド除去 + 方眼OFF]
    Note1[余白ガイドはHTMLのため出力対象外]
```

- 余白ガイド: `marginGuides.ts` — 編集補助のみ、PDF/Word 非含有
- 配置ガイド: `alignmentGuides.ts` — Fabric 上の rose 破線、エクスポート時 `stripAlignmentGuidesForExport()` で除去
- 方眼: `globals.css` — エクスポート時 `grid-active` クラスを一時除去

---

## 8. エクスポートフロー

```mermaid
flowchart TD
    Canvas[fabric.Canvas] --> Clean[getCleanCanvasDataUrl]
    Clean --> StripGuides[配置ガイド除去]
    Clean --> StripGrid[方眼OFF]
    Clean --> ZoomReset[zoom=1 白背景]
    ZoomReset --> PNG[PNG multiplier=2]
    PNG --> Branch{出力形式}
    Branch -->|B4横| PDF1[pdf-lib 1page B4]
    Branch -->|A4分割| PDF2[pdf-lib left+right 2pages]
    Branch -->|Word| DOCX[docx embed PNG]
    PDF1 --> Download[triggerDownload]
    PDF2 --> Download
    DOCX --> Download
```

A4分割: B4横 canvas（1376px）の左半（688px）→ A4 p1、右半 → A4 p2。

---

## 9. 機能選択ガイド（開発視点）

| 変更内容 | 触る機能 | 主なファイル |
|----------|----------|-------------|
| CSV 形式・問題タイプ追加 | Part A | `types/question.ts`, `csvParser.ts`, `pdfDocuments.tsx` |
| 4択/単語/記述の解答欄レイアウト | Part A | `AnswerSheetPreview.tsx`, `pdfDocuments.tsx` |
| 問題用紙プレビュー編集 | Part A | `QuestionPaperPreview.tsx`, `app/page.tsx` |
| 解答用紙同期・CSV再出力 | Part A | `app/page.tsx`, `PreviewPanel.tsx` |
| PDF 出力対象選択 | Part A | `generateExamPdf.ts`, `PreviewPanel.tsx` |
| 定期考査解答用紙の枠・パターン | Part B | `questionBlockBuilder.ts`, `QuestionEditModal.tsx` |
| 既存ブロックのプロパティ編集 | Part B | `QuestionBlockPropertyPanel.tsx`, `AnswerSheetCanvasEditor.tsx` |
| 基本パーツ生成・編集 | Part B | `basicPartBuilder.ts`, `QuestionBlockPropertyPanel.tsx` |
| ドラッグ UX・吸着 | Part B | `alignmentGuides.ts`, `marginGuides.ts`, `AnswerSheetCanvasEditor.tsx` |
| 余白ガイド表示・調整 | Part B | `marginGuides.ts`, `EditorToolbar.tsx`, `types/editor.ts` |
| 出力形式追加 | Part B | `exportPdf.ts`, `exportWord.ts` |
| 両機能のデータ連携 | 新規設計 | 未実装 — 接点設計が必要 |

---

## 10. 将来拡張の接点（未実装）

以下は現コードベースに存在しない。設計検討用のメモ。

| 拡張 | 概要 | 想定接点 |
|------|------|----------|
| CSV → エディタ連携 | CSV 問題データから大問ブロック自動配置 | `Question[]` → `QuestionBlockConfig[]` 変換層 |
| レイアウト保存/読込 | JSON シリアライズ of canvas objects | `canvas.toJSON()` / `loadFromJSON()` |
| サーバー保存 | 教員アカウントごとのテンプレート管理 | API + DB（現状サーバーなし） |
| Part A/B 統合 PDF | 問題用紙（A）+ 手作り解答用紙（B）を1 PDF | pdf-lib 結合パイプライン |

---

## 11. 変更時チェックリスト

### Part A を変更した場合

- [ ] CSV サンプルでパースが通る
- [ ] 問題用紙プレビューで編集 → 同期 → 解答用紙に反映される
- [ ] 問題用紙・解答用紙の displayNumber 一致（同期後）
- [ ] PDF 対象選択（全部 / 問題のみ / 解答のみ）が正常
- [ ] CSV エクスポートで編集内容が出力される
- [ ] PDF 結合ダウンロード成功

### Part B を変更した場合

- [ ] `createQuestionBlock` と `drawModalPreviewCanvas` を両方更新
- [ ] `QuestionEditModal` / `QuestionBlockPropertyPanel` の state / config 更新
- [ ] デフォルト config（`AnswerSheetCanvasEditor`, `ImportTextModal`）更新
- [ ] 新規作成モーダルのプレビューと canvas の見た目一致
- [ ] プロパティパネルで大問・基本パーツ編集が動作する
- [ ] 余白ガイド ON/OFF・スライダー変更が表示に反映される
- [ ] B4 PDF / A4分割 PDF / Word 出力成功
- [ ] 配置ガイド・余白ガイドが PDF/Word に含まれない
- [ ] `npm run build` 成功
