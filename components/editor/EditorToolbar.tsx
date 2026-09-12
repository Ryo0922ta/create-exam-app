"use client";

import React from "react";
import { MARGIN_LIMITS, PaperMargins } from "@/types/editor";

interface EditorToolbarProps {
    onOpenQuestionModal: () => void;
    onOpenImportModal: () => void;
    onAddHeader: () => void;
    onAddNamebox: () => void;
    onAddScoretable: () => void;
    onClone: () => void;
    onDelete: () => void;
    hasEditableSelection: boolean;
    isPropertyPanelOpen: boolean;
    onTogglePropertyPanel: () => void;
    isGridVisible: boolean;
    onToggleGrid: (visible: boolean) => void;
    isSnapEnabled: boolean;
    onToggleSnap: (enabled: boolean) => void;
    isAlignmentGuidesEnabled: boolean;
    onToggleAlignmentGuides: (enabled: boolean) => void;
    isMarginGuidesVisible: boolean;
    onToggleMarginGuides: (visible: boolean) => void;
    paperMargins: PaperMargins;
    onPaperMarginsChange: (margins: PaperMargins) => void;
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomFit: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    onOpenQuestionModal,
    onOpenImportModal,
    onAddHeader,
    onAddNamebox,
    onAddScoretable,
    onClone,
    onDelete,
    hasEditableSelection,
    isPropertyPanelOpen,
    onTogglePropertyPanel,
    isGridVisible,
    onToggleGrid,
    isSnapEnabled,
    onToggleSnap,
    isAlignmentGuidesEnabled,
    onToggleAlignmentGuides,
    isMarginGuidesVisible,
    onToggleMarginGuides,
    paperMargins,
    onPaperMarginsChange,
    zoomLevel,
    onZoomIn,
    onZoomOut,
    onZoomFit,
}) => {
    const [isViewOptionsOpen, setIsViewOptionsOpen] = React.useState(false);
    const [isMarginOptionsOpen, setIsMarginOptionsOpen] = React.useState(false);

    return (
        <div className="bg-white border-b border-slate-200 z-20 flex-shrink-0 shadow-xs select-none">
            {/* 1段目：作成・操作 + 表示設定トグル */}
            <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onOpenQuestionModal}
                        className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-xs flex items-center gap-1.5 transition"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        <span>大問を作成・追加</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenImportModal}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center gap-1.5 transition"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                        </svg>
                        <span>問題文から自動インポート</span>
                    </button>

                    <div className="h-5 w-px bg-slate-300 mx-1"></div>

                    <span className="text-[11px] font-semibold text-slate-500">
                        基本パーツ:
                    </span>
                    <button
                        type="button"
                        onClick={onAddHeader}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition flex items-center gap-1"
                    >
                        <span>+ 考査見出し枠</span>
                    </button>
                    <button
                        type="button"
                        onClick={onAddNamebox}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition flex items-center gap-1"
                    >
                        <span>+ 年組氏名欄</span>
                    </button>
                    <button
                        type="button"
                        onClick={onAddScoretable}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition flex items-center gap-1"
                    >
                        <span>+ 観点別得点枠</span>
                    </button>

                    <div className="h-5 w-px bg-slate-300 mx-1"></div>

                    <button
                        type="button"
                        onClick={onTogglePropertyPanel}
                        disabled={!hasEditableSelection}
                        className={`px-2.5 py-1 text-xs rounded border font-medium transition flex items-center gap-1 ${
                            isPropertyPanelOpen
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        }`}
                        title="選択中の枠のプロパティを編集"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                        <span>プロパティ</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClone}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition font-medium"
                        title="選択中の枠を複製"
                    >
                        複製
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-red-50 text-red-600 hover:border-red-300 rounded border border-slate-300 transition font-medium"
                        title="選択中の枠を削除 (Deleteキー)"
                    >
                        削除
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setIsViewOptionsOpen((open) => !open)}
                    aria-expanded={isViewOptionsOpen}
                    className={`shrink-0 px-2.5 py-1.5 text-xs rounded border font-medium transition ${
                        isViewOptionsOpen
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                            : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                    }`}
                >
                    表示設定
                </button>
            </div>

            {/* 2段目：表示設定（開いたときのみ） */}
            {isViewOptionsOpen && (
                <div className="px-4 py-2 border-t border-slate-200 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                        <input
                            type="checkbox"
                            checked={isGridVisible}
                            onChange={(e) => onToggleGrid(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>方眼グリッド</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                        <input
                            type="checkbox"
                            checked={isSnapEnabled}
                            onChange={(e) => onToggleSnap(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>吸着(スナップ)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                        <input
                            type="checkbox"
                            checked={isAlignmentGuidesEnabled}
                            onChange={(e) =>
                                onToggleAlignmentGuides(e.target.checked)
                            }
                            className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>配置ガイド</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                        <input
                            type="checkbox"
                            checked={isMarginGuidesVisible}
                            onChange={(e) =>
                                onToggleMarginGuides(e.target.checked)
                            }
                            className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>余白ガイド</span>
                    </label>

                    <button
                        type="button"
                        onClick={() => setIsMarginOptionsOpen((open) => !open)}
                        aria-expanded={isMarginOptionsOpen}
                        className={`px-2 py-1 text-xs rounded border font-medium transition ${
                            isMarginOptionsOpen
                                ? "bg-amber-50 border-amber-300 text-amber-800"
                                : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                        }`}
                    >
                        余白設定
                    </button>

                    {isMarginOptionsOpen && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <label className="flex items-center gap-1 font-medium whitespace-nowrap">
                            <span>上下</span>
                            <input
                                type="range"
                                min={MARGIN_LIMITS.vertical.min}
                                max={MARGIN_LIMITS.vertical.max}
                                step={1}
                                value={paperMargins.verticalMm}
                                disabled={!isMarginGuidesVisible}
                                onChange={(e) =>
                                    onPaperMarginsChange({
                                        ...paperMargins,
                                        verticalMm: Number(e.target.value),
                                    })
                                }
                                className="w-16 accent-amber-600 disabled:opacity-40"
                            />
                            <span className="w-9 text-right tabular-nums">
                                {paperMargins.verticalMm}mm
                            </span>
                        </label>
                        <label className="flex items-center gap-1 font-medium whitespace-nowrap">
                            <span>外側</span>
                            <input
                                type="range"
                                min={MARGIN_LIMITS.outerHorizontal.min}
                                max={MARGIN_LIMITS.outerHorizontal.max}
                                step={1}
                                value={paperMargins.outerHorizontalMm}
                                disabled={!isMarginGuidesVisible}
                                onChange={(e) =>
                                    onPaperMarginsChange({
                                        ...paperMargins,
                                        outerHorizontalMm: Number(e.target.value),
                                    })
                                }
                                className="w-16 accent-amber-600 disabled:opacity-40"
                            />
                            <span className="w-9 text-right tabular-nums">
                                {paperMargins.outerHorizontalMm}mm
                            </span>
                        </label>
                        <label className="flex items-center gap-1 font-medium whitespace-nowrap">
                            <span>折り目</span>
                            <input
                                type="range"
                                min={MARGIN_LIMITS.foldHorizontal.min}
                                max={MARGIN_LIMITS.foldHorizontal.max}
                                step={1}
                                value={paperMargins.foldHorizontalMm}
                                disabled={!isMarginGuidesVisible}
                                onChange={(e) =>
                                    onPaperMarginsChange({
                                        ...paperMargins,
                                        foldHorizontalMm: Number(e.target.value),
                                    })
                                }
                                className="w-16 accent-amber-600 disabled:opacity-40"
                            />
                            <span className="w-9 text-right tabular-nums">
                                {paperMargins.foldHorizontalMm}mm
                            </span>
                        </label>
                    </div>
                    )}

                    <div className="h-5 w-px bg-slate-300"></div>

                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-300">
                        <button
                            type="button"
                            onClick={onZoomOut}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded transition text-xs font-bold"
                            title="縮小"
                        >
                            -
                        </button>
                        <span className="text-[11px] font-semibold text-slate-700 px-1 w-12 text-center">
                            {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                            type="button"
                            onClick={onZoomIn}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded transition text-xs font-bold"
                            title="拡大"
                        >
                            +
                        </button>
                        <button
                            type="button"
                            onClick={onZoomFit}
                            className="px-2 h-6 flex items-center justify-center text-[11px] font-medium text-slate-700 hover:bg-white rounded transition"
                            title="全体を表示"
                        >
                            画面に合わせる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
