"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useLayoutEffect,
} from "react";
import { QuestionBlockConfig } from "@/types/editor";
import { extractSymbolsFromText } from "@/lib/editor/symbolParser";
import { drawModalPreviewCanvas } from "@/lib/editor/questionBlockBuilder";
import { SECTION_STANDARD_WIDTH } from "@/lib/editor/paperSizes";

interface ImportTextModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (config: QuestionBlockConfig) => void;
}

export const ImportTextModal: React.FC<ImportTextModalProps> = ({
    isOpen,
    onClose,
    onApply,
}) => {
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [text, setText] = useState("");
    const [qNum, setQNum] = useState("1");
    const [qRubric, setQRubric] = useState("○・△・×");
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [detectedSymbols, setDetectedSymbols] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const symbols = extractSymbolsFromText(text);
        setDetectedSymbols(symbols);

        if (symbols.length > 0) {
            const currentCols = Number(cols) || 3;
            const neededRows = Math.ceil(symbols.length / currentCols);
            setRows(Math.max(neededRows, 1));
        }
    }, [text, cols, isOpen]);

    const getPreviewConfig = useCallback((): QuestionBlockConfig => {
        const symbolCount = detectedSymbols.length;
        return {
            num: qNum.trim() || "1",
            rubric: qRubric.trim() || "○・△・×",
            points:
                symbolCount > 0
                    ? `各問1点/${symbolCount}点`
                    : "各問1点/0点",
            pattern: "sub_parens",
            subRows: Number(rows) || 1,
            subCols: Number(cols) || 1,
            subRowHeight: 34,
            subLabels: detectedSymbols,
            gridRows: 2,
            gridCols: 4,
            gridRowHeight: 32,
            circleRows: 1,
            circleCols: 5,
            circleCount: 5,
            circleHeight: 32,
            circleCommaEnabled: false,
            circleCommaCount: 1,
            circleCommaPaddingAuto: true,
            splitRatio: "50:50",
            splitHeight: 38,
            blockWidth: SECTION_STANDARD_WIDTH,
        };
    }, [qNum, qRubric, rows, cols, detectedSymbols]);

    useLayoutEffect(() => {
        if (!isOpen || !previewCanvasRef.current) return;
        drawModalPreviewCanvas(
            previewCanvasRef.current,
            getPreviewConfig(),
        );
    }, [isOpen, getPreviewConfig]);

    if (!isOpen) return null;

    const handleApply = () => {
        if (detectedSymbols.length === 0) {
            alert("問題文から小問記号が検出されませんでした");
            return;
        }

        onApply(getPreviewConfig());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                {/* ヘッダー */}
                <div className="px-5 py-3.5 bg-purple-900 text-white flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        問題文から自動インポート
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-purple-300 hover:text-white p-1 rounded transition text-base leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* ボディ */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                        問題文を貼り付けると、文中の{" "}
                        <span className="font-mono bg-purple-50 text-purple-700 px-1 py-0.5 rounded border border-purple-200">
                            (1)
                        </span>
                        ,{" "}
                        <span className="font-mono bg-purple-50 text-purple-700 px-1 py-0.5 rounded border border-purple-200">
                            ①
                        </span>
                        ,{" "}
                        <span className="font-mono bg-purple-50 text-purple-700 px-1 py-0.5 rounded border border-purple-200">
                            (ア)
                        </span>{" "}
                        などの小問記号を自動抽出し解答枠を作成します。
                        <br />
                        <span className="text-purple-700 font-semibold">
                            ※
                            文中に同じ記号が重複して登場した場合は1回のみ検知します。
                        </span>
                    </p>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                            問題文テキスト
                        </label>
                        <textarea
                            rows={4}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="例: 中心的な装置（頭脳）は (1) である。また揮発性のメモリは (2) と呼ばれる。さらに磁気ディスク装置は (3) に分類される。"
                            className="w-full p-2.5 border border-slate-300 rounded font-sans text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    {/* 検出タグ一覧 */}
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-purple-900 flex items-center gap-1.5">
                                <span>検出された小問記号:</span>
                                <span className="bg-purple-200 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                                    {detectedSymbols.length}問
                                </span>
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                            {detectedSymbols.length === 0 ? (
                                <span className="text-slate-400 italic text-[11px]">
                                    問題文を入力すると記号がここに表示されます
                                </span>
                            ) : (
                                detectedSymbols.map((sym, i) => (
                                    <span
                                        key={i}
                                        className="bg-white border border-purple-300 text-purple-800 font-mono px-2 py-0.5 rounded text-[11px] shadow-xs font-semibold"
                                    >
                                        {sym}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 配置パラメータ */}
                    <div className="grid grid-cols-12 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                        <div className="col-span-3">
                            <label className="block text-slate-600 font-semibold mb-1">
                                大問番号
                            </label>
                            <input
                                type="text"
                                value={qNum}
                                onChange={(e) => setQNum(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white font-bold"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-slate-600 font-semibold mb-1">
                                観点区分
                            </label>
                            <input
                                type="text"
                                value={qRubric}
                                onChange={(e) => setQRubric(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-slate-600 font-semibold mb-1">
                                列数
                            </label>
                            <input
                                type="number"
                                value={cols}
                                min={1}
                                max={8}
                                onChange={(e) =>
                                    setCols(parseInt(e.target.value, 10) || 1)
                                }
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-slate-600 font-semibold mb-1">
                                行数
                            </label>
                            <input
                                type="number"
                                value={rows}
                                min={1}
                                max={10}
                                onChange={(e) =>
                                    setRows(parseInt(e.target.value, 10) || 1)
                                }
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                            />
                        </div>
                    </div>

                    {/* リアルタイムプレビュー */}
                    <div>
                        <span className="text-slate-700 font-semibold">
                            プレビュー (原寸比)
                        </span>
                        <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-inner overflow-x-auto mt-1 flex justify-center items-start min-h-[100px]">
                            {detectedSymbols.length === 0 ? (
                                <p className="text-slate-400 italic text-[11px] py-6">
                                    問題文を入力すると解答枠のプレビューが表示されます
                                </p>
                            ) : (
                                <canvas ref={previewCanvasRef} />
                            )}
                        </div>
                    </div>
                </div>

                {/* フッター */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded border border-slate-300 transition"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded shadow transition"
                    >
                        この内容で解答枠を生成
                    </button>
                </div>
            </div>
        </div>
    );
};
