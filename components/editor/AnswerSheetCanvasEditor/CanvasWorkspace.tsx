"use client";

import type { CSSProperties, RefObject } from "react";
import type { MarginGuideLines } from "@/lib/editor/marginGuides";

export interface CanvasWorkspaceProps {
    containerRef: RefObject<HTMLDivElement | null>;
    fabricHostRef: RefObject<HTMLDivElement | null>;
    canvasWidth: number;
    canvasHeight: number;
    gridHostStyle?: CSSProperties;
    isGridVisible: boolean;
    isMarginGuidesVisible: boolean;
    marginGuideLines: MarginGuideLines;
    hasQuestionBlock: boolean;
    onOpenQuestionModal: () => void;
    onClosePdfDropdown: () => void;
}

export function CanvasWorkspace({
    containerRef,
    fabricHostRef,
    canvasWidth,
    canvasHeight,
    gridHostStyle,
    isGridVisible,
    isMarginGuidesVisible,
    marginGuideLines,
    hasQuestionBlock,
    onOpenQuestionModal,
    onClosePdfDropdown,
}: CanvasWorkspaceProps) {
    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-auto bg-slate-200 p-6 flex items-start justify-center relative"
            onClick={onClosePdfDropdown}
        >
            <div
                className="relative inline-block transition-all"
                style={{
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                }}
            >
                <div
                    ref={fabricHostRef}
                    className={`fabric-canvas-host canvas-shadow rounded-none ${isGridVisible ? "grid-active" : "bg-white"}`}
                    style={gridHostStyle}
                />

                <div
                    className="absolute top-0 bottom-0 left-1/2 w-0 border-r-2 border-dashed border-indigo-400/70 pointer-events-none z-10"
                    style={{ transform: "translateX(-1px)" }}
                />

                {isMarginGuidesVisible && (
                    <>
                        {[
                            marginGuideLines.outerLeft,
                            marginGuideLines.foldLeft,
                            marginGuideLines.foldRight,
                            marginGuideLines.outerRight,
                        ].map((left, index) => (
                            <div
                                key={`margin-v-${index}`}
                                className="absolute top-0 bottom-0 w-0 border-r border-dashed border-amber-400/70 pointer-events-none z-10"
                                style={{ left: `${(left / canvasWidth) * 100}%` }}
                            />
                        ))}
                        <div
                            className="absolute left-0 right-0 h-0 border-t border-dashed border-amber-400/70 pointer-events-none z-10"
                            style={{
                                top: `${(marginGuideLines.top / canvasHeight) * 100}%`,
                            }}
                        />
                        <div
                            className="absolute left-0 right-0 h-0 border-t border-dashed border-amber-400/70 pointer-events-none z-10"
                            style={{
                                top: `${(marginGuideLines.bottom / canvasHeight) * 100}%`,
                            }}
                        />
                    </>
                )}

                {!hasQuestionBlock && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto max-w-sm rounded-xl border border-indigo-200 bg-white/95 p-5 text-center shadow-lg">
                            <p className="text-sm font-bold text-slate-800">
                                解答用紙を作成しましょう
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                大問を追加して配置を整えたら、PDFまたはWordで保存できます。
                            </p>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                                {[
                                    ["1", "大問を作成"],
                                    ["2", "配置・調整"],
                                    ["3", "保存"],
                                ].map(([step, label]) => (
                                    <div
                                        key={step}
                                        className="rounded border border-slate-200 bg-slate-50 p-2"
                                    >
                                        <span className="block text-sm font-bold text-indigo-600">
                                            {step}
                                        </span>
                                        {label}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={onOpenQuestionModal}
                                className="mt-4 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
                            >
                                大問を作成・追加
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
