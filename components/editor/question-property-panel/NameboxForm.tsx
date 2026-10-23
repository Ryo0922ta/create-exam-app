"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { NameboxConfig } from "@/types/editor";
import { DEFAULT_NAMEBOX_CONFIG, type CustomNameboxGroup } from "@/lib/editor/basicPartBuilder";
import type { NameboxFormProps } from "./types";

export const NameboxForm = ({
    block,
    onUpdate,
    onClose,
}: NameboxFormProps) => {
    const config = block.nameboxConfig || DEFAULT_NAMEBOX_CONFIG;

    const [labels, setLabels] = useState<[string, string, string, string]>([
        config.labels?.[0] ?? "○年",
        config.labels?.[1] ?? "組",
        config.labels?.[2] ?? "番",
        config.labels?.[3] ?? "氏名",
    ]);
    const [width, setWidth] = useState(config.width || 300);
    const [height, setHeight] = useState(config.height || 40);
    const [columnWidths, setColumnWidths] = useState<[number, number, number]>(
        config.columnWidths || [40, 40, 40],
    );

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
        setColumnWidths(c.columnWidths || [40, 40, 40]);
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
                columnWidths:
                    overrides.columnWidths !== undefined
                        ? overrides.columnWidths
                        : columnWidths,
            };
        },
        [labels, width, height, columnWidths],
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

    const updateColumnWidth = (index: number, value: number) => {
        const next = [...columnWidths] as [number, number, number];
        next[index] = value;
        setColumnWidths(next);
        triggerImmediateUpdate({ columnWidths: next });
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

                {/* 各セルの幅 */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                    <div className="font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
                        セル幅設定
                    </div>
                    {(["年", "組", "番"] as const).map((label, index) => (
                        <div key={label}>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-slate-600 font-medium">
                                    {label}欄
                                </label>
                                <span className="text-slate-700 font-semibold tabular-nums">
                                    {columnWidths[index]}px
                                </span>
                            </div>
                            <input
                                aria-label={`年組氏名欄 ${label}欄の幅（px）`}
                                type="range"
                                min={20}
                                max={120}
                                step={1}
                                value={columnWidths[index]}
                                onChange={(e) =>
                                    updateColumnWidth(index, Number(e.target.value))
                                }
                                className="w-full accent-indigo-600"
                            />
                        </div>
                    ))}
                    <p className="text-[10px] text-slate-400">
                        氏名欄は枠全体の幅から自動計算されます。
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
