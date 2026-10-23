"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ExamHeaderConfig } from "@/types/editor";
import { DEFAULT_EXAM_HEADER_CONFIG, type CustomExamHeaderGroup } from "@/lib/editor/basicPartBuilder";
import type { ExamHeaderFormProps } from "./types";

export const ExamHeaderForm = ({
    block,
    onUpdate,
    onClose,
}: ExamHeaderFormProps) => {
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
