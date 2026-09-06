"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { generateExamPdf } from "@/lib/generateExamPdf";
import { LayoutSettings, QuestionLayout } from "@/types/layout";
import { Question } from "@/types/question";
import { decodeCsvFile, parseQuestionsCsv } from "@/utils/csvParser";

type PreviewMode = "question" | "answer";

const createLayoutSettings = (parsedQuestions: Question[]): LayoutSettings => ({
    choice: {
        count: parsedQuestions.filter((question) => question.type === "4択")
            .length,
        columns: 5,
        rows: 2,
    },
    word: {
        count: parsedQuestions.filter((question) => question.type === "単語")
            .length,
        columns: 5,
        rows: 7,
    },
    essay: {
        count: parsedQuestions.filter(
            (question) => question.type === "自由記述",
        ).length,
        columns: 1,
        rows: 5,
    },
});

export default function Home() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
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
    const allChoiceQuestions = questions.filter(
        (question) => question.type === "4択",
    );
    const allWordQuestions = questions.filter(
        (question) => question.type === "単語",
    );
    const allEssayQuestions = questions.filter(
        (question) => question.type === "自由記述",
    );
    const choiceQuestions = allChoiceQuestions.slice(
        0,
        appliedSettings?.choice.count,
    );
    const wordQuestions = allWordQuestions.slice(
        0,
        appliedSettings?.word.count,
    );
    const essayQuestions = allEssayQuestions.slice(
        0,
        appliedSettings?.essay.count,
    );
    const previewQuestions = [
        ...choiceQuestions,
        ...wordQuestions,
        ...essayQuestions,
    ]
        .sort((first, second) => first.id - second.id)
        .map((question, index) => ({
            question,
            displayNumber: index + 1,
        }));
    const displayNumbers = new Map(
        previewQuestions.map(({ question, displayNumber }) => [
            question.id,
            displayNumber,
        ]),
    );

    const updateLayoutSetting = (
        type: keyof LayoutSettings,
        field: keyof QuestionLayout,
        value: number,
    ) => {
        setSettings((current) =>
            {
                if (!current) return current;

                const availableCounts = {
                    choice: allChoiceQuestions.length,
                    word: allWordQuestions.length,
                    essay: allEssayQuestions.length,
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
            },
        );
    };

    const handlePreview = () => {
        if (!settings) return;

        const availableCounts = {
            choice: allChoiceQuestions.length,
            word: allWordQuestions.length,
            essay: allEssayQuestions.length,
        };

        for (const type of ["choice", "word", "essay"] as const) {
            const layout = settings[type];
            if (layout.count > availableCounts[type]) {
                setSettingsError(
                    `${type === "choice" ? "選択問題" : type === "word" ? "単語回答" : "自由記述"}の表示件数は、CSV内の${availableCounts[type]}問以下にしてください。`,
                );
                return;
            }
            if (layout.columns * layout.rows < layout.count) {
                setSettingsError(
                    `${type === "choice" ? "選択問題" : type === "word" ? "単語回答" : "自由記述"}は、横×縦が表示件数以上になるように指定してください。`,
                );
                return;
            }
        }

        setAppliedSettings(settings);
        setSettingsError(null);
        setIsSettingsModalOpen(false);
    };

    const handlePdfDownload = async () => {
        if (!appliedSettings || isGeneratingPdf) return;

        setIsGeneratingPdf(true);
        setErrors([]);

        try {
            await generateExamPdf({
                fileName,
                previewQuestions,
                choiceQuestions,
                wordQuestions,
                essayQuestions,
                displayNumbers,
                layout: appliedSettings,
            });
        } catch (error) {
            setErrors([
                `PDFの生成中にエラーが発生しました: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            ]);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // ファイル処理ロジック
    const processFile = async (file: File) => {
        if (!file) return;

        if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
            setErrors(["CSVファイル（.csv）を選択してください。"]);
            return;
        }

        setIsLoading(true);
        setErrors([]);
        setFileName(file.name);

        try {
            // 1. 文字コード（Shift-JIS / UTF-8）を自動判定して文字列として取得
            const csvText = await decodeCsvFile(file);

            // 2. CSVをパースして Question 型に変換
            const { questions: parsedQuestions, errors: parseErrors } =
                parseQuestionsCsv(csvText);

            if (parseErrors.length > 0) {
                setErrors(parseErrors);
            }

            setQuestions(parsedQuestions);
            setSettings(createLayoutSettings(parsedQuestions));
            setAppliedSettings(null);
            setSettingsError(null);
            setIsSettingsModalOpen(parsedQuestions.length > 0);
        } catch (err) {
            setErrors([
                `ファイルの読み込み中にエラーが発生しました: ${
                    err instanceof Error ? err.message : String(err)
                }`,
            ]);
            setQuestions([]);
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

    // リセット処理
    const handleReset = () => {
        setQuestions([]);
        setFileName(null);
        setErrors([]);
        setSettings(null);
        setAppliedSettings(null);
        setSettingsError(null);
        setIsSettingsModalOpen(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            {/* ヘッダーエリア */}
            <header className="mb-8 text-center sm:text-left border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    CSV プレビューアプリ（Phase 1）
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    4択・単語回答・自由記述対応のCSVファイル（Shift-JIS /
                    UTF-8）をアップロードして問題用紙・解答用紙をプレビューできます。
                </p>
            </header>

            {/* ファイルアップロードエリア */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    1. CSVファイルをアップロード
                </h2>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                        isDragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400 bg-gray-50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv,text/csv"
                        className="hidden"
                    />

                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20L28 8z"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M28 8v12h12M18 26l6-6m0 0l6 6m-6-6v14"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    <p className="mt-3 text-sm font-medium text-gray-700">
                        クリックしてCSVを選択、またはここにドラッグ＆ドロップ
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Shift-JIS（Excel標準出力）および UTF-8 に対応
                    </p>

                    {fileName && (
                        <p className="mt-3 text-xs font-semibold text-blue-600">
                            選択中のファイル: {fileName}
                        </p>
                    )}
                </div>

                {/* 状態表示・リセットボタン */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">
                        ※ 想定フォーマット: [問題番号,
                        問題形式(4択/単語/自由記述), 問題文, 選択肢1〜4,
                        文字数制限]
                    </div>
                    {(questions.length > 0 || errors.length > 0) && (
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition"
                        >
                            クリアして再選択
                        </button>
                    )}
                </div>
            </section>

            {/* ローディング表示 */}
            {isLoading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">
                        ファイルを解析中...
                    </p>
                </div>
            )}

            {/* エラー表示エリア */}
            {errors.length > 0 && (
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
                        {errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                        ))}
                    </ul>
                </section>
            )}

            {/* プレビュー表示エリア */}
            {questions.length > 0 && appliedSettings && (
                <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                            2. プレビュー（表示件数: {choiceQuestions.length + wordQuestions.length + essayQuestions.length}件）
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded">
                                解析成功
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSettings(appliedSettings);
                                    setSettingsError(null);
                                    setIsSettingsModalOpen(true);
                                }}
                                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                                レイアウト設定
                            </button>
                            <button
                                type="button"
                                onClick={handlePdfDownload}
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
                                onClick={() => setPreviewMode("question")}
                                className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                                    previewMode === "question"
                                        ? "bg-white text-blue-700 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                問題用紙
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={previewMode === "answer"}
                                onClick={() => setPreviewMode("answer")}
                                className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                                    previewMode === "answer"
                                        ? "bg-white text-blue-700 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                解答用紙
                            </button>
                        </div>
                    </div>

                    {previewMode === "question" ? (
                        <div className="p-6 space-y-6" role="tabpanel">
                            {previewQuestions.map(
                                ({ question, displayNumber }) => (
                                <article
                                    key={question.id}
                                    className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`text-xs px-2.5 py-1 rounded-md font-semibold shrink-0 mt-0.5 ${
                                                question.type === "4択"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : question.type === "単語"
                                                      ? "bg-emerald-100 text-emerald-800"
                                                      : "bg-purple-100 text-purple-800"
                                            }`}
                                        >
                                            {question.type}
                                        </span>
                                        <div className="flex-1">
                                            <h3 className="text-base font-semibold leading-7 text-gray-900">
                                                問{displayNumber}.{" "}
                                                {question.questionText}
                                            </h3>

                                            {/* 4択形式 */}
                                            {question.type === "4択" && (
                                                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                                                    {[
                                                        question.option1,
                                                        question.option2,
                                                        question.option3,
                                                        question.option4,
                                                    ].map((option, index) => (
                                                        <li
                                                            key={index}
                                                            className="flex items-start gap-3 rounded border border-gray-200 px-4 py-3 text-sm text-gray-700 bg-white"
                                                        >
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-400 text-xs font-medium">
                                                                {index + 1}
                                                            </span>
                                                            <span>
                                                                {option ||
                                                                    "（選択肢未設定）"}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            )}

                                            {/* 単語形式 */}
                                            {question.type === "単語" && (
                                                <p className="mt-2 text-xs text-gray-500">
                                                    ※
                                                    適切な単語・語句を解答用紙に記入しなさい。
                                                </p>
                                            )}

                                            {/* 自由記述形式 */}
                                            {question.type === "自由記述" && (
                                                <div className="mt-2 text-xs text-purple-700 font-medium">
                                                    {question.maxChars ? (
                                                        <span>
                                                            ※ 【制限】
                                                            {question.maxChars}
                                                            文字以内で解答用紙に記述しなさい。
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            ※
                                                            解答用紙の記述欄に詳しく記述しなさい。
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="p-6" role="tabpanel">
                            <div className="mb-5 border-b-2 border-gray-800 pb-3">
                                <h3 className="text-xl font-bold text-gray-900">
                                    解答用紙
                                </h3>
                                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-700 sm:max-w-xl sm:grid-cols-3">
                                    <p>氏名: ____________________</p>
                                    <p>組: ______</p>
                                    <p>番号: ______</p>
                                </div>
                            </div>
                            <div className="mb-5 text-sm text-gray-700">
                                <p>
                                    問題形式に従って、それぞれの解答欄に記入してください。
                                </p>
                            </div>
                            <div className="space-y-8">
                                {choiceQuestions.length > 0 && (
                                    <section>
                                        <h4 className="mb-3 text-sm font-semibold text-gray-800">
                                            選択問題
                                        </h4>
                                        <div
                                            className="grid gap-3"
                                            style={{
                                                gridTemplateColumns: `repeat(${appliedSettings.choice.columns}, minmax(0, 1fr))`,
                                            }}
                                        >
                                            {choiceQuestions.map((question) => (
                                                <article
                                                    key={question.id}
                                                    className="break-inside-avoid border border-gray-300 bg-white p-3"
                                                >
                                                    <h5 className="text-sm font-semibold text-gray-900">
                                                        問{displayNumbers.get(question.id)}
                                                    </h5>
                                                    <div className="mt-2 h-12 border-2 border-gray-500" />
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {wordQuestions.length > 0 && (
                                    <section>
                                        <h4 className="mb-3 text-sm font-semibold text-gray-800">
                                            単語回答
                                        </h4>
                                        <div
                                            className="grid gap-x-4 gap-y-3"
                                            style={{
                                                gridTemplateColumns: `repeat(${appliedSettings.word.columns}, minmax(0, 1fr))`,
                                            }}
                                        >
                                            {wordQuestions.map((question) => (
                                                <article
                                                    key={question.id}
                                                    className="break-inside-avoid flex items-center gap-2 border-b-2 border-gray-400 pb-2"
                                                >
                                                    <h5 className="shrink-0 text-sm font-semibold text-gray-900">
                                                        問{displayNumbers.get(question.id)}
                                                    </h5>
                                                    <div className="h-6 flex-1" />
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {essayQuestions.length > 0 && (
                                    <section>
                                        <h4 className="mb-3 text-sm font-semibold text-gray-800">
                                            自由記述
                                        </h4>
                                        <div
                                            className="grid gap-6"
                                            style={{
                                                gridTemplateColumns: `repeat(${appliedSettings.essay.columns}, minmax(0, 1fr))`,
                                            }}
                                        >
                                            {essayQuestions.map((question) => (
                                                <article
                                                    key={question.id}
                                                    className="break-inside-avoid border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                                                >
                                                    <h5 className="text-base font-semibold leading-7 text-gray-900">
                                                        問{displayNumbers.get(question.id)}
                                                    </h5>
                                                    <div className="mt-4 min-h-[130px] p-3 border border-dashed border-gray-300 rounded bg-gray-50/30 flex flex-col justify-end text-xs text-gray-400">
                                                {question.maxChars && (
                                                    <span className="text-right text-gray-500 font-medium">
                                                        最大 {question.maxChars} 文字
                                                    </span>
                                                )}
                                            </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {isSettingsModalOpen && settings && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="layout-settings-title"
                >
                    <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h2
                                id="layout-settings-title"
                                className="text-lg font-semibold text-gray-900"
                            >
                                レイアウト設定
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                表示する問題数と、解答用紙での横・縦の配置を指定してください。
                            </p>
                        </div>

                        <div className="space-y-5 px-6 py-5">
                            {[
                                ["choice", "選択問題", allChoiceQuestions.length],
                                ["word", "単語回答", allWordQuestions.length],
                                ["essay", "自由記述", allEssayQuestions.length],
                            ].map(([type, label, available]) => {
                                const key = type as keyof LayoutSettings;
                                const layout = settings[key];

                                return (
                                    <section key={key} className="border-b border-gray-200 pb-5 last:border-b-0 last:pb-0">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-800">
                                                {label}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                CSV内: {available}問
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                ["count", "表示件数"],
                                                ["columns", "横"],
                                                ["rows", "縦"],
                                            ].map(([field, fieldLabel]) => (
                                                <label key={field} className="text-xs font-medium text-gray-700">
                                                    {fieldLabel}
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={
                                                            field === "count"
                                                                ? available
                                                                : undefined
                                                        }
                                                        value={layout[field as keyof QuestionLayout]}
                                                        onChange={(event) =>
                                                            updateLayoutSetting(
                                                                key,
                                                                field as keyof QuestionLayout,
                                                                Number(event.target.value),
                                                            )
                                                        }
                                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}

                            {settingsError && (
                                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {settingsError}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSettingsModalOpen(false);
                                    setSettingsError(null);
                                }}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={handlePreview}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                プレビューを表示
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
