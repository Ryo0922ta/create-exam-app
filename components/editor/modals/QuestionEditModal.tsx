"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useLayoutEffect,
} from "react";
import { QuestionBlockConfig, QuestionPattern } from "@/types/editor";
import {
    drawModalPreviewCanvas,
    getDefaultCircleCommaPaddingRatio,
} from "@/lib/editor/questionBlockBuilder";
import {
    SECTION_STANDARD_WIDTH,
    QUESTION_BLOCK_WIDTH_LIMITS,
    clampQuestionBlockWidth,
} from "@/lib/editor/paperSizes";
import { PAPER_SIZES, B4_LANDSCAPE_MM } from "@/lib/editor/paperSizes";

interface QuestionEditModalProps {
    isOpen: boolean;
    initialConfig?: QuestionBlockConfig | null;
    onClose: () => void;
    onApply: (config: QuestionBlockConfig) => void;
}

export const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
    isOpen,
    initialConfig,
    onClose,
    onApply,
}) => {
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [num, setNum] = useState("1");
    const [rubric, setRubric] = useState("○・△・×");
    const [points, setPoints] = useState("各問1点/10点");
    const [pattern, setPattern] = useState<QuestionPattern>("sub_parens");

    // 小問複合枠
    const [subRows, setSubRows] = useState(2);
    const [subCols, setSubCols] = useState(3);
    const [subRowHeight, setSubRowHeight] = useState(34);
    const [subLabelsText, setSubLabelsText] = useState(
        "(1), (2), (3), (4), (5)",
    );

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
    const [circleCommaPaddingRatio, setCircleCommaPaddingRatio] = useState(0.451);

    // 2分割
    const [splitRatio, setSplitRatio] = useState("50:50");
    const [splitHeight, setSplitHeight] = useState(38);
    const [blockWidth, setBlockWidth] = useState(SECTION_STANDARD_WIDTH);

    // 初期化
    useEffect(() => {
        if (!isOpen) return;

        if (initialConfig) {
            setNum(initialConfig.num || "1");
            setRubric(initialConfig.rubric || "");
            setPoints(initialConfig.points || "");
            setPattern(initialConfig.pattern || "sub_parens");
            setSubRows(initialConfig.subRows || 2);
            setSubCols(initialConfig.subCols || 3);
            setSubRowHeight(initialConfig.subRowHeight || 34);
            setSubLabelsText((initialConfig.subLabels || []).join(", "));
            setGridRows(initialConfig.gridRows || 2);
            setGridCols(initialConfig.gridCols || 4);
            setGridRowHeight(initialConfig.gridRowHeight || 32);
            setCircleRows(initialConfig.circleRows ?? 1);
            setCircleCols(
                initialConfig.circleCols ??
                    initialConfig.circleCount ??
                    5,
            );
            setCircleHeight(initialConfig.circleHeight || 32);
            setCircleCommaEnabled(initialConfig.circleCommaEnabled ?? false);
            setCircleCommaPaddingAuto(
                initialConfig.circleCommaPaddingAuto ?? true,
            );
            setCircleCommaPaddingRatio(
                initialConfig.circleCommaPaddingRatio ??
                    getDefaultCircleCommaPaddingRatio(
                        initialConfig.circleCols ??
                            initialConfig.circleCount ??
                            5,
                    ),
            );
            setSplitRatio(initialConfig.splitRatio || "50:50");
            setSplitHeight(initialConfig.splitHeight || 38);
            setBlockWidth(
                initialConfig.blockWidth ?? SECTION_STANDARD_WIDTH,
            );
        } else {
            setNum("1");
            setRubric("○・△・×");
            setPoints("各問1点/10点");
            setPattern("sub_parens");
            setSubRows(2);
            setSubCols(3);
            setSubRowHeight(34);
            setSubLabelsText("(1), (2), (3), (4), (5)");
            setGridRows(2);
            setGridCols(4);
            setGridRowHeight(32);
            setCircleRows(1);
            setCircleCols(5);
            setCircleHeight(32);
            setCircleCommaEnabled(false);
            setCircleCommaPaddingAuto(true);
            setCircleCommaPaddingRatio(
                getDefaultCircleCommaPaddingRatio(5),
            );
            setSplitRatio("50:50");
            setSplitHeight(38);
            setBlockWidth(SECTION_STANDARD_WIDTH);
        }
    }, [isOpen, initialConfig]);

    useEffect(() => {
        if (circleRows * circleCols <= 1) {
            setCircleCommaEnabled(false);
        }
    }, [circleRows, circleCols]);

    const getCurrentConfig = useCallback((): QuestionBlockConfig => {
        const labels = subLabelsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        return {
            num: num.trim() || "1",
            rubric: rubric.trim(),
            points: points.trim(),
            pattern,
            subRows: Number(subRows) || 1,
            subCols: Number(subCols) || 1,
            subRowHeight: Number(subRowHeight) || 34,
            subLabels: labels,
            gridRows: Number(gridRows) || 1,
            gridCols: Number(gridCols) || 1,
            gridRowHeight: Number(gridRowHeight) || 32,
            circleRows: Number(circleRows) || 1,
            circleCols: Number(circleCols) || 1,
            circleCount:
                (Number(circleRows) || 1) * (Number(circleCols) || 1),
            circleHeight: Number(circleHeight) || 32,
            circleCommaEnabled,
            circleCommaCount: 1,
            circleCommaPaddingAuto,
            circleCommaPaddingRatio,
            splitRatio,
            splitHeight: Number(splitHeight) || 38,
            blockWidth: clampQuestionBlockWidth(
                Number(blockWidth) || SECTION_STANDARD_WIDTH,
            ),
        };
    }, [
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
        blockWidth,
    ]);

    // プレビュー再描画
    useLayoutEffect(() => {
        if (!isOpen || !previewCanvasRef.current) return;
        drawModalPreviewCanvas(previewCanvasRef.current, getCurrentConfig());
    }, [isOpen, getCurrentConfig]);

    if (!isOpen) return null;

    const handleAutoFillSub = () => {
        const rows = Number(subRows) || 1;
        const cols = Number(subCols) || 1;
        const count = rows * cols;
        const labels = Array.from(
            { length: count },
            (_, i) => `(${i + 1})`,
        ).join(", ");
        setSubLabelsText(labels);
    };

    const handleApply = () => {
        const cfg = getCurrentConfig();
        onApply(cfg);
        onClose();
    };

    const blockWidthMm = Math.round(
        (Number(blockWidth) / PAPER_SIZES.B4_LANDSCAPE.widthPx) *
            B4_LANDSCAPE_MM.width,
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                {/* ヘッダー */}
                <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        {initialConfig
                            ? `大問 ${initialConfig.num} の編集`
                            : "大問ブロックの作成・追加"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded transition text-base leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* フォームボディ */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                    {/* 基本情報 */}
                    <div className="grid grid-cols-12 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                        <div className="col-span-3">
                            <label className="block text-slate-600 font-semibold mb-1">
                                大問番号
                            </label>
                            <input
                                type="text"
                                aria-label="大問番号"
                                value={num}
                                onChange={(e) => setNum(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-center bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="col-span-4">
                            <label className="block text-slate-600 font-semibold mb-1">
                                観点区分
                            </label>
                            <input
                                type="text"
                                aria-label="観点区分"
                                value={rubric}
                                placeholder="例: ○・△・×, 知識・技能"
                                onChange={(e) => setRubric(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="col-span-5">
                            <label className="block text-slate-600 font-semibold mb-1">
                                配点注記
                            </label>
                            <input
                                type="text"
                                aria-label="配点注記"
                                value={points}
                                placeholder="例: 各問1点/10点"
                                onChange={(e) => setPoints(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-slate-700 font-semibold">
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
                                    onChange={(e) =>
                                        setBlockWidth(Number(e.target.value))
                                    }
                                    onBlur={() =>
                                        setBlockWidth(
                                            clampQuestionBlockWidth(blockWidth),
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setBlockWidth(
                                                clampQuestionBlockWidth(
                                                    blockWidth,
                                                ),
                                            );
                                        }
                                    }}
                                    className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right tabular-nums bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                            onChange={(e) =>
                                setBlockWidth(
                                    clampQuestionBlockWidth(
                                        Number(e.target.value),
                                    ),
                                )
                            }
                            className="w-full accent-indigo-600"
                        />
                    </div>

                    {/* パターン選択 */}
                    <div>
                        <label className="block text-slate-700 font-semibold mb-1.5">
                            解答枠パターン
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <label
                                className={`border rounded-lg p-2.5 flex flex-col items-center text-center cursor-pointer transition ${
                                    pattern === "sub_parens"
                                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs"
                                        : "border-slate-300 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <input
                                    type="radio"
                                    aria-label="小問複合枠"
                                    name="q-pattern"
                                    value="sub_parens"
                                    checked={pattern === "sub_parens"}
                                    onChange={() => setPattern("sub_parens")}
                                    className="mb-1 text-indigo-600"
                                />
                                <span>(1)(2) 小問複合枠</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                    行×列 & ラベル
                                </span>
                                <span className="text-[10px] leading-tight text-indigo-600 mt-0.5">
                                    用途例：選択式・小問が複数
                                </span>
                            </label>

                            <label
                                className={`border rounded-lg p-2.5 flex flex-col items-center text-center cursor-pointer transition ${
                                    pattern === "grid"
                                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs"
                                        : "border-slate-300 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <input
                                    type="radio"
                                    aria-label="等分割グリッド"
                                    name="q-pattern"
                                    value="grid"
                                    checked={pattern === "grid"}
                                    onChange={() => setPattern("grid")}
                                    className="mb-1 text-indigo-600"
                                />
                                <span>等分割グリッド</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                    シンプルなマス目
                                </span>
                                <span className="text-[10px] leading-tight text-indigo-600 mt-0.5">
                                    用途例：選択式・均等な解答欄
                                </span>
                            </label>

                            <label
                                className={`border rounded-lg p-2.5 flex flex-col items-center text-center cursor-pointer transition ${
                                    pattern === "circle_comma"
                                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs"
                                        : "border-slate-300 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <input
                                    type="radio"
                                    aria-label="丸数字区分"
                                    name="q-pattern"
                                    value="circle_comma"
                                    checked={pattern === "circle_comma"}
                                    onChange={() => setPattern("circle_comma")}
                                    className="mb-1 text-indigo-600"
                                />
                                <span>丸数字区分</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                    ① , ② , ③...
                                </span>
                                <span className="text-[10px] leading-tight text-indigo-600 mt-0.5">
                                    用途例：番号付きの記号解答
                                </span>
                            </label>

                            <label
                                className={`border rounded-lg p-2.5 flex flex-col items-center text-center cursor-pointer transition ${
                                    pattern === "split_2"
                                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs"
                                        : "border-slate-300 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <input
                                    type="radio"
                                    aria-label="左右2分割枠"
                                    name="q-pattern"
                                    value="split_2"
                                    checked={pattern === "split_2"}
                                    onChange={() => setPattern("split_2")}
                                    className="mb-1 text-indigo-600"
                                />
                                <span>左右2分割枠</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                    記述・長文向け
                                </span>
                                <span className="text-[10px] leading-tight text-indigo-600 mt-0.5">
                                    用途例：記述・長文回答
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* パターン別詳細設定 */}
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                        {pattern === "sub_parens" && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-slate-600 font-semibold mb-1">
                                            行数
                                        </label>
                                        <input
                                            type="number"
                                            aria-label="小問複合枠の行数"
                                            value={subRows}
                                            min={1}
                                            max={10}
                                            onChange={(e) =>
                                                setSubRows(
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 1,
                                                )
                                            }
                                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 font-semibold mb-1">
                                            列数
                                        </label>
                                        <input
                                            type="number"
                                            aria-label="小問複合枠の列数"
                                            value={subCols}
                                            min={1}
                                            max={8}
                                            onChange={(e) =>
                                                setSubCols(
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 1,
                                                )
                                            }
                                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 font-semibold mb-1">
                                            1行の高さ (px)
                                        </label>
                                        <input
                                            type="number"
                                            aria-label="小問複合枠の1行の高さ（px）"
                                            value={subRowHeight}
                                            min={20}
                                            max={80}
                                            onChange={(e) =>
                                                setSubRowHeight(
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 20,
                                                )
                                            }
                                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-slate-600 font-semibold">
                                            小問記号 (カンマ区切り)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAutoFillSub}
                                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                                        >
                                            マス数分 (1)〜(N) を自動生成
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        aria-label="小問記号（カンマ区切り）"
                                        value={subLabelsText}
                                        onChange={(e) =>
                                            setSubLabelsText(e.target.value)
                                        }
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        ※
                                        問題数が総マス数より少ない場合、余ったマスは自動的に空欄枠になります。
                                    </p>
                                </div>
                            </div>
                        )}

                        {pattern === "grid" && (
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">
                                        行数
                                    </label>
                                    <input
                                        type="number"
                                        aria-label="グリッド枠の行数"
                                        value={gridRows}
                                        min={1}
                                        max={10}
                                        onChange={(e) =>
                                            setGridRows(
                                                parseInt(e.target.value, 10) ||
                                                    1,
                                            )
                                        }
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">
                                        列数
                                    </label>
                                    <input
                                        type="number"
                                        aria-label="グリッド枠の列数"
                                        value={gridCols}
                                        min={1}
                                        max={10}
                                        onChange={(e) =>
                                            setGridCols(
                                                parseInt(e.target.value, 10) ||
                                                    1,
                                            )
                                        }
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">
                                        1行の高さ
                                    </label>
                                    <input
                                        type="number"
                                        aria-label="グリッド枠の1行の高さ（px）"
                                        value={gridRowHeight}
                                        min={20}
                                        max={80}
                                        onChange={(e) =>
                                            setGridRowHeight(
                                                parseInt(e.target.value, 10) ||
                                                    20,
                                            )
                                        }
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        {pattern === "circle_comma" && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-slate-600 font-semibold mb-1">
                                            行数
                                        </label>
                                        <input
                                            type="number"
                                            aria-label="丸数字枠の行数"
                                            value={circleRows}
                                            min={1}
                                            max={10}
                                            onChange={(e) =>
                                                setCircleRows(
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 1,
                                                )
                                            }
                                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 font-semibold mb-1">
                                            列数
                                        </label>
                                        <input
                                            type="number"
                                            aria-label="丸数字枠の列数"
                                            value={circleCols}
                                            min={1}
                                            max={15}
                                            onChange={(e) =>
                                                setCircleCols(
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 1,
                                                )
                                            }
                                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 font-semibold mb-1">
                                            1行の高さ
                                        </label>
                                        <input
                                            type="number"
                                            aria-label="丸数字枠の1行の高さ（px）"
                                            value={circleHeight}
                                            min={20}
                                            max={80}
                                            onChange={(e) =>
                                                setCircleHeight(
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 20,
                                                )
                                            }
                                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                                    <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            aria-label="カンマ区切りを有効にする"
                                            checked={circleCommaEnabled}
                                            disabled={
                                                circleRows * circleCols <= 1
                                            }
                                            onChange={(e) =>
                                                setCircleCommaEnabled(
                                                    e.target.checked,
                                                )
                                            }
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>「,」で区切る</span>
                                    </label>
                                    {circleCommaEnabled &&
                                        circleRows * circleCols > 1 && (
                                        <>
                                            <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    aria-label="カンマ位置を自動調整"
                                                    checked={
                                                        circleCommaPaddingAuto
                                                    }
                                                    onChange={(e) => {
                                                        const auto =
                                                            e.target.checked;
                                                        setCircleCommaPaddingAuto(
                                                            auto,
                                                        );
                                                        if (!auto) {
                                                            setCircleCommaPaddingRatio(
                                                                getDefaultCircleCommaPaddingRatio(
                                                                    circleCols,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span>位置を自動調整</span>
                                            </label>
                                            <div>
                                                <label className="block text-slate-600 font-semibold mb-1">
                                                    カンマ位置（セル幅に対する比率
                                                    %）
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        aria-label="カンマ位置（%）"
                                                        value={Math.round(
                                                            (circleCommaPaddingAuto
                                                                ? getDefaultCircleCommaPaddingRatio(
                                                                      circleCols,
                                                                  )
                                                                : circleCommaPaddingRatio) *
                                                                100,
                                                        )}
                                                        min={5}
                                                        max={95}
                                                        disabled={
                                                            circleCommaPaddingAuto
                                                        }
                                                        onChange={(e) => {
                                                            const pct =
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                    10,
                                                                ) || 5;
                                                            const clamped =
                                                                Math.min(
                                                                    95,
                                                                    Math.max(
                                                                        5,
                                                                        pct,
                                                                    ),
                                                                );
                                                            setCircleCommaPaddingAuto(
                                                                false,
                                                            );
                                                            setCircleCommaPaddingRatio(
                                                                clamped / 100,
                                                            );
                                                        }}
                                                        className="w-full max-w-[120px] px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                    {circleCommaPaddingAuto && (
                                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                                            （自動）
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {pattern === "split_2" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">
                                        分割比率
                                    </label>
                                    <select
                                        aria-label="左右2分割の分割比率"
                                        value={splitRatio}
                                        onChange={(e) =>
                                            setSplitRatio(e.target.value)
                                        }
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                                    >
                                        <option value="50:50">
                                            50% : 50% (均等)
                                        </option>
                                        <option value="30:70">
                                            30% : 70% (左狭め)
                                        </option>
                                        <option value="70:30">
                                            70% : 30% (右狭め)
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">
                                        枠の高さ
                                    </label>
                                    <input
                                        type="number"
                                        aria-label="左右2分割枠の高さ（px）"
                                        value={splitHeight}
                                        min={25}
                                        max={120}
                                        onChange={(e) =>
                                            setSplitHeight(
                                                parseInt(e.target.value, 10) ||
                                                    25,
                                            )
                                        }
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-center bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* リアルタイムプレビュー */}
                    <div>
                        <span className="text-slate-700 font-semibold">
                            プレビュー (原寸比)
                        </span>
                        <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-inner overflow-x-auto mt-1 flex justify-center items-start min-h-[100px]">
                            <canvas ref={previewCanvasRef} />
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
                        className="px-5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow transition flex items-center gap-1"
                    >
                        {initialConfig ? "変更を用紙に反映" : "用紙に配置する"}
                    </button>
                </div>
            </div>
        </div>
    );
};
