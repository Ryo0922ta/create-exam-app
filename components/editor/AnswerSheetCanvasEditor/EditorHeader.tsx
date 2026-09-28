"use client";

import Link from "next/link";

export interface EditorHeaderProps {
    onOpenBatchReplace: () => void;
    onClear: () => void;
    onExportPdfB4: () => void;
    onExportPdfSplit: () => void;
    onExportWord: () => void;
    isExporting: boolean;
    isPdfDropdownOpen: boolean;
    onTogglePdfDropdown: () => void;
}

export function EditorHeader({
    onOpenBatchReplace,
    onClear,
    onExportPdfB4,
    onExportPdfSplit,
    onExportWord,
    isExporting,
    isPdfDropdownOpen,
    onTogglePdfDropdown,
}: EditorHeaderProps) {
    return (
        <header className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0 select-none">
            <div className="flex items-center gap-3">
                <Link
                    href="/"
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded transition border border-slate-700 flex items-center gap-1"
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
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    CSVプレビュー
                </Link>

                <div className="h-4 w-px bg-slate-700" />

                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-xs">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-sm font-bold tracking-wide flex items-center gap-2">
                        <span>定期考査 解答用紙エディタ</span>
                        <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-normal">
                            B4横 (364×257mm)
                        </span>
                    </h1>
                </div>
            </div>

            <div className="flex flex-1 items-center gap-3 min-w-0 justify-end">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onOpenBatchReplace}
                        className="px-1 py-1 text-xs font-medium text-slate-400 hover:text-white transition"
                    >
                        観点記号の一括置換
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        className="px-1 py-1 text-[11px] text-slate-500 hover:text-red-300 transition"
                    >
                        白紙に戻す
                    </button>
                </div>

                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-500">出力</span>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={onTogglePdfDropdown}
                            disabled={isExporting}
                            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded text-white shadow-xs transition flex items-center gap-1.5"
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
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                            <span>PDFに保存</span>
                            <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        {isPdfDropdownOpen && (
                            <div className="absolute right-0 mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    type="button"
                                    onClick={onExportPdfB4}
                                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-slate-800 font-medium flex items-center justify-between"
                                >
                                    <span>B4横 (原寸1枚) PDF</span>
                                    <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                                        推奨
                                    </span>
                                </button>
                                <div className="border-t border-slate-200 my-0.5" />
                                <button
                                    type="button"
                                    onClick={onExportPdfSplit}
                                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-slate-800 font-medium"
                                >
                                    A4分割 (左面・右面2ページ) PDF
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onExportWord}
                        disabled={isExporting}
                        className="px-3.5 py-1.5 text-xs font-semibold border border-blue-400 text-blue-100 hover:bg-blue-900/50 disabled:opacity-50 rounded transition flex items-center gap-1.5"
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a2 2 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <span>Word形式 (.docx) で保存</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
