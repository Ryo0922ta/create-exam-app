import { useState } from "react";
import { AnswerSheetPreview } from "@/components/AnswerSheetPreview";
import { QuestionPaperPreview } from "@/components/QuestionPaperPreview";
import { PdfDownloadTarget } from "@/lib/generateExamPdf";
import { ExamPreview } from "@/types/exam";
import { LayoutSettings } from "@/types/layout";
import { Question } from "@/types/question";

type PreviewMode = "question" | "answer";

type PreviewPanelProps = ExamPreview & {
    layout: LayoutSettings;
    previewMode: PreviewMode;
    isGeneratingPdf: boolean;
    isEdited?: boolean;
    hasUnsyncedChanges?: boolean;
    onPreviewModeChange: (mode: PreviewMode) => void;
    onOpenSettings: () => void;
    onDownloadPdf: (target: PdfDownloadTarget) => void;
    onResetQuestions?: () => void;
    onExportCsv?: () => void;
    onSyncAnswerSheet?: () => void;
    onUpdateQuestion?: (id: number, updatedFields: Partial<Question>) => void;
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
    isEdited = false,
    hasUnsyncedChanges = false,
    onPreviewModeChange,
    onOpenSettings,
    onDownloadPdf,
    onResetQuestions,
    onExportCsv,
    onSyncAnswerSheet,
    onUpdateQuestion,
}: PreviewPanelProps) {
    const [pdfTarget, setPdfTarget] = useState<PdfDownloadTarget>("all");

    return (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                        2. プレビュー（表示件数: {previewQuestions.length}件）
                    </h2>
                    {isEdited && (
                        <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            問題用紙: 編集あり
                        </span>
                    )}
                    {hasUnsyncedChanges ? (
                        <span className="rounded bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 animate-pulse">
                            解答用紙: 未同期
                        </span>
                    ) : (
                        <span className="rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            同期済み
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {onSyncAnswerSheet && (
                        <button
                            type="button"
                            onClick={onSyncAnswerSheet}
                            disabled={!hasUnsyncedChanges}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                hasUnsyncedChanges
                                    ? "bg-blue-600 text-white shadow hover:bg-blue-700 ring-2 ring-blue-300"
                                    : "border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                            title={
                                hasUnsyncedChanges
                                    ? "問題用紙の修正内容を解答用紙に反映します"
                                    : "問題用紙と解答用紙は同期されています"
                            }
                        >
                            <svg
                                className={`w-3.5 h-3.5 ${hasUnsyncedChanges ? "animate-spin-once" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            解答用紙に同期
                        </button>
                    )}
                    {onResetQuestions && isEdited && (
                        <button
                            type="button"
                            onClick={onResetQuestions}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                            元に戻す
                        </button>
                    )}
                    {onExportCsv && (
                        <button
                            type="button"
                            onClick={onExportCsv}
                            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                            CSVエクスポート
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                        レイアウト設定
                    </button>
                    <div className="flex items-center rounded-md bg-gray-800 p-0.5 shadow-sm">
                        <select
                            value={pdfTarget}
                            onChange={(e) =>
                                setPdfTarget(
                                    e.target.value as PdfDownloadTarget,
                                )
                            }
                            disabled={isGeneratingPdf}
                            aria-label="PDFダウンロード対象"
                            className="rounded-l-md border-r border-gray-700 bg-gray-800 py-1.5 pl-2.5 pr-2 text-xs font-medium text-gray-200 outline-none hover:text-white focus:ring-1 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                        >
                            <option value="all">全部（問題・解答用紙）</option>
                            <option value="question">問題用紙のみ</option>
                            <option value="answer">解答用紙のみ</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => onDownloadPdf(pdfTarget)}
                            disabled={isGeneratingPdf}
                            className="rounded-r-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                        >
                            {isGeneratingPdf
                                ? "PDFを生成中..."
                                : "PDFをダウンロード"}
                        </button>
                    </div>
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
                        className={`relative rounded px-4 py-2 text-sm font-medium transition-colors ${previewMode === "answer" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        解答用紙
                        {hasUnsyncedChanges && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* 解答用紙タブ表示時の未同期警告バナー */}
            {previewMode === "answer" && hasUnsyncedChanges && (
                <div className="mx-6 mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex items-center gap-2">
                        <svg
                            className="h-5 w-5 shrink-0 text-amber-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>
                            問題用紙の最新の編集内容が解答用紙に反映されていません。
                        </span>
                    </div>
                    {onSyncAnswerSheet && (
                        <button
                            type="button"
                            onClick={onSyncAnswerSheet}
                            className="shrink-0 rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                        >
                            今すぐ同期する
                        </button>
                    )}
                </div>
            )}

            {previewMode === "question" ? (
                <QuestionPaperPreview
                    questions={previewQuestions}
                    onUpdateQuestion={onUpdateQuestion}
                />
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
