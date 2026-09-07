"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { CsvUploader } from "@/components/CsvUploader";
import { LayoutSettingsModal } from "@/components/LayoutSettingsModal";
import { PreviewPanel } from "@/components/PreviewPanel";
import {
    createExamPreview,
    createLayoutSettings,
    groupQuestions,
    validateLayoutSettings,
} from "@/lib/examLayout";
import { generateExamPdf } from "@/lib/generateExamPdf";
import { LayoutSettings, QuestionLayout } from "@/types/layout";
import { Question } from "@/types/question";
import {
    decodeCsvFile,
    exportQuestionsToCsv,
    parseQuestionsCsv,
} from "@/utils/csvParser";

type PreviewMode = "question" | "answer";

export default function Home() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
    const [syncedQuestions, setSyncedQuestions] = useState<Question[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [csvErrors, setCsvErrors] = useState<string[]>([]);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [previewMode, setPreviewMode] = useState<PreviewMode>("question");
    const [isSettingsModalOpen, setIsSettingsModalOpen] =
        useState<boolean>(false);
    const [settings, setSettings] = useState<LayoutSettings | null>(null);
    const [appliedSettings, setAppliedSettings] =
        useState<LayoutSettings | null>(null);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const allQuestions = groupQuestions(questions);
    const questionExamPreview = createExamPreview(questions, appliedSettings);
    const answerExamPreview = createExamPreview(
        syncedQuestions,
        appliedSettings,
    );

    const isEdited =
        originalQuestions.length > 0 &&
        JSON.stringify(questions) !== JSON.stringify(originalQuestions);

    const hasUnsyncedChanges =
        questions.length > 0 &&
        JSON.stringify(questions) !== JSON.stringify(syncedQuestions);

    const updateLayoutSetting = (
        type: keyof LayoutSettings,
        field: keyof QuestionLayout,
        value: number,
    ) => {
        setSettings((current) => {
            if (!current) return current;

            const availableCounts = {
                choice: allQuestions.choiceQuestions.length,
                word: allQuestions.wordQuestions.length,
                essay: allQuestions.essayQuestions.length,
            };
            const nextValue = Math.max(1, value || 1);
            const limitedValue =
                field === "count"
                    ? Math.min(nextValue, availableCounts[type])
                    : nextValue;

            return {
                ...current,
                [type]: {
                    ...current[type],
                    [field]: limitedValue,
                },
            };
        });
    };

    const handlePreview = () => {
        if (!settings) return;

        const validationError = validateLayoutSettings(settings, allQuestions);
        if (validationError) {
            setSettingsError(validationError);
            return;
        }

        setAppliedSettings(settings);
        setSettingsError(null);
        setIsSettingsModalOpen(false);
    };

    const handlePdfDownload = async () => {
        if (!appliedSettings || isGeneratingPdf) return;

        setIsGeneratingPdf(true);
        setPdfError(null);

        try {
            await generateExamPdf({
                fileName,
                previewQuestions: questionExamPreview.previewQuestions,
                choiceQuestions: answerExamPreview.choiceQuestions,
                wordQuestions: answerExamPreview.wordQuestions,
                essayQuestions: answerExamPreview.essayQuestions,
                displayNumbers: answerExamPreview.displayNumbers,
                layout: appliedSettings,
            });
        } catch (error) {
            setPdfError(
                `PDFの生成中にエラーが発生しました: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // ファイル処理ロジック
    const processFile = async (file: File) => {
        if (!file) return;

        if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
            setCsvErrors(["CSVファイル（.csv）を選択してください。"]);
            return;
        }

        setIsLoading(true);
        setCsvErrors([]);
        setPdfError(null);
        setFileName(file.name);

        try {
            // 1. 文字コード（Shift-JIS / UTF-8）を自動判定して文字列として取得
            const csvText = await decodeCsvFile(file);

            // 2. CSVをパースして Question 型に変換
            const { questions: parsedQuestions, errors: parseErrors } =
                parseQuestionsCsv(csvText);

            if (parseErrors.length > 0) {
                setCsvErrors(parseErrors);
            }

            setQuestions(parsedQuestions);
            setOriginalQuestions(parsedQuestions);
            setSyncedQuestions(parsedQuestions);
            setSettings(createLayoutSettings(parsedQuestions));
            setAppliedSettings(null);
            setSettingsError(null);
            setIsSettingsModalOpen(parsedQuestions.length > 0);
        } catch (err) {
            setCsvErrors([
                `ファイルの読み込み中にエラーが発生しました: ${
                    err instanceof Error ? err.message : String(err)
                }`,
            ]);
            setQuestions([]);
            setOriginalQuestions([]);
            setSyncedQuestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ファイル選択イベント
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // ドラッグ＆ドロップイベント
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // アップロード全体のリセット処理
    const handleReset = () => {
        setQuestions([]);
        setOriginalQuestions([]);
        setSyncedQuestions([]);
        setFileName(null);
        setCsvErrors([]);
        setPdfError(null);
        setSettings(null);
        setAppliedSettings(null);
        setSettingsError(null);
        setIsSettingsModalOpen(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // プレビュー編集の更新処理
    const handleUpdateQuestion = (
        id: number,
        updatedFields: Partial<Question>,
    ) => {
        setQuestions((current) =>
            current.map((q) => {
                if (q.id === id) {
                    return { ...q, ...updatedFields } as Question;
                }
                return q;
            }),
        );
    };

    // 編集内容をアップロード時の状態に戻す
    const handleResetQuestions = () => {
        if (
            window.confirm(
                "プレビューの編集内容を破棄し、アップロード時の状態に戻しますか？",
            )
        ) {
            setQuestions(originalQuestions);
            setSyncedQuestions(originalQuestions);
        }
    };

    // 解答用紙への手動同期
    const handleSyncToAnswerSheet = () => {
        setSyncedQuestions(questions);
    };

    // 編集後CSVのエクスポート
    const handleExportCsv = () => {
        exportQuestionsToCsv(questions, fileName);
    };

    return (
        <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <header className="mb-8 text-center sm:text-left border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    CSV プレビューアプリ（Phase 1）
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    4択・単語回答・自由記述対応のCSVファイル（Shift-JIS /
                    UTF-8）をアップロードして問題用紙・解答用紙をプレビューできます。
                </p>
            </header>
            <CsvUploader
                fileInputRef={fileInputRef}
                fileName={fileName}
                isDragging={isDragging}
                canReset={questions.length > 0 || csvErrors.length > 0}
                onFileChange={handleFileChange}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onReset={handleReset}
            />

            {/* ローディング表示 */}
            {isLoading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">
                        ファイルを解析中...
                    </p>
                </div>
            )}

            {csvErrors.length > 0 && (
                <section className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-8">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                        <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        エラーが発生しました
                    </h3>
                    <ul className="list-disc list-inside text-xs space-y-1">
                        {csvErrors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                        ))}
                    </ul>
                </section>
            )}
            {pdfError && (
                <p className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {pdfError}
                </p>
            )}
            {questions.length > 0 && appliedSettings && (
                <PreviewPanel
                    previewQuestions={questionExamPreview.previewQuestions}
                    choiceQuestions={answerExamPreview.choiceQuestions}
                    wordQuestions={answerExamPreview.wordQuestions}
                    essayQuestions={answerExamPreview.essayQuestions}
                    displayNumbers={answerExamPreview.displayNumbers}
                    layout={appliedSettings}
                    previewMode={previewMode}
                    isGeneratingPdf={isGeneratingPdf}
                    isEdited={isEdited}
                    hasUnsyncedChanges={hasUnsyncedChanges}
                    onPreviewModeChange={setPreviewMode}
                    onOpenSettings={() => {
                        setSettings(appliedSettings);
                        setSettingsError(null);
                        setIsSettingsModalOpen(true);
                    }}
                    onDownloadPdf={handlePdfDownload}
                    onResetQuestions={handleResetQuestions}
                    onExportCsv={handleExportCsv}
                    onSyncAnswerSheet={handleSyncToAnswerSheet}
                    onUpdateQuestion={handleUpdateQuestion}
                />
            )}
            {isSettingsModalOpen && settings && (
                <LayoutSettingsModal
                    settings={settings}
                    availableQuestions={allQuestions}
                    error={settingsError}
                    onUpdate={updateLayoutSetting}
                    onCancel={() => {
                        setIsSettingsModalOpen(false);
                        setSettingsError(null);
                    }}
                    onPreview={handlePreview}
                />
            )}
        </main>
    );
}
