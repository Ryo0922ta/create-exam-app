"use client";

import React, { useState } from "react";
import { LabelType, PaperSize, ShortAnswerOptions } from "@/types/editor";
import { PAPER_SIZES } from "@/lib/editor/paperSizes";

interface EditorToolbarProps {
    paperSize: PaperSize;
    onPaperSizeChange: (size: PaperSize) => void;
    onAddShortAnswer: (options: ShortAnswerOptions) => void;
    onAddEssay: (lines: number) => void;
    onAddCharGrid: (chars: number) => void;
    onAddTitle: () => void;
    onAddHeader: () => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onClear: () => void;
    onRestoreSample: () => void;
    onExportPdf: () => void;
    isExportingPdf: boolean;
    selectedInfo: string | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    paperSize,
    onPaperSizeChange,
    onAddShortAnswer,
    onAddEssay,
    onAddCharGrid,
    onAddTitle,
    onAddHeader,
    onBringToFront,
    onSendToBack,
    onDuplicate,
    onDelete,
    onClear,
    onRestoreSample,
    onExportPdf,
    isExportingPdf,
    selectedInfo,
}) => {
    // 短答用ローカルステート
    const [qNo, setQNo] = useState("1");
    const [subNo, setSubNo] = useState("(1)");
    const [shortRows, setShortRows] = useState(3);
    const [shortCols, setShortCols] = useState(4);
    const [labelType, setLabelType] = useState<LabelType>("alpha");

    // 記述用
    const [essayLines, setEssayLines] = useState(2);

    // マス目用
    const [gridChars, setGridChars] = useState(20);

    const handleAddShortAnswer = () => {
        onAddShortAnswer({
            qNo,
            subNo,
            rows: Number(shortRows) || 3,
            cols: Number(shortCols) || 4,
            labelType,
        });
    };

    const handleAddEssay = () => {
        onAddEssay(Number(essayLines) || 2);
    };

    const handleAddCharGrid = () => {
        onAddCharGrid(Number(gridChars) || 20);
    };

    return (
        <div className="flex flex-col gap-2 bg-slate-100 border-b border-slate-300 p-3 shadow-sm select-none">
            {/* 上段：主要アクションバー */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* 用紙サイズ設定 */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm">
                    <label
                        htmlFor="paper-size-select"
                        className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                    >
                        <svg
                            className="w-4 h-4 text-slate-500"
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
                        用紙サイズ:
                    </label>
                    <select
                        id="paper-size-select"
                        value={paperSize}
                        onChange={(e) =>
                            onPaperSizeChange(e.target.value as PaperSize)
                        }
                        className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="A4">{PAPER_SIZES.A4.label}</option>
                        <option value="B4">{PAPER_SIZES.B4.label}</option>
                    </select>
                </div>

                {/* キャンバス管理＆PDF出力 */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onRestoreSample}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white rounded shadow-sm transition"
                        title="見本レイアウトを読み込む"
                    >
                        サンプル復元
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-red-600/90 text-white rounded shadow-sm transition"
                        title="キャンバスを空にする"
                    >
                        全消去
                    </button>
                    <div className="h-5 w-px bg-slate-300 mx-1"></div>
                    <button
                        type="button"
                        onClick={onExportPdf}
                        disabled={isExportingPdf}
                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded shadow flex items-center gap-1.5 transition"
                    >
                        {isExportingPdf ? (
                            <>
                                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                                出力中...
                            </>
                        ) : (
                            <>
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
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                {paperSize} PDF出力
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 下段：パーツ追加ブロック ＆ 選択オブジェクト操作 */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200">
                {/* 短答作成ブロック */}
                <div className="flex items-center bg-white p-1 rounded-lg border border-slate-300 shadow-sm gap-2">
                    <button
                        type="button"
                        onClick={handleAddShortAnswer}
                        className="px-2.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded transition shadow-sm flex items-center gap-1"
                    >
                        <span>+ 短答欄</span>
                    </button>
                    <div className="flex items-center text-xs text-slate-600 gap-1 pl-1">
                        <span>大問:</span>
                        <input
                            type="text"
                            value={qNo}
                            onChange={(e) => setQNo(e.target.value)}
                            className="w-8 border border-slate-300 rounded px-1 text-center py-0.5 font-bold"
                        />
                        <span>小問:</span>
                        <input
                            type="text"
                            value={subNo}
                            onChange={(e) => setSubNo(e.target.value)}
                            className="w-10 border border-slate-300 rounded px-1 text-center py-0.5"
                        />
                        <span>行:</span>
                        <input
                            type="number"
                            value={shortRows}
                            min="1"
                            max="10"
                            onChange={(e) =>
                                setShortRows(parseInt(e.target.value, 10) || 1)
                            }
                            className="w-10 border border-slate-300 rounded px-1 text-center py-0.5"
                        />
                        <span>列:</span>
                        <input
                            type="number"
                            value={shortCols}
                            min="1"
                            max="8"
                            onChange={(e) =>
                                setShortCols(parseInt(e.target.value, 10) || 1)
                            }
                            className="w-10 border border-slate-300 rounded px-1 text-center py-0.5"
                        />
                        <span>記号:</span>
                        <select
                            value={labelType}
                            onChange={(e) =>
                                setLabelType(e.target.value as LabelType)
                            }
                            className="border border-slate-300 rounded text-xs py-0.5 px-1 bg-white"
                        >
                            <option value="alpha">a, b, c...</option>
                            <option value="num">1, 2, 3...</option>
                            <option value="kata">ア, イ, ウ...</option>
                            <option value="kanji">一, 二, 三...</option>
                            <option value="none">なし</option>
                        </select>
                    </div>
                </div>

                {/* 記述・マス目作成ブロック */}
                <div className="flex items-center bg-white p-1 rounded-lg border border-slate-300 shadow-sm gap-2">
                    <button
                        type="button"
                        onClick={handleAddEssay}
                        className="px-2.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition shadow-sm"
                    >
                        + 記述欄
                    </button>
                    <div className="flex items-center text-xs text-slate-600 gap-1 pl-1">
                        <span>行数:</span>
                        <input
                            type="number"
                            value={essayLines}
                            min="1"
                            max="10"
                            onChange={(e) =>
                                setEssayLines(parseInt(e.target.value, 10) || 1)
                            }
                            className="w-10 border border-slate-300 rounded px-1 text-center py-0.5"
                        />
                    </div>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <button
                        type="button"
                        onClick={handleAddCharGrid}
                        className="px-2.5 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded transition shadow-sm"
                    >
                        + マス目
                    </button>
                    <div className="flex items-center text-xs text-slate-600 gap-1 pl-1">
                        <input
                            type="number"
                            value={gridChars}
                            min="5"
                            max="100"
                            onChange={(e) =>
                                setGridChars(parseInt(e.target.value, 10) || 10)
                            }
                            className="w-12 border border-slate-300 rounded px-1 text-center py-0.5"
                        />
                        <span>字</span>
                    </div>
                </div>

                {/* 定番パーツ追加 */}
                <div className="flex items-center bg-white p-1 rounded-lg border border-slate-300 shadow-sm gap-1.5">
                    <button
                        type="button"
                        onClick={onAddTitle}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition"
                    >
                        + タイトル
                    </button>
                    <button
                        type="button"
                        onClick={onAddHeader}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition"
                    >
                        + 年組氏名・得点欄
                    </button>
                </div>

                {/* 選択オブジェクト用操作バー */}
                <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-slate-500 hidden xl:inline">
                        {selectedInfo ? (
                            <span className="text-blue-600 font-semibold">
                                選択中: {selectedInfo}
                            </span>
                        ) : (
                            "未選択"
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={onBringToFront}
                        className="p-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 shadow-sm text-xs"
                        title="前面へ"
                    >
                        ▲
                    </button>
                    <button
                        type="button"
                        onClick={onSendToBack}
                        className="p-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 shadow-sm text-xs"
                        title="背面へ"
                    >
                        ▼
                    </button>
                    <button
                        type="button"
                        onClick={onDuplicate}
                        className="px-2 py-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 shadow-sm text-xs font-semibold"
                        title="複製"
                    >
                        複製
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="px-2 py-1.5 text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 shadow-sm text-xs font-bold"
                        title="削除"
                    >
                        削除
                    </button>
                </div>
            </div>
        </div>
    );
};
