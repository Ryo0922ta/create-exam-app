## エディタ起動


キャンバスエディタ（/editor）だけに絞って整理します。コードは変更していません。
1. 画面一覧
画面・領域	内容
/editor	解答用紙キャンバスエディタ本体
上部ツールバー	大問追加、基本パーツ追加、複製、削除、表示設定、PDF／Word保存
中央キャンバス	B4横サイズのFabric.jsキャンバス
右側プロパティパネル	選択したブロックの設定編集
大問作成モーダル	大問番号、解答枠パターン、行列数などを設定
問題文インポートモーダル	問題文から(1)や①などを抽出
一括置換モーダル	観点記号などをまとめて置換


2. 画面に対応するファイル
- 画面の入口
  [app/editor/page.tsx (line 1)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/app/editor/page.tsx:1)
- エディタ全体
  [components/editor/AnswerSheetCanvasEditor.tsx (line 79)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/AnswerSheetCanvasEditor.tsx:79)
- ツールバー
  [components/editor/EditorToolbar.tsx (line 33)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/EditorToolbar.tsx:33)
- プロパティパネル
  [components/editor/QuestionBlockPropertyPanel.tsx (line 62)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/QuestionBlockPropertyPanel.tsx:62)
- 大問作成モーダル
  [components/editor/modals/QuestionEditModal.tsx (line 67)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/modals/QuestionEditModal.tsx:67)
- 問題文インポート
  [components/editor/modals/ImportTextModal.tsx (line 25)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/modals/ImportTextModal.tsx:25)
- 一括置換
  [components/editor/modals/BatchReplaceModal.tsx (line 11)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/modals/BatchReplaceModal.tsx:11)
3. 主要なコンポーネント
AnswerSheetCanvasEditor
エディタの親コンポーネントです。
担当している処理は次の通りです。
- Fabric.jsキャンバスの初期化
- ブロックの追加、選択、移動、複製、削除
- グリッド・スナップ・配置ガイド
- プロパティパネルの開閉
- PDF／Word出力
- 各モーダルの表示制御
EditorToolbar
上部の操作ボタンを表示します。
- 大問追加
- 問題文から自動インポート
- 見出し枠、氏名欄、得点枠の追加
- 複製、削除
- 方眼、吸着、余白ガイド、ズーム設定
QuestionBlockPropertyPanel
選択中のブロックを編集します。
ブロックの種類によって、以下を編集できます。
- 大問番号
- 観点区分
- 配点
- 行数・列数
- 解答枠のパターン
- 枠の幅・高さ
- 見出し・氏名欄・得点表の文字
描画ロジック
- 大問ブロック
  [lib/editor/questionBlockBuilder.ts (line 818)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/questionBlockBuilder.ts:818)
- 見出し・氏名欄・得点表
  [lib/editor/basicPartBuilder.ts (line 112)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/basicPartBuilder.ts:112)
- Fabric共通ブロック
  [lib/editor/fabricBlocks.ts (line 91)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/fabricBlocks.ts:91)
4. stateを持っている場所
主なstateは [AnswerSheetCanvasEditor.tsx (line 79)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/AnswerSheetCanvasEditor.tsx:79) に集まっています。
モーダル関連
- isQuestionModalOpen
- isImportModalOpen
- isReplaceModalOpen
- editingBlock
選択・編集関連
- selectedBlock
- isPropertyPanelOpen
- questionBlockCount
表示関連
- isGridVisible
- isSnapEnabled
- isAlignmentGuidesEnabled
- isMarginGuidesVisible
- paperMargins
- zoomLevel
出力関連
- isExporting
- isPdfDropdownOpen
- toastMessage
実際のキャンバスデータ
Reactのstateだけでなく、Fabric.jsのcanvasオブジェクトが重要です。
fabricCanvasRef.current
  └─ canvas上の全ブロック
      ├─ question-block
      ├─ exam-header
      ├─ namebox
      └─ score-table
各ブロックは、種類と設定値を自身に保持します。
- customType
- questionConfig
- examHeaderConfig
- nameboxConfig
- scoreTableConfig
つまり、キャンバス上のFabricオブジェクトが実質的な編集データです。
5. propsの受け渡し
基本的な構造は次の通りです。
AnswerSheetCanvasEditor
 ├─ EditorToolbar
 │   └─ ボタン操作を親へ通知
 ├─ QuestionEditModal
 │   └─ 作成した QuestionBlockConfig を親へ返す
 ├─ ImportTextModal
 │   └─ 抽出結果から QuestionBlockConfig を親へ返す
 └─ QuestionBlockPropertyPanel
     └─ 編集後の設定を親へ返す
流れの例：
プロパティパネルで設定変更
  → onUpdateSelectedQuestion(config)
  → replaceSelectedBlock(...)
  → createQuestionBlock(config, ...)
  → 古いFabricオブジェクトを削除
  → 新しいFabricオブジェクトを追加
キャンバス自体は子コンポーネントへ渡していません。親がfabricCanvasRefを通じて直接操作します。
6. 入力から画面表示までの流れ
大問を新規作成する場合
「大問を作成・追加」
  → QuestionEditModalを開く
  → 入力値をQuestionBlockConfigにまとめる
  → createQuestionBlock()
  → Fabric Groupを作成
  → canvas.add()
  → キャンバスに表示
問題文から自動インポートする場合
問題文を貼り付ける
  → parseQuestionGroups()
  → (1)、(2)、①などを検出
  → convertParsedGroupsToSubQuestionGroups()
  → QuestionBlockConfigを作成
  → createQuestionBlock()
  → キャンバスに追加
既存ブロックを編集する場合
キャンバス上のブロックを選択
  → プロパティパネルを開く
  → 設定を変更
  → 新しい設定でブロックを再生成
  → 元の位置に置き換え
移動する場合
ブロックをドラッグ
  → Fabricの object:moving イベント
  → 配置ガイドによる吸着
  → 方眼スナップ
  → 座標を更新
  → 再描画
7. 保存処理やAPI通信の流れ
サーバー保存やAPI通信はありません。
- fetch
- API Route
- データベース
- localStorage
- sessionStorage
などは使用していません。
保存処理は、ブラウザ内でファイルを生成してダウンロードする形式です。
PDF出力
- B4横1枚
  [lib/editor/exportPdf.ts (line 89)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/exportPdf.ts:89)
- A4左右分割2ページ
  [lib/editor/exportPdf.ts (line 121)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/exportPdf.ts:121)
Word出力
- Fabricキャンバス上のブロックをWord用の表・段落へ変換
- [lib/editor/exportWord.ts (line 595)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/exportWord.ts:595)
作業内容はリロードすると消えます。現在は永続保存機能がありません。
8. 最初に読むべきファイル3つ
1. [components/editor/AnswerSheetCanvasEditor.tsx (line 79)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/AnswerSheetCanvasEditor.tsx:79)
   エディタ全体の中心です。
2. [lib/editor/questionBlockBuilder.ts (line 818)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/questionBlockBuilder.ts:818)
   大問の見た目、行列、解答欄をどのように描いているか分かります。
3. [components/editor/QuestionBlockPropertyPanel.tsx (line 62)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/components/editor/QuestionBlockPropertyPanel.tsx:62)
   設定変更がどのように大問へ反映されるか分かります。
補助資料として、[docs/TECHNICAL_SPEC.md (line 200)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/docs/TECHNICAL_SPEC.md:200) も有用です。
9. 今後変更すると影響範囲が大きそうな箇所
QuestionBlockConfig
[types/editor.ts (line 42)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/types/editor.ts:42)
この型は以下から参照されます。
- 大問作成モーダル
- 問題文インポート
- プロパティパネル
- 大問描画
- モーダルプレビュー
- Word出力
項目を変更すると、多くのファイルの修正が必要になります。
questionBlockBuilder.ts
大問の描画ルールの中心です。
特に注意すべき点は、同じ大問を2通り描いていることです。
- 実際のキャンバス：createQuestionBlock
- モーダル内プレビュー：drawModalPreviewCanvas
片方だけ変更すると、プレビューと本番キャンバスの見た目がずれます。
AnswerSheetCanvasEditor.tsx
イベント処理とFabricオブジェクト操作が集中しています。
- 選択
- 削除
- 複製
- 置換
- スナップ
- 出力
ここを変更するとエディタ全体へ影響しやすいです。
出力処理
- [lib/editor/exportPdf.ts (line 1)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/exportPdf.ts:1)
- [lib/editor/exportWord.ts (line 1)](/Users/sawauchiryouta/Desktop/create-answer-paper-app/lib/editor/exportWord.ts:1)
画面上の見た目と、出力ファイルの見た目は別処理です。そのため、画面だけ直してもPDF／Wordが自動的に同じになるとは限りません。
10. 不具合時に確認すべき場所
症状	確認場所
キャンバスが表示されない	app/editor/page.tsx、AnswerSheetCanvasEditor.tsx、Fabricの初期化処理
ブロックが追加されない	handleApplyQuestionConfig、createQuestionBlock
モーダルのプレビューだけおかしい	drawModalPreviewCanvas
キャンバスとプレビューの見た目が違う	createQuestionBlock と drawModalPreviewCanvas
プロパティ変更が反映されない	QuestionBlockPropertyPanel、replaceSelectedBlock
ブロックが選択できない	Fabricのselectionイベント、customType 判定
ドラッグ位置がずれる	alignmentGuides.ts、marginGuides.ts、ズーム計算
方眼スナップがおかしい	paperSizes.ts、GRID_CELL_SIZE_PX、object:moving
削除・複製が不安定	handleDelete、handleClone、Fabricのactive object
PDFにガイド線が出る	exportPdf.ts、ガイドオブジェクトの除外処理
Wordのレイアウトが崩れる	exportWord.ts
リロード後に内容が消える	現仕様。永続保存機能が未実装


全体像を一言でいうと、キャンバスエディタは「Reactが操作パネルを管理し、Fabric.jsのキャンバスオブジェクトが実データを保持し、最後にPDF／Wordへ変換する」構造です。