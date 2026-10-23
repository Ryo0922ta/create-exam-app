"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ScoreTableConfig } from "@/types/editor";
import { DEFAULT_SCORE_TABLE_CONFIG, type CustomScoreTableGroup } from "@/lib/editor/basicPartBuilder";
import type { ScoreTableFormProps } from "./types";

export const ScoreTableForm = ({
    block,
    onUpdate,
    onClose,
}: ScoreTableFormProps) => {
    const config = block.scoreTableConfig || DEFAULT_SCORE_TABLE_CONFIG;

    const [colHeaders, setColHeaders] = useState<string[]>(
        config.colHeaders?.length >= 2
            ? [...config.colHeaders]
            : ["知・技", "思・判・表", "合計"],
    );
    const [maxScores, setMaxScores] = useState<string[]>(
        config.colHeaders?.length >= 2
            ? config.colHeaders.map((_, index) => config.maxScores?.[index] ?? "")
            : ["/50", "/50", "/100"],
    );
    const [width, setWidth] = useState(config.width || 240);
    const [height, setHeight] = useState(config.height || 60);
    const [rowHeights, setRowHeights] = useState<[number, number]>(
        config.rowHeights || [
            Math.round((config.height || 60) / 2),
            Math.floor((config.height || 60) / 2),
        ],
    );

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        const c = block.scoreTableConfig || DEFAULT_SCORE_TABLE_CONFIG;
        const nextHeaders =
            c.colHeaders?.length >= 2
                ? [...c.colHeaders]
                : ["知・技", "思・判・表", "合計"];
        setColHeaders(nextHeaders);
        setMaxScores(
            nextHeaders.map((_, index) => c.maxScores?.[index] ?? ""),
        );
        setWidth(c.width || 240);
        setHeight(c.height || 60);
        const nextHeight = c.height || 60;
        setRowHeights(
            c.rowHeights || [
                Math.round(nextHeight / 2),
                Math.floor(nextHeight / 2),
            ],
        );
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
                rowHeights:
                    overrides.rowHeights !== undefined
                        ? overrides.rowHeights
                        : rowHeights,
            };
        },
        [colHeaders, maxScores, width, height, rowHeights],
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
        const next = [...colHeaders];
        next[index] = val;
        setColHeaders(next);
        triggerDebouncedUpdate({ colHeaders: next });
    };

    const updateMaxScore = (index: number, val: string) => {
        const next = [...maxScores];
        next[index] = val;
        setMaxScores(next);
        triggerDebouncedUpdate({ maxScores: next });
    };

    const addColumn = () => {
        if (colHeaders.length >= 8) return;
        const nextHeaders = [...colHeaders, `観点${colHeaders.length + 1}`];
        const nextScores = [...maxScores, ""];
        setColHeaders(nextHeaders);
        setMaxScores(nextScores);
        triggerImmediateUpdate({
            colHeaders: nextHeaders,
            maxScores: nextScores,
        });
    };

    const removeColumn = (index: number) => {
        if (colHeaders.length <= 2) return;
        const nextHeaders = colHeaders.filter((_, itemIndex) => itemIndex !== index);
        const nextScores = maxScores.filter((_, itemIndex) => itemIndex !== index);
        setColHeaders(nextHeaders);
        setMaxScores(nextScores);
        triggerImmediateUpdate({
            colHeaders: nextHeaders,
            maxScores: nextScores,
        });
    };

    const updateHeaderRowHeight = (value: number) => {
        const next: [number, number] = [value, Math.max(15, height - value)];
        setRowHeights(next);
        triggerImmediateUpdate({ rowHeights: next });
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

                    {colHeaders.map((_, idx) => (
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
                                <button
                                    type="button"
                                    aria-label={`列${idx + 1}を削除`}
                                    onClick={() => removeColumn(idx)}
                                    disabled={colHeaders.length <= 2}
                                    className="col-span-2 text-[10px] text-rose-600 disabled:text-slate-300 text-right"
                                >
                                    この観点を削除
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addColumn}
                        disabled={colHeaders.length >= 8}
                        className="w-full px-2 py-1.5 text-xs rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:text-slate-300 disabled:border-slate-200"
                    >
                        + 観点を追加（{colHeaders.length}/8）
                    </button>
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
                                const nextRowHeights: [number, number] = [
                                    Math.min(v - 15, rowHeights[0]),
                                    Math.max(15, v - Math.min(v - 15, rowHeights[0])),
                                ];
                                setRowHeights(nextRowHeights);
                                triggerImmediateUpdate({
                                    height: v,
                                    rowHeights: nextRowHeights,
                                });
                            }}
                            className="w-full accent-indigo-600"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium">
                                観点名行の高さ
                            </label>
                            <span className="text-slate-700 font-semibold tabular-nums">
                                {rowHeights[0]}px
                            </span>
                        </div>
                        <input
                            aria-label="観点名行の高さ（px）"
                            type="range"
                            min={15}
                            max={Math.max(15, height - 15)}
                            step={1}
                            value={Math.min(rowHeights[0], Math.max(15, height - 15))}
                            onChange={(e) =>
                                updateHeaderRowHeight(Number(e.target.value))
                            }
                            className="w-full accent-indigo-600"
                        />
                        <p className="text-[10px] text-slate-400">
                            配点行は残りの高さになります（{rowHeights[1]}px）。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. 大問ブロック フォーム (既存機能完全維持)
