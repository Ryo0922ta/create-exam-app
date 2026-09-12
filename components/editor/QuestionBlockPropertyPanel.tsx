"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    QuestionBlockConfig,
    QuestionPattern,
    SubQuestionCell,
    SubQuestionGroup,
    SubQuestionPattern,
    ExamHeaderConfig,
    NameboxConfig,
    ScoreTableConfig,
} from "@/types/editor";
import {
    getDefaultCircleCommaPaddingRatio,
    CustomQuestionBlockGroup,
} from "@/lib/editor/questionBlockBuilder";
import {
    CustomExamHeaderGroup,
    CustomNameboxGroup,
    CustomScoreTableGroup,
    DEFAULT_EXAM_HEADER_CONFIG,
    DEFAULT_NAMEBOX_CONFIG,
    DEFAULT_SCORE_TABLE_CONFIG,
} from "@/lib/editor/basicPartBuilder";
import { fabric } from "fabric";
import {
    SECTION_STANDARD_WIDTH,
    QUESTION_BLOCK_WIDTH_LIMITS,
    clampQuestionBlockWidth,
} from "@/lib/editor/paperSizes";
import { PAPER_SIZES, B4_LANDSCAPE_MM } from "@/lib/editor/paperSizes";

export type CustomFabricBlock =
    | CustomQuestionBlockGroup
    | CustomExamHeaderGroup
    | CustomNameboxGroup
    | CustomScoreTableGroup
    | (fabric.Group & {
          customType?: string;
          questionConfig?: QuestionBlockConfig;
          examHeaderConfig?: ExamHeaderConfig;
          nameboxConfig?: NameboxConfig;
          scoreTableConfig?: ScoreTableConfig;
      });

interface QuestionBlockPropertyPanelProps {
    selectedBlock: CustomFabricBlock | null;
    onUpdate?: (config: QuestionBlockConfig) => void;
    onUpdateQuestion?: (config: QuestionBlockConfig) => void;
    onUpdateExamHeader?: (config: ExamHeaderConfig) => void;
    onUpdateNamebox?: (config: NameboxConfig) => void;
    onUpdateScoreTable?: (config: ScoreTableConfig) => void;
    onClose: () => void;
}

export const QuestionBlockPropertyPanel: React.FC<
    QuestionBlockPropertyPanelProps
> = ({
    selectedBlock,
    onUpdate,
    onUpdateQuestion,
    onUpdateExamHeader,
    onUpdateNamebox,
    onUpdateScoreTable,
    onClose,
}) => {
    const customType = (selectedBlock as any)?.customType;

    // 大問ハンドラのフォールバック
    const handleQuestionUpdate = onUpdateQuestion || onUpdate;

    if (!selectedBlock) return null;

    return (
        <aside
            role="dialog"
            aria-label="プロパティ編集パネル"
            className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shadow-lg z-30 transition-all duration-200 ease-in-out shrink-0 text-xs overflow-hidden"
        >
            {customType === "exam-header" && (
                <ExamHeaderForm
                    block={selectedBlock as CustomExamHeaderGroup}
                    onUpdate={onUpdateExamHeader}
                    onClose={onClose}
                />
            )}
            {customType === "namebox" && (
                <NameboxForm
                    block={selectedBlock as CustomNameboxGroup}
                    onUpdate={onUpdateNamebox}
                    onClose={onClose}
                />
            )}
            {customType === "score-table" && (
                <ScoreTableForm
                    block={selectedBlock as CustomScoreTableGroup}
                    onUpdate={onUpdateScoreTable}
                    onClose={onClose}
                />
            )}
            {(customType === "question-block" || !customType) && (
                <QuestionBlockForm
                    block={selectedBlock as CustomQuestionBlockGroup}
                    onUpdate={handleQuestionUpdate}
                    onClose={onClose}
                />
            )}
        </aside>
    );
};

// ==========================================
// 1. 考査見出し枠 フォーム
// ==========================================
interface ExamHeaderFormProps {
    block: CustomExamHeaderGroup;
    onUpdate?: (config: ExamHeaderConfig) => void;
    onClose: () => void;
}

const ExamHeaderForm: React.FC<ExamHeaderFormProps> = ({
    block,
    onUpdate,
    onClose,
}) => {
    const config = block.examHeaderConfig || DEFAULT_EXAM_HEADER_CONFIG;

    const [text, setText] = useState(config.text || "");
    const [width, setWidth] = useState(config.width || 596);
    const [height, setHeight] = useState(config.height || 40);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        const c = block.examHeaderConfig || DEFAULT_EXAM_HEADER_CONFIG;
        setText(c.text || "");
        setWidth(c.width || 596);
        setHeight(c.height || 40);
        isInitialMountRef.current = true;
    }, [block]);

    const buildConfig = useCallback(
        (overrides: Partial<ExamHeaderConfig> = {}): ExamHeaderConfig => {
            return {
                text: overrides.text !== undefined ? overrides.text : text,
                width:
                    overrides.width !== undefined
                        ? overrides.width
                        : Number(width) || 596,
                height:
                    overrides.height !== undefined
                        ? overrides.height
                        : Number(height) || 40,
            };
        },
        [text, width, height],
    );

    const triggerImmediateUpdate = useCallback(
        (overrides: Partial<ExamHeaderConfig> = {}) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            if (onUpdate) {
                onUpdate(buildConfig(overrides));
            }
        },
        [buildConfig, onUpdate],
    );

    const triggerDebouncedUpdate = useCallback(
        (overrides: Partial<ExamHeaderConfig> = {}) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                if (onUpdate) {
                    onUpdate(buildConfig(overrides));
                }
            }, 300);
        },
        [buildConfig, onUpdate],
    );

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white font-bold text-xs">
                        T
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm">
                        考査見出し枠の編集
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors"
                    title="閉じる"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 見出しテキスト */}
                <div>
                    <label className="block text-slate-700 font-medium mb-1">
                        見出しテキスト
                    </label>
                    <textarea
                        aria-label="見出しテキスト"
                        rows={3}
                        value={text}
                        onChange={(e) => {
                            const val = e.target.value;
                            setText(val);
                            triggerDebouncedUpdate({ text: val });
                        }}
                        onBlur={() => {
                            triggerImmediateUpdate({ text });
                        }}
                        placeholder="令和○年度　○学期考査　○年..."
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        空白文字（全角スペース）等で間隔を調整できます
                    </p>
                </div>

                {/* 幅と高さ */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                    <div className="font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
                        サイズ設定
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium">
                                枠の幅
                            </label>
                            <span className="text-slate-700 font-semibold tabular-nums">
                                {width}px
                            </span>
                        </div>
                        <input
                            aria-label="見出し枠の幅（px）"
                            type="range"
                            min={200}
                            max={1200}
                            step={4}
                            value={width}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setWidth(v);
                                triggerImmediateUpdate({ width: v });
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium">
                                枠の高さ
                            </label>
                            <span className="text-slate-700 font-semibold tabular-nums">
                                {height}px
                            </span>
                        </div>
                        <input
                            aria-label="見出し枠の高さ（px）"
                            type="range"
                            min={24}
                            max={120}
                            step={2}
                            value={height}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setHeight(v);
                                triggerImmediateUpdate({ height: v });
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 2. 年組氏名欄 フォーム
// ==========================================
interface NameboxFormProps {
    block: CustomNameboxGroup;
    onUpdate?: (config: NameboxConfig) => void;
    onClose: () => void;
}

const NameboxForm: React.FC<NameboxFormProps> = ({
    block,
    onUpdate,
    onClose,
}) => {
    const config = block.nameboxConfig || DEFAULT_NAMEBOX_CONFIG;

    const [labels, setLabels] = useState<[string, string, string, string]>([
        config.labels?.[0] ?? "○年",
        config.labels?.[1] ?? "組",
        config.labels?.[2] ?? "番",
        config.labels?.[3] ?? "氏名",
    ]);
    const [width, setWidth] = useState(config.width || 300);
    const [height, setHeight] = useState(config.height || 40);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        const c = block.nameboxConfig || DEFAULT_NAMEBOX_CONFIG;
        setLabels([
            c.labels?.[0] ?? "○年",
            c.labels?.[1] ?? "組",
            c.labels?.[2] ?? "番",
            c.labels?.[3] ?? "氏名",
        ]);
        setWidth(c.width || 300);
        setHeight(c.height || 40);
        isInitialMountRef.current = true;
    }, [block]);

    const buildConfig = useCallback(
        (overrides: Partial<NameboxConfig> = {}): NameboxConfig => {
            return {
                labels:
                    overrides.labels !== undefined ? overrides.labels : labels,
                width:
                    overrides.width !== undefined
                        ? overrides.width
                        : Number(width) || 300,
                height:
                    overrides.height !== undefined
                        ? overrides.height
                        : Number(height) || 40,
            };
        },
        [labels, width, height],
    );

    const triggerImmediateUpdate = useCallback(
        (overrides: Partial<NameboxConfig> = {}) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            if (onUpdate) {
                onUpdate(buildConfig(overrides));
            }
        },
        [buildConfig, onUpdate],
    );

    const triggerDebouncedUpdate = useCallback(
        (overrides: Partial<NameboxConfig> = {}) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                if (onUpdate) {
                    onUpdate(buildConfig(overrides));
                }
            }, 300);
        },
        [buildConfig, onUpdate],
    );

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const updateLabelIndex = (index: number, val: string) => {
        const nextLabels: [string, string, string, string] = [...labels];
        nextLabels[index] = val;
        setLabels(nextLabels);
        triggerDebouncedUpdate({ labels: nextLabels });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white font-bold text-xs">
                        N
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm">
                        年組氏名欄の編集
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors"
                    title="閉じる"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 各欄のラベル */}
                <div className="space-y-2">
                    <label className="block text-slate-700 font-medium">
                        欄のラベル
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-[10px] text-slate-500 block mb-0.5">
                                第1欄（年等）
                            </span>
                            <input
                                aria-label="年組氏名欄 第1欄"
                                type="text"
                                value={labels[0]}
                                onChange={(e) =>
                                    updateLabelIndex(0, e.target.value)
                                }
                                onBlur={() =>
                                    triggerImmediateUpdate({ labels })
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 block mb-0.5">
                                第2欄（組等）
                            </span>
                            <input
                                aria-label="年組氏名欄 第2欄"
                                type="text"
                                value={labels[1]}
                                onChange={(e) =>
                                    updateLabelIndex(1, e.target.value)
                                }
                                onBlur={() =>
                                    triggerImmediateUpdate({ labels })
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 block mb-0.5">
                                第3欄（番号等）
                            </span>
                            <input
                                aria-label="年組氏名欄 第3欄"
                                type="text"
                                value={labels[2]}
                                onChange={(e) =>
                                    updateLabelIndex(2, e.target.value)
                                }
                                onBlur={() =>
                                    triggerImmediateUpdate({ labels })
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 block mb-0.5">
                                第4欄（氏名等）
                            </span>
                            <input
                                aria-label="年組氏名欄 第4欄"
                                type="text"
                                value={labels[3]}
                                onChange={(e) =>
                                    updateLabelIndex(3, e.target.value)
                                }
                                onBlur={() =>
                                    triggerImmediateUpdate({ labels })
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* 幅と高さ */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                    <div className="font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
                        サイズ設定
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium">
                                枠の幅
                            </label>
                            <span className="text-slate-700 font-semibold tabular-nums">
                                {width}px
                            </span>
                        </div>
                        <input
                            type="range"
                            min={160}
                            max={600}
                            step={5}
                            value={width}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setWidth(v);
                                triggerImmediateUpdate({ width: v });
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium">
                                枠の高さ
                            </label>
                            <span className="text-slate-700 font-semibold tabular-nums">
                                {height}px
                            </span>
                        </div>
                        <input
                            type="range"
                            min={24}
                            max={100}
                            step={2}
                            value={height}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setHeight(v);
                                triggerImmediateUpdate({ height: v });
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. 観点別得点枠 フォーム
// ==========================================
interface ScoreTableFormProps {
    block: CustomScoreTableGroup;
    onUpdate?: (config: ScoreTableConfig) => void;
    onClose: () => void;
}

const ScoreTableForm: React.FC<ScoreTableFormProps> = ({
    block,
    onUpdate,
    onClose,
}) => {
    const config = block.scoreTableConfig || DEFAULT_SCORE_TABLE_CONFIG;

    const [colHeaders, setColHeaders] = useState<[string, string, string]>([
        config.colHeaders?.[0] ?? "知・技",
        config.colHeaders?.[1] ?? "思・判・表",
        config.colHeaders?.[2] ?? "合計",
    ]);
    const [maxScores, setMaxScores] = useState<[string, string, string]>([
        config.maxScores?.[0] ?? "/50",
        config.maxScores?.[1] ?? "/50",
        config.maxScores?.[2] ?? "/100",
    ]);
    const [width, setWidth] = useState(config.width || 240);
    const [height, setHeight] = useState(config.height || 60);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        const c = block.scoreTableConfig || DEFAULT_SCORE_TABLE_CONFIG;
        setColHeaders([
            c.colHeaders?.[0] ?? "知・技",
            c.colHeaders?.[1] ?? "思・判・表",
            c.colHeaders?.[2] ?? "合計",
        ]);
        setMaxScores([
            c.maxScores?.[0] ?? "/50",
            c.maxScores?.[1] ?? "/50",
            c.maxScores?.[2] ?? "/100",
        ]);
        setWidth(c.width || 240);
        setHeight(c.height || 60);
        isInitialMountRef.current = true;
    }, [block]);

    const buildConfig = useCallback(
        (overrides: Partial<ScoreTableConfig> = {}): ScoreTableConfig => {
            return {
                colHeaders:
                    overrides.colHeaders !== undefined
                        ? overrides.colHeaders
                        : colHeaders,
                maxScores:
                    overrides.maxScores !== undefined
                        ? overrides.maxScores
                        : maxScores,
                width:
                    overrides.width !== undefined
                        ? overrides.width
                        : Number(width) || 240,
                height:
                    overrides.height !== undefined
                        ? overrides.height
                        : Number(height) || 60,
            };
        },
        [colHeaders, maxScores, width, height],
    );

    const triggerImmediateUpdate = useCallback(
        (overrides: Partial<ScoreTableConfig> = {}) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            if (onUpdate) {
                onUpdate(buildConfig(overrides));
            }
        },
        [buildConfig, onUpdate],
    );

    const triggerDebouncedUpdate = useCallback(
        (overrides: Partial<ScoreTableConfig> = {}) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                if (onUpdate) {
                    onUpdate(buildConfig(overrides));
                }
            }, 300);
        },
        [buildConfig, onUpdate],
    );

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const updateColHeader = (index: number, val: string) => {
        const next: [string, string, string] = [...colHeaders];
        next[index] = val;
        setColHeaders(next);
        triggerDebouncedUpdate({ colHeaders: next });
    };

    const updateMaxScore = (index: number, val: string) => {
        const next: [string, string, string] = [...maxScores];
        next[index] = val;
        setMaxScores(next);
        triggerDebouncedUpdate({ maxScores: next });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white font-bold text-xs">
                        S
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm">
                        観点別得点枠の編集
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors"
                    title="閉じる"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 観点区分 & 配点 */}
                <div className="space-y-3">
                    <label className="block text-slate-700 font-medium">
                        観点名と配点
                    </label>

                    {[0, 1, 2].map((idx) => (
                        <div
                            key={idx}
                            className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1.5"
                        >
                            <div className="text-[10px] font-semibold text-slate-600">
                                列 {idx + 1}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-[10px] text-slate-500 block mb-0.5">
                                        区分名
                                    </span>
                                    <input
                                        type="text"
                                        value={colHeaders[idx]}
                                        onChange={(e) =>
                                            updateColHeader(idx, e.target.value)
                                        }
                                        onBlur={() =>
                                            triggerImmediateUpdate({
                                                colHeaders,
                                            })
                                        }
                                        className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 block mb-0.5">
                                        配点注記
                                    </span>
                                    <input
                                        type="text"
                                        value={maxScores[idx]}
                                        onChange={(e) =>
                                            updateMaxScore(idx, e.target.value)
                                        }
                                        onBlur={() =>
                                            triggerImmediateUpdate({
                                                maxScores,
                                            })
                                        }
                                        className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 幅と高さ */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                    <div className="font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
                        サイズ設定
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium">
                                枠の幅
                            </label>
                            <span className="text-slate-700 font-semibold tabular-nums">
                                {width}px
                            </span>
                        </div>
                        <input
                            type="range"
                            min={150}
                            max={500}
                            step={5}
                            value={width}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setWidth(v);
                                triggerImmediateUpdate({ width: v });
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium">
                                枠の高さ
                            </label>
                            <span className="text-slate-700 font-semibold tabular-nums">
                                {height}px
                            </span>
                        </div>
                        <input
                            type="range"
                            min={30}
                            max={120}
                            step={2}
                            value={height}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setHeight(v);
                                triggerImmediateUpdate({ height: v });
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. 大問ブロック フォーム (既存機能完全維持)
// ==========================================
interface QuestionBlockFormProps {
    block: CustomQuestionBlockGroup;
    onUpdate?: (config: QuestionBlockConfig) => void;
    onClose: () => void;
}

const QuestionBlockForm: React.FC<QuestionBlockFormProps> = ({
    block,
    onUpdate,
    onClose,
}) => {
    const config = block?.questionConfig;

    const [num, setNum] = useState("1");
    const [rubric, setRubric] = useState("");
    const [points, setPoints] = useState("");
    const [pattern, setPattern] = useState<QuestionPattern>("sub_parens");

    // 小問複合枠
    const [subRows, setSubRows] = useState(2);
    const [subCols, setSubCols] = useState(3);
    const [subRowHeight, setSubRowHeight] = useState(34);
    const [subLabelsText, setSubLabelsText] = useState("");

    // グリッド枠
    const [gridRows, setGridRows] = useState(2);
    const [gridCols, setGridCols] = useState(4);
    const [gridRowHeight, setGridRowHeight] = useState(32);

    // 丸数字
    const [circleRows, setCircleRows] = useState(1);
    const [circleCols, setCircleCols] = useState(5);
    const [circleHeight, setCircleHeight] = useState(32);
    const [circleCommaEnabled, setCircleCommaEnabled] = useState(false);
    const [circleCommaPaddingAuto, setCircleCommaPaddingAuto] = useState(true);
    const [circleCommaPaddingRatio, setCircleCommaPaddingRatio] =
        useState(0.451);

    // 2分割
    const [splitRatio, setSplitRatio] = useState("50:50");
    const [splitHeight, setSplitHeight] = useState(38);
    const [groups, setGroups] = useState<SubQuestionGroup[]>([
        {
            label: "1",
            height: 42,
            pattern: "grid",
            gridRows: 1,
            gridCols: 1,
            cells: [{ label: "", widthRatio: 1, type: "box" }],
        },
        {
            label: "2",
            height: 42,
            pattern: "sub_parens",
            subRows: 1,
            subCols: 3,
            subLabels: ["(a)", "(b)", "(c)"],
            cells: [
                { label: "(a)", widthRatio: 1, type: "box" },
                { label: "(b)", widthRatio: 1, type: "box" },
                { label: "(c)", widthRatio: 1, type: "box" },
            ],
        },
        {
            label: "3",
            height: 42,
            pattern: "essay",
            cells: [{ label: "", widthRatio: 1, type: "essay" }],
        },
    ]);
    const [blockWidth, setBlockWidth] = useState(SECTION_STANDARD_WIDTH);
    const blockWidthMm = Math.round(
        (Number(blockWidth) / PAPER_SIZES.B4_LANDSCAPE.widthPx) *
            B4_LANDSCAPE_MM.width,
    );

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMountRef = useRef(true);

    // 選択オブジェクトが切り替わったときにフォーム初期化
    useEffect(() => {
        if (!config) return;

        setNum(config.num || "1");
        setRubric(config.rubric || "");
        setPoints(config.points || "");
        setPattern(config.pattern || "sub_parens");
        setBlockWidth(config.blockWidth ?? SECTION_STANDARD_WIDTH);

        setSubRows(config.subRows || 2);
        setSubCols(config.subCols || 3);
        setSubRowHeight(config.subRowHeight || 34);
        setSubLabelsText((config.subLabels || []).join(", "));

        setGridRows(config.gridRows || 2);
        setGridCols(config.gridCols || 4);
        setGridRowHeight(config.gridRowHeight || 32);

        setCircleRows(config.circleRows ?? 1);
        setCircleCols(config.circleCols ?? config.circleCount ?? 5);
        setCircleHeight(config.circleHeight || 32);
        setCircleCommaEnabled(config.circleCommaEnabled ?? false);
        setCircleCommaPaddingAuto(config.circleCommaPaddingAuto ?? true);
        setCircleCommaPaddingRatio(
            config.circleCommaPaddingRatio ??
                getDefaultCircleCommaPaddingRatio(
                    config.circleCols ?? config.circleCount ?? 5,
                ),
        );

        setSplitRatio(config.splitRatio || "50:50");
        setSplitHeight(config.splitHeight || 38);
        setGroups(
            config.groups?.length
                ? config.groups.map((group, index) => {
                      const copy = JSON.parse(JSON.stringify(group));
                      if (copy.pattern) return copy;
                      const cells = copy.cells?.length
                          ? copy.cells
                          : [{ label: "", widthRatio: 1, type: "box" }];
                      return {
                          ...copy,
                          label: copy.label || String(index + 1),
                          pattern: "sub_parens",
                          subRows: 1,
                          subCols: cells.length,
                          subLabels: cells.map(
                              (cell: SubQuestionCell) => cell.label,
                          ),
                      };
                  })
                : [
                      {
                          label: "1",
                          height: 42,
                          pattern: "grid",
                          gridRows: 1,
                          gridCols: 1,
                          cells: [{ label: "", widthRatio: 1, type: "box" }],
                      },
                      {
                          label: "2",
                          height: 42,
                          pattern: "sub_parens",
                          subRows: 1,
                          subCols: 3,
                          subLabels: ["(a)", "(b)", "(c)"],
                          cells: [
                              { label: "(a)", widthRatio: 1, type: "box" },
                              { label: "(b)", widthRatio: 1, type: "box" },
                              { label: "(c)", widthRatio: 1, type: "box" },
                          ],
                      },
                      {
                          label: "3",
                          height: 42,
                          pattern: "essay",
                          cells: [{ label: "", widthRatio: 1, type: "essay" }],
                      },
                  ],
        );

        isInitialMountRef.current = true;
    }, [block]); // eslint-disable-line react-hooks/exhaustive-deps

    const buildConfig = useCallback(
        (overrides: Partial<QuestionBlockConfig> = {}): QuestionBlockConfig => {
            const labels =
                overrides.subLabels !== undefined
                    ? overrides.subLabels
                    : subLabelsText
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);

            const cRows =
                overrides.circleRows !== undefined
                    ? overrides.circleRows
                    : Number(circleRows) || 1;
            const cCols =
                overrides.circleCols !== undefined
                    ? overrides.circleCols
                    : Number(circleCols) || 1;

            return {
                num:
                    (overrides.num !== undefined
                        ? overrides.num
                        : num
                    ).trim() || "1",
                rubric: (overrides.rubric !== undefined
                    ? overrides.rubric
                    : rubric
                ).trim(),
                points: (overrides.points !== undefined
                    ? overrides.points
                    : points
                ).trim(),
                pattern:
                    overrides.pattern !== undefined
                        ? overrides.pattern
                        : pattern,
                subRows:
                    overrides.subRows !== undefined
                        ? overrides.subRows
                        : Number(subRows) || 1,
                subCols:
                    overrides.subCols !== undefined
                        ? overrides.subCols
                        : Number(subCols) || 1,
                subRowHeight:
                    overrides.subRowHeight !== undefined
                        ? overrides.subRowHeight
                        : Number(subRowHeight) || 34,
                subLabels: labels,
                gridRows:
                    overrides.gridRows !== undefined
                        ? overrides.gridRows
                        : Number(gridRows) || 1,
                gridCols:
                    overrides.gridCols !== undefined
                        ? overrides.gridCols
                        : Number(gridCols) || 1,
                gridRowHeight:
                    overrides.gridRowHeight !== undefined
                        ? overrides.gridRowHeight
                        : Number(gridRowHeight) || 32,
                circleRows: cRows,
                circleCols: cCols,
                circleCount: cRows * cCols,
                circleHeight:
                    overrides.circleHeight !== undefined
                        ? overrides.circleHeight
                        : Number(circleHeight) || 32,
                circleCommaEnabled:
                    overrides.circleCommaEnabled !== undefined
                        ? overrides.circleCommaEnabled
                        : circleCommaEnabled,
                circleCommaCount:
                    overrides.circleCommaCount !== undefined
                        ? overrides.circleCommaCount
                        : 1,
                circleCommaPaddingAuto:
                    overrides.circleCommaPaddingAuto !== undefined
                        ? overrides.circleCommaPaddingAuto
                        : circleCommaPaddingAuto,
                circleCommaPaddingRatio:
                    overrides.circleCommaPaddingRatio !== undefined
                        ? overrides.circleCommaPaddingRatio
                        : circleCommaPaddingRatio,
                splitRatio:
                    overrides.splitRatio !== undefined
                        ? overrides.splitRatio
                        : splitRatio,
                splitHeight:
                    overrides.splitHeight !== undefined
                        ? overrides.splitHeight
                        : Number(splitHeight) || 38,
                groups:
                    overrides.groups !== undefined
                        ? overrides.groups
                        : groups.map((group) => ({
                              label: group.label.trim(),
                              height: Math.max(24, Number(group.height) || 42),
                              cells: (group.cells || []).map((cell) => ({
                                  label: cell.label.trim(),
                                  widthRatio: Math.max(
                                      0.01,
                                      Number(cell.widthRatio) || 1,
                                  ),
                                  type: cell.type,
                              })),
                              pattern: group.pattern || "sub_parens",
                              subRows: Math.max(1, Number(group.subRows) || 1),
                              subCols: Math.max(1, Number(group.subCols) || 1),
                              subLabels: group.subLabels || [],
                              subRowConfigs: group.subRowConfigs?.map((row) => ({
                                  labels: row.labels.map((label) => label.trim()),
                              })),
                              gridRows: Math.max(
                                  1,
                                  Number(group.gridRows) || 1,
                              ),
                              gridCols: Math.max(
                                  1,
                                  Number(group.gridCols) || 1,
                              ),
                              circleRows: Math.max(
                                  1,
                                  Number(group.circleRows) || 1,
                              ),
                              circleCols: Math.max(
                                  1,
                                  Number(group.circleCols) || 1,
                              ),
                              circleCommaEnabled:
                                  group.circleCommaEnabled ?? false,
                              circleCommaPaddingAuto:
                                  group.circleCommaPaddingAuto ?? true,
                              circleCommaPaddingRatio:
                                  group.circleCommaPaddingRatio ??
                                  getDefaultCircleCommaPaddingRatio(
                                      group.circleCols || 1,
                                  ),
                              splitRatio: group.splitRatio || "50:50",
                          })),
                blockWidth: clampQuestionBlockWidth(
                    overrides.blockWidth !== undefined
                        ? overrides.blockWidth
                        : Number(blockWidth) || SECTION_STANDARD_WIDTH,
                ),
            };
        },
        [
            num,
            rubric,
            points,
            pattern,
            subRows,
            subCols,
            subRowHeight,
            subLabelsText,
            gridRows,
            gridCols,
            gridRowHeight,
            circleRows,
            circleCols,
            circleHeight,
            circleCommaEnabled,
            circleCommaPaddingAuto,
            circleCommaPaddingRatio,
            splitRatio,
            splitHeight,
            groups,
            blockWidth,
        ],
    );

    const updateGroup = (
        groupIndex: number,
        updates: Partial<SubQuestionGroup>,
    ) => {
        const next = groups.map((group, index) =>
            index === groupIndex ? { ...group, ...updates } : group,
        );
        setGroups(next);
        triggerImmediateUpdate({ groups: next });
    };

    const getSubParensRows = (group: SubQuestionGroup): string[][] => {
        if (group.subRowConfigs?.length) {
            return group.subRowConfigs.map((row) => [...row.labels]);
        }
        const rows = Math.max(1, Number(group.subRows) || 1);
        const cols = Math.max(1, Number(group.subCols) || 1);
        return Array.from({ length: rows }, (_, rowIndex) =>
            Array.from(
                { length: cols },
                (_, colIndex) =>
                    group.subLabels?.[rowIndex * cols + colIndex] || "",
            ),
        );
    };

    const updateSubParensRows = (
        groupIndex: number,
        rows: string[][],
    ) => {
        updateGroup(groupIndex, {
            subRowConfigs: rows.map((labels) => ({ labels })),
            subRows: rows.length,
            subCols: Math.max(1, ...rows.map((labels) => labels.length)),
            subLabels: rows.flat(),
        });
    };

    const updateSubParensCell = (
        groupIndex: number,
        rowIndex: number,
        colIndex: number,
        value: string,
    ) => {
        const rows = getSubParensRows(groups[groupIndex]);
        const nextRows = rows.map((row, index) => {
            if (index !== rowIndex) return row;
            const nextRow = [...row];
            nextRow[colIndex] = value;
            return nextRow;
        });
        updateSubParensRows(groupIndex, nextRows);
    };

    const addSubParensColumn = (groupIndex: number, rowIndex: number) => {
        const rows = getSubParensRows(groups[groupIndex]);
        const nextRows = rows.map((row, index) =>
            index === rowIndex ? [...row, ""] : row,
        );
        updateSubParensRows(groupIndex, nextRows);
    };

    const removeSubParensColumn = (
        groupIndex: number,
        rowIndex: number,
        colIndex: number,
    ) => {
        const rows = getSubParensRows(groups[groupIndex]);
        const nextRows = rows.map((row, index) => {
            if (index !== rowIndex) return row;
            if (row.length <= 1) return row;
            return row.filter((_, columnIndex) => columnIndex !== colIndex);
        });
        updateSubParensRows(groupIndex, nextRows);
    };

    const addGroup = () => {
        const next = [
            ...groups,
            {
                label: String(groups.length + 1),
                height: 42,
                pattern: "essay" as const,
            },
        ];
        setGroups(next);
        triggerImmediateUpdate({ groups: next });
    };

    const removeGroup = (groupIndex: number) => {
        if (groups.length <= 1) return;
        const next = groups.filter((_, index) => index !== groupIndex);
        setGroups(next);
        triggerImmediateUpdate({ groups: next });
    };

    // スライダー等の即時更新ハンドラ
    const triggerImmediateUpdate = useCallback(
        (overrides: Partial<QuestionBlockConfig> = {}) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            if (onUpdate) {
                onUpdate(buildConfig(overrides));
            }
        },
        [buildConfig, onUpdate],
    );

    const applyBlockWidth = useCallback(
        (raw: number) => {
            const clamped = clampQuestionBlockWidth(raw);
            setBlockWidth(clamped);
            triggerImmediateUpdate({ blockWidth: clamped });
        },
        [triggerImmediateUpdate],
    );

    // テキスト入力等のデバウンス更新ハンドラ (300ms)
    const triggerDebouncedUpdate = useCallback(
        (overrides: Partial<QuestionBlockConfig> = {}) => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                if (onUpdate) {
                    onUpdate(buildConfig(overrides));
                }
            }, 300);
        },
        [buildConfig, onUpdate],
    );

    // アンマウント時のタイマークリア
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white font-bold text-xs">
                        Q
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm">
                        大問 {num || ""} のプロパティ
                    </h3>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                        選択中の枠を直接編集
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors"
                    title="閉じる"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 基本情報 */}
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-slate-700 font-medium mb-1">
                                大問番号
                            </label>
                            <input
                                type="text"
                                aria-label="大問番号"
                                value={num}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNum(val);
                                    triggerDebouncedUpdate({ num: val });
                                }}
                                onBlur={() => {
                                    triggerImmediateUpdate({ num });
                                }}
                                placeholder="1"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-slate-700 font-medium mb-1">
                                配点注記
                            </label>
                            <input
                                type="text"
                                aria-label="配点注記"
                                value={points}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPoints(val);
                                    triggerDebouncedUpdate({ points: val });
                                }}
                                onBlur={() => {
                                    triggerImmediateUpdate({ points });
                                }}
                                placeholder="例: 各問2点/10点"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-700 font-medium mb-1">
                            指示文・観点名 (rubric)
                        </label>
                        <input
                            type="text"
                            aria-label="指示文・観点名（rubric）"
                            value={rubric}
                            onChange={(e) => {
                                const val = e.target.value;
                                setRubric(val);
                                triggerDebouncedUpdate({ rubric: val });
                            }}
                            onBlur={() => {
                                triggerImmediateUpdate({ rubric });
                            }}
                            placeholder="例: 知識・技能 / ○・△・×"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-slate-700 font-medium">
                                大問の横幅
                            </label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    aria-label="大問の横幅（px）"
                                    min={QUESTION_BLOCK_WIDTH_LIMITS.min}
                                    max={QUESTION_BLOCK_WIDTH_LIMITS.max}
                                    step={4}
                                    value={blockWidth}
                                    onChange={(e) => {
                                        setBlockWidth(Number(e.target.value));
                                    }}
                                    onBlur={() => {
                                        applyBlockWidth(blockWidth);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            applyBlockWidth(blockWidth);
                                        }
                                    }}
                                    className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right tabular-nums bg-white focus:ring-1 focus:ring-indigo-500"
                                />
                                <span className="text-slate-500 text-[10px]">
                                    px
                                </span>
                                <span className="text-slate-500 text-[10px]">
                                    （約{blockWidthMm}mm）
                                </span>
                            </div>
                        </div>
                        <input
                            type="range"
                            aria-label="大問の横幅（px）"
                            min={QUESTION_BLOCK_WIDTH_LIMITS.min}
                            max={QUESTION_BLOCK_WIDTH_LIMITS.max}
                            step={4}
                            value={blockWidth}
                            onChange={(e) => {
                                applyBlockWidth(Number(e.target.value));
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-medium mb-1">
                            解答欄パターン
                        </label>
                        <select
                            aria-label="解答欄パターン"
                            value={pattern}
                            onChange={(e) => {
                                const newPattern = e.target
                                    .value as QuestionPattern;
                                setPattern(newPattern);
                                triggerImmediateUpdate({ pattern: newPattern });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-slate-700"
                        >
                            <option value="sub_parens">
                                小問複合枠（(1)(2)...）
                            </option>
                            <option value="grid">
                                グリッド枠（行×列 均等割り）
                            </option>
                            <option value="circle_comma">
                                丸数字解答欄（①②...）
                            </option>
                            <option value="split_2">
                                左右2分割（記号＋記述など）
                            </option>
                            <option value="grouped">
                                小問グループ（行ごとに設定）
                            </option>
                        </select>
                    </div>
                </div>

                <hr className="border-slate-200" />

                {/* パターン別設定 */}
                {pattern === "sub_parens" && (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
                            小問複合枠の設定
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-slate-600 font-medium mb-1">
                                    行数
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={subRows}
                                    onChange={(e) => {
                                        const v = Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        );
                                        setSubRows(v);
                                        triggerImmediateUpdate({ subRows: v });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 font-medium mb-1">
                                    列数
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={8}
                                    value={subCols}
                                    onChange={(e) => {
                                        const v = Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        );
                                        setSubCols(v);
                                        triggerImmediateUpdate({ subCols: v });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-slate-600 font-medium">
                                    行の高さ
                                </label>
                                <span className="text-slate-700 font-semibold tabular-nums">
                                    {subRowHeight}px
                                </span>
                            </div>
                            <input
                                type="range"
                                min={24}
                                max={100}
                                step={2}
                                value={subRowHeight}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setSubRowHeight(v);
                                    triggerImmediateUpdate({ subRowHeight: v });
                                }}
                                className="w-full accent-indigo-600"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-600 font-medium mb-1">
                                カスタム小問ラベル (カンマ区切り)
                            </label>
                            <input
                                type="text"
                                value={subLabelsText}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSubLabelsText(val);
                                    const labels = val
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                                    triggerDebouncedUpdate({
                                        subLabels: labels,
                                    });
                                }}
                                onBlur={() => {
                                    const labels = subLabelsText
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                                    triggerImmediateUpdate({
                                        subLabels: labels,
                                    });
                                }}
                                placeholder="例: (1), (2), (3) または ア, イ, ウ"
                                className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                空欄の場合は (1), (2)... が自動で振られます
                            </p>
                        </div>
                    </div>
                )}

                {pattern === "grid" && (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
                            グリッド枠の設定
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-slate-600 font-medium mb-1">
                                    行数
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={gridRows}
                                    onChange={(e) => {
                                        const v = Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        );
                                        setGridRows(v);
                                        triggerImmediateUpdate({ gridRows: v });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 font-medium mb-1">
                                    列数
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={8}
                                    value={gridCols}
                                    onChange={(e) => {
                                        const v = Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        );
                                        setGridCols(v);
                                        triggerImmediateUpdate({ gridCols: v });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-slate-600 font-medium">
                                    行の高さ
                                </label>
                                <span className="text-slate-700 font-semibold tabular-nums">
                                    {gridRowHeight}px
                                </span>
                            </div>
                            <input
                                type="range"
                                min={24}
                                max={100}
                                step={2}
                                value={gridRowHeight}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setGridRowHeight(v);
                                    triggerImmediateUpdate({
                                        gridRowHeight: v,
                                    });
                                }}
                                className="w-full accent-indigo-600"
                            />
                        </div>
                    </div>
                )}

                {pattern === "circle_comma" && (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
                            丸数字解答欄の設定
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-slate-600 font-medium mb-1">
                                    行数
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={circleRows}
                                    onChange={(e) => {
                                        const v = Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        );
                                        setCircleRows(v);
                                        triggerImmediateUpdate({
                                            circleRows: v,
                                        });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 font-medium mb-1">
                                    列数 (1行あたりの個数)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={circleCols}
                                    onChange={(e) => {
                                        const v = Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        );
                                        setCircleCols(v);
                                        const ratio = circleCommaPaddingAuto
                                            ? getDefaultCircleCommaPaddingRatio(
                                                  v,
                                              )
                                            : circleCommaPaddingRatio;
                                        setCircleCommaPaddingRatio(ratio);
                                        triggerImmediateUpdate({
                                            circleCols: v,
                                            circleCommaPaddingRatio: ratio,
                                        });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-slate-600 font-medium">
                                    行の高さ
                                </label>
                                <span className="text-slate-700 font-semibold tabular-nums">
                                    {circleHeight}px
                                </span>
                            </div>
                            <input
                                type="range"
                                min={24}
                                max={80}
                                step={2}
                                value={circleHeight}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setCircleHeight(v);
                                    triggerImmediateUpdate({
                                        circleHeight: v,
                                    });
                                }}
                                className="w-full accent-indigo-600"
                            />
                        </div>

                        <div className="pt-2 border-t border-slate-200 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                                <input
                                    type="checkbox"
                                    checked={circleCommaEnabled}
                                    onChange={(e) => {
                                        setCircleCommaEnabled(e.target.checked);
                                        triggerImmediateUpdate({
                                            circleCommaEnabled:
                                                e.target.checked,
                                        });
                                    }}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>「,」で区切る</span>
                            </label>

                            {circleCommaEnabled && (
                                <div className="pl-5 space-y-1.5 text-[11px] text-slate-600">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={circleCommaPaddingAuto}
                                            onChange={(e) => {
                                                const isAuto = e.target.checked;
                                                setCircleCommaPaddingAuto(
                                                    isAuto,
                                                );
                                                const ratio = isAuto
                                                    ? getDefaultCircleCommaPaddingRatio(
                                                          circleCols,
                                                      )
                                                    : circleCommaPaddingRatio;
                                                setCircleCommaPaddingRatio(
                                                    ratio,
                                                );
                                                triggerImmediateUpdate({
                                                    circleCommaPaddingAuto:
                                                        isAuto,
                                                    circleCommaPaddingRatio:
                                                        ratio,
                                                });
                                            }}
                                            className="rounded text-indigo-600"
                                        />
                                        <span>カンマ位置を自動調整</span>
                                    </label>

                                    {!circleCommaPaddingAuto && (
                                        <div>
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                                <span>位置調整比率</span>
                                                <span>
                                                    {Math.round(
                                                        circleCommaPaddingRatio *
                                                            100,
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0.1}
                                                max={0.9}
                                                step={0.01}
                                                value={circleCommaPaddingRatio}
                                                onChange={(e) => {
                                                    const v = Number(
                                                        e.target.value,
                                                    );
                                                    setCircleCommaPaddingRatio(
                                                        v,
                                                    );
                                                    triggerImmediateUpdate({
                                                        circleCommaPaddingRatio:
                                                            v,
                                                    });
                                                }}
                                                className="w-full accent-indigo-600"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {pattern === "split_2" && (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
                            左右2分割の設定
                        </div>

                        <div>
                            <label className="block text-slate-600 font-medium mb-1">
                                分割比率 (左 : 右)
                            </label>
                            <select
                                value={splitRatio}
                                onChange={(e) => {
                                    setSplitRatio(e.target.value);
                                    triggerImmediateUpdate({
                                        splitRatio: e.target.value,
                                    });
                                }}
                                className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                            >
                                <option value="50:50">50 : 50 （均等）</option>
                                <option value="30:70">
                                    30 : 70 （左狭 / 右広）
                                </option>
                                <option value="70:30">
                                    70 : 30 （左広 / 右狭）
                                </option>
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-slate-600 font-medium">
                                    枠の高さ
                                </label>
                                <span className="text-slate-700 font-semibold tabular-nums">
                                    {splitHeight}px
                                </span>
                            </div>
                            <input
                                type="range"
                                min={24}
                                max={150}
                                step={2}
                                value={splitHeight}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setSplitHeight(v);
                                    triggerImmediateUpdate({ splitHeight: v });
                                }}
                                className="w-full accent-indigo-600"
                            />
                        </div>
                    </div>
                )}

                {pattern === "grouped" && (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-slate-700 text-[11px]">
                                    小問グループの設定
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    行ごとに解答欄を編集
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addGroup}
                                className="px-2 py-1 text-[10px] text-indigo-700 border border-indigo-200 rounded bg-white hover:bg-indigo-50"
                            >
                                ＋小問
                            </button>
                        </div>
                        {groups.map((group, groupIndex) => (
                            <div
                                key={`property-group-${groupIndex}`}
                                className="rounded border border-slate-200 bg-white p-2 space-y-2"
                            >
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        aria-label={`小問${groupIndex + 1}番号`}
                                        value={group.label}
                                        onChange={(e) =>
                                            updateGroup(groupIndex, {
                                                label: e.target.value,
                                            })
                                        }
                                        className="w-12 px-1.5 py-1 border border-slate-300 rounded text-center"
                                    />
                                    <input
                                        type="number"
                                        aria-label={`小問${groupIndex + 1}高さ`}
                                        min={24}
                                        max={240}
                                        value={group.height}
                                        onChange={(e) =>
                                            updateGroup(groupIndex, {
                                                height:
                                                    Number(e.target.value) ||
                                                    24,
                                            })
                                        }
                                        className="w-14 px-1.5 py-1 border border-slate-300 rounded text-center"
                                    />
                                    <span className="text-[10px] text-slate-500">
                                        px
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeGroup(groupIndex)}
                                        disabled={groups.length <= 1}
                                        className="ml-auto text-[10px] text-red-600 disabled:opacity-40"
                                    >
                                        削除
                                    </button>
                                </div>
                                <select
                                    aria-label={`小問${groupIndex + 1}パターン`}
                                    value={group.pattern || "sub_parens"}
                                    onChange={(e) =>
                                        updateGroup(groupIndex, {
                                            pattern: e.target
                                                .value as SubQuestionPattern,
                                        })
                                    }
                                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                                >
                                    <option value="sub_parens">
                                        小問複合枠
                                    </option>
                                    <option value="grid">等分割グリッド</option>
                                    <option value="circle_comma">
                                        丸数字区分
                                    </option>
                                    <option value="split_2">左右2分割</option>
                                    <option value="essay">記述欄</option>
                                </select>

                                {group.pattern === "sub_parens" && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-500">
                                                行ごとのラベル・列数
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const rows =
                                                        getSubParensRows(group);
                                                    updateSubParensRows(
                                                        groupIndex,
                                                        [...rows, [""]],
                                                    );
                                                }}
                                                className="px-1.5 py-0.5 text-[10px] text-indigo-700 border border-indigo-200 rounded"
                                            >
                                                ＋行
                                            </button>
                                        </div>
                                        {getSubParensRows(group).map(
                                            (row, rowIndex, rows) => (
                                                <div
                                                    key={`property-sub-row-${groupIndex}-${rowIndex}`}
                                                    className="rounded border border-slate-200 bg-slate-50 p-2 space-y-1.5"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-semibold text-slate-500">
                                                            {rowIndex + 1}行
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    addSubParensColumn(
                                                                        groupIndex,
                                                                        rowIndex,
                                                                    )
                                                                }
                                                                className="px-1.5 py-0.5 text-[10px] text-indigo-700 border border-indigo-200 rounded bg-white"
                                                            >
                                                                ＋列
                                                            </button>
                                                            {rows.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateSubParensRows(
                                                                            groupIndex,
                                                                            rows.filter(
                                                                                (
                                                                                    _,
                                                                                    index,
                                                                                ) =>
                                                                                    index !==
                                                                                    rowIndex,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="px-1.5 py-0.5 text-[10px] text-red-600 border border-red-200 rounded bg-white"
                                                                >
                                                                    行削除
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {row.map(
                                                            (
                                                                label,
                                                                colIndex,
                                                            ) => (
                                                                <div
                                                                    key={`property-sub-col-${groupIndex}-${rowIndex}-${colIndex}`}
                                                                    className="flex items-center gap-0.5"
                                                                >
                                                                    <input
                                                                        type="text"
                                                                        aria-label={`小問${groupIndex + 1} ${rowIndex + 1}行 ${colIndex + 1}列のラベル`}
                                                                        value={
                                                                            label
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateSubParensCell(
                                                                                groupIndex,
                                                                                rowIndex,
                                                                                colIndex,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-16 px-1.5 py-1 border border-slate-300 rounded text-center font-mono bg-white"
                                                                        placeholder="(a)"
                                                                    />
                                                                    {row.length >
                                                                        1 && (
                                                                        <button
                                                                            type="button"
                                                                            aria-label={`${rowIndex + 1}行 ${colIndex + 1}列を削除`}
                                                                            onClick={() =>
                                                                                removeSubParensColumn(
                                                                                    groupIndex,
                                                                                    rowIndex,
                                                                                    colIndex,
                                                                                )
                                                                            }
                                                                            className="px-1 py-0.5 text-[10px] text-red-600 hover:bg-red-50 rounded"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}

                                {group.pattern === "grid" && (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <input
                                            type="number"
                                            min={1}
                                            value={group.gridRows || 1}
                                            onChange={(e) =>
                                                updateGroup(groupIndex, {
                                                    gridRows:
                                                        Number(
                                                            e.target.value,
                                                        ) || 1,
                                                })
                                            }
                                            className="px-1.5 py-1 border border-slate-300 rounded text-center"
                                            placeholder="行数"
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            value={group.gridCols || 1}
                                            onChange={(e) =>
                                                updateGroup(groupIndex, {
                                                    gridCols:
                                                        Number(
                                                            e.target.value,
                                                        ) || 1,
                                                })
                                            }
                                            className="px-1.5 py-1 border border-slate-300 rounded text-center"
                                            placeholder="列数"
                                        />
                                    </div>
                                )}

                                {group.pattern === "circle_comma" && (
                                    <div className="space-y-1.5">
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <input
                                                type="number"
                                                min={1}
                                                value={group.circleRows || 1}
                                                onChange={(e) =>
                                                    updateGroup(groupIndex, {
                                                        circleRows:
                                                            Number(
                                                                e.target.value,
                                                            ) || 1,
                                                    })
                                                }
                                                className="px-1.5 py-1 border border-slate-300 rounded text-center"
                                                placeholder="行数"
                                            />
                                            <input
                                                type="number"
                                                min={1}
                                                value={group.circleCols || 1}
                                                onChange={(e) =>
                                                    updateGroup(groupIndex, {
                                                        circleCols:
                                                            Number(
                                                                e.target.value,
                                                            ) || 1,
                                                    })
                                                }
                                                className="px-1.5 py-1 border border-slate-300 rounded text-center"
                                                placeholder="列数"
                                            />
                                        </div>
                                        <label className="flex items-center gap-1 text-[10px] text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    group.circleCommaEnabled ??
                                                    false
                                                }
                                                onChange={(e) =>
                                                    updateGroup(groupIndex, {
                                                        circleCommaEnabled:
                                                            e.target.checked,
                                                    })
                                                }
                                            />
                                            「,」で区切る
                                        </label>
                                        <label className="flex items-center gap-1 text-[10px] text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    group.circleCommaPaddingAuto ??
                                                    true
                                                }
                                                disabled={
                                                    !group.circleCommaEnabled
                                                }
                                                onChange={(e) =>
                                                    updateGroup(groupIndex, {
                                                        circleCommaPaddingAuto:
                                                            e.target.checked,
                                                    })
                                                }
                                            />
                                            位置を自動調整
                                        </label>
                                        <label className="flex items-center gap-1 text-[10px] text-slate-600">
                                            カンマ位置（セル幅に対する比率 %）
                                            <input
                                                type="number"
                                                min={5}
                                                max={95}
                                                value={Math.round(
                                                    ((group.circleCommaPaddingAuto ??
                                                    true)
                                                        ? getDefaultCircleCommaPaddingRatio(
                                                              group.circleCols ||
                                                                  1,
                                                          )
                                                        : (group.circleCommaPaddingRatio ??
                                                          0.45)) * 100,
                                                )}
                                                disabled={
                                                    !group.circleCommaEnabled ||
                                                    (group.circleCommaPaddingAuto ??
                                                        true)
                                                }
                                                onChange={(e) =>
                                                    updateGroup(groupIndex, {
                                                        circleCommaPaddingAuto: false,
                                                        circleCommaPaddingRatio:
                                                            Math.min(
                                                                0.95,
                                                                Math.max(
                                                                    0.05,
                                                                    (Number(
                                                                        e.target
                                                                            .value,
                                                                    ) || 5) /
                                                                        100,
                                                                ),
                                                            ),
                                                    })
                                                }
                                                className="w-14 px-1 py-1 border border-slate-300 rounded text-center disabled:bg-slate-100"
                                            />
                                            %
                                            {(group.circleCommaPaddingAuto ??
                                                true) && (
                                                <span className="text-slate-400">
                                                    （自動）
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                )}

                                {group.pattern === "split_2" && (
                                    <select
                                        value={group.splitRatio || "50:50"}
                                        onChange={(e) =>
                                            updateGroup(groupIndex, {
                                                splitRatio: e.target.value,
                                            })
                                        }
                                        className="w-full px-1.5 py-1 border border-slate-300 rounded bg-white"
                                    >
                                        <option value="50:50">50 : 50</option>
                                        <option value="30:70">30 : 70</option>
                                        <option value="70:30">70 : 30</option>
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
