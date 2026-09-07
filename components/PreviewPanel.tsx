import { AnswerSheetPreview } from "@/components/AnswerSheetPreview";
import { QuestionPaperPreview } from "@/components/QuestionPaperPreview";
import { ExamPreview } from "@/types/exam";
import { LayoutSettings } from "@/types/layout";

type PreviewMode = "question" | "answer";

type PreviewPanelProps = ExamPreview & {
    layout: LayoutSettings;
    previewMode: PreviewMode;
    isGeneratingPdf: boolean;
    onPreviewModeChange: (mode: PreviewMode) => void;
    onOpenSettings: () => void;
    onDownloadPdf: () => void;
};

export function PreviewPanel({
    layout,
    previewQuestions,
    choiceQuestions,
    wordQuestions,
    essayQuestions,
    displayNumbers,
    previewMode,
    isGeneratingPdf,
    onPreviewModeChange,
    onOpenSettings,
    onDownloadPdf,
}: PreviewPanelProps) {
    return (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    2. プレビュー（表示件数: {previewQuestions.length}件）
                </h2>
                <div className="flex items-center gap-3">
                    <span className="rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        解析成功
                    </span>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                        レイアウト設定
                    </button>
                    <button
                        type="button"
                        onClick={onDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        {isGeneratingPdf
                            ? "PDFを生成中..."
                            : "PDFをダウンロード"}
                    </button>
                </div>
            </div>
            <div
                className="px-6 pt-5"
                role="tablist"
                aria-label="プレビュー形式"
            >
                <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={previewMode === "question"}
                        onClick={() => onPreviewModeChange("question")}
                        className={`rounded px-4 py-2 text-sm font-medium transition-colors ${previewMode === "question" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        問題用紙
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={previewMode === "answer"}
                        onClick={() => onPreviewModeChange("answer")}
                        className={`rounded px-4 py-2 text-sm font-medium transition-colors ${previewMode === "answer" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        解答用紙
                    </button>
                </div>
            </div>
            {previewMode === "question" ? (
                <QuestionPaperPreview questions={previewQuestions} />
            ) : (
                <AnswerSheetPreview
                    choiceQuestions={choiceQuestions}
                    wordQuestions={wordQuestions}
                    essayQuestions={essayQuestions}
                    displayNumbers={displayNumbers}
                    layout={layout}
                />
            )}
        </section>
    );
}
