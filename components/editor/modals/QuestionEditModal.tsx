"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useLayoutEffect,
} from "react";
import {
    QuestionBlockConfig,
    QuestionPattern,
    SubQuestionGroup,
    SubQuestionPattern,
} from "@/types/editor";
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
import { GroupedQuestionEditor } from "@/components/editor/GroupedQuestionEditor";

interface QuestionEditModalProps {
    isOpen: boolean;
    initialConfig?: QuestionBlockConfig | null;
    onClose: () => void;
    onApply: (config: QuestionBlockConfig) => void;
}

const createDefaultGroupedGroups = (): SubQuestionGroup[] => [
    {
        label: "1",
        height: 42,
        pattern: "sub_parens",
        subRowConfigs: [
            {
                labels: ["①", "②"],
                labelType: "circle",
            },
        ],
    },
];

const normalizeModalGroup = (
    group: SubQuestionGroup,
    index: number,
): SubQuestionGroup => {
    if (group.pattern) return group;
    const cells = group.cells?.length
        ? group.cells
        : [{ label: "", widthRatio: 1, type: "box" as const }];
    return {
        ...group,
        pattern: "sub_parens",
        subRows: 1,
        subCols: cells.length,
        subLabels: cells.map((cell) => cell.label),
        label: group.label || String(index + 1),
    };
};

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
    const [pattern] = useState<QuestionPattern>("grouped");

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
    const [circleCommaPaddingRatio, setCircleCommaPaddingRatio] =
        useState(0.451);

    // 2分割
    const [splitRatio, setSplitRatio] = useState("50:50");
    const [splitHeight, setSplitHeight] = useState(38);
    const [groups, setGroups] = useState<SubQuestionGroup[]>(
        createDefaultGroupedGroups,
    );
    const [blockWidth, setBlockWidth] = useState(SECTION_STANDARD_WIDTH);

    // 初期化
    useEffect(() => {
        if (!isOpen) return;

        if (initialConfig) {
            setNum(initialConfig.num || "1");
            setRubric(initialConfig.rubric || "");
            setPoints(initialConfig.points || "");
            setSubRows(initialConfig.subRows || 2);
            setSubCols(initialConfig.subCols || 3);
            setSubRowHeight(initialConfig.subRowHeight || 34);
            setSubLabelsText((initialConfig.subLabels || []).join(", "));
            setGridRows(initialConfig.gridRows || 2);
            setGridCols(initialConfig.gridCols || 4);
            setGridRowHeight(initialConfig.gridRowHeight || 32);
            setCircleRows(initialConfig.circleRows ?? 1);
            setCircleCols(
                initialConfig.circleCols ?? initialConfig.circleCount ?? 5,
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
            setGroups(
                initialConfig.groups?.length
                    ? initialConfig.groups.map((group, index) =>
                          normalizeModalGroup(
                              JSON.parse(JSON.stringify(group)),
                              index,
                          ),
                      )
                    : createDefaultGroupedGroups(),
            );
            setBlockWidth(initialConfig.blockWidth ?? SECTION_STANDARD_WIDTH);
        } else {
            setNum("1");
            setRubric("○・△・×");
            setPoints("各問1点/10点");
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
            setCircleCommaPaddingRatio(getDefaultCircleCommaPaddingRatio(5));
            setSplitRatio("50:50");
            setSplitHeight(38);
            setGroups(createDefaultGroupedGroups());
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
            circleCount: (Number(circleRows) || 1) * (Number(circleCols) || 1),
            circleHeight: Number(circleHeight) || 32,
            circleCommaEnabled,
            circleCommaCount: 1,
            circleCommaPaddingAuto,
            circleCommaPaddingRatio,
            splitRatio,
            splitHeight: Number(splitHeight) || 38,
            groups: groups.map((group) => ({
                label: group.label.trim(),
                height: Math.max(24, Number(group.height) || 42),
                pattern: group.pattern || "sub_parens",
                subRows: Math.max(1, Number(group.subRows) || 1),
                subCols: Math.max(1, Number(group.subCols) || 1),
                subLabels: group.subLabels || [],
                subRowConfigs: group.subRowConfigs?.map((row) => ({
                    labels: row.labels.map((label) => label.trim()),
                    labelType: row.labelType,
                })),
                gridRows: Math.max(1, Number(group.gridRows) || 1),
                gridCols: Math.max(1, Number(group.gridCols) || 1),
                circleRows: Math.max(1, Number(group.circleRows) || 1),
                circleCols: Math.max(1, Number(group.circleCols) || 1),
                circleCommaEnabled: group.circleCommaEnabled ?? false,
                circleCommaPaddingAuto: group.circleCommaPaddingAuto ?? true,
                circleCommaPaddingRatio:
                    group.circleCommaPaddingRatio ??
                    getDefaultCircleCommaPaddingRatio(group.circleCols || 1),
                subCommaEnabled: group.subCommaEnabled ?? false,
                subCommaPaddingAuto: group.subCommaPaddingAuto ?? true,
                subCommaPaddingRatio: group.subCommaPaddingRatio ?? 0.45,
                essayLayout: group.essayLayout ?? "line",
                essayRows: Math.max(1, Number(group.essayRows) || 1),
                essayCols: Math.max(1, Number(group.essayCols) || 1),
                essayCellCount: Math.max(
                    1,
                    Math.min(
                        Math.max(1, Number(group.essayCellCount) || 1),
                        Math.max(1, Number(group.essayRows) || 1) *
                            Math.max(1, Number(group.essayCols) || 1),
                    ),
                ),
                essayColumnWidth:
                    group.essayColumnWidth &&
                    group.essayColumnWidth > 0
                        ? group.essayColumnWidth
                        : undefined,
                splitRatio: group.splitRatio || "50:50",
                cells: (group.cells || []).map((cell) => ({
                    label: cell.label.trim(),
                    widthRatio: Math.max(0.01, Number(cell.widthRatio) || 1),
                    type: cell.type,
                })),
            })),
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
        groups,
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

    const updateGroup = (
        groupIndex: number,
        updates: Partial<SubQuestionGroup>,
    ) => {
        setGroups((current) =>
            current.map((group, index) =>
                index === groupIndex ? { ...group, ...updates } : group,
            ),
        );
    };

    const addGroupedGroup = () => {
        setGroups((current) => [
            ...current,
            {
                label: String(current.length + 1),
                height: 42,
                pattern: "sub_parens",
                subRowConfigs: [
                    {
                        labels: ["①", "②"],
                        labelType: "circle",
                    },
                ],
            },
        ]);
    };

    const removeGroupedGroup = (groupIndex: number) => {
        setGroups((current) =>
            current.length <= 1
                ? current
                : current.filter((_, index) => index !== groupIndex),
        );
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

                        {false && pattern === "grouped" && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-slate-700">
                                            小問グループの設定
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            行ごとに高さ・解答欄・ラベルを設定できます。
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addGroupedGroup}
                                        className="px-2 py-1 text-[10px] font-semibold text-indigo-700 border border-indigo-200 rounded bg-white hover:bg-indigo-50"
                                    >
                                        ＋小問を追加
                                    </button>
                                </div>

                                {groups.map((group, groupIndex) => (
                                    <div
                                        key={`group-${groupIndex}`}
                                        className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500">
                                                小問 {groupIndex + 1}
                                            </span>
                                            <input
                                                type="text"
                                                aria-label={`小問${groupIndex + 1}の番号`}
                                                value={group.label}
                                                onChange={(e) =>
                                                    updateGroup(groupIndex, {
                                                        label: e.target.value,
                                                    })
                                                }
                                                className="w-16 px-2 py-1 border border-slate-300 rounded text-center bg-white"
                                            />
                                            <label className="flex items-center gap-1 text-[10px] text-slate-600">
                                                高さ
                                                <input
                                                    type="number"
                                                    min={24}
                                                    max={240}
                                                    value={group.height}
                                                    onChange={(e) =>
                                                        updateGroup(
                                                            groupIndex,
                                                            {
                                                                height:
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ) || 24,
                                                            },
                                                        )
                                                    }
                                                    className="w-16 px-2 py-1 border border-slate-300 rounded text-center bg-white"
                                                />
                                                px
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeGroupedGroup(
                                                        groupIndex,
                                                    )
                                                }
                                                disabled={groups.length <= 1}
                                                className="ml-auto px-1.5 py-1 text-[10px] text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                                            >
                                                削除
                                            </button>
                                        </div>

                                        <select
                                            aria-label={`小問${groupIndex + 1}パターン`}
                                            value={
                                                group.pattern || "sub_parens"
                                            }
                                            onChange={(e) =>
                                                updateGroup(groupIndex, {
                                                    pattern: e.target
                                                        .value as SubQuestionPattern,
                                                })
                                            }
                                            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
                                        >
                                            <option value="sub_parens">
                                                小問複合枠
                                            </option>
                                            <option value="essay">
                                                記述欄
                                            </option>
                                        </select>

                                        {group.pattern === "sub_parens" && (
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    aria-label={`小問${groupIndex + 1}行数`}
                                                    value={group.subRows || 1}
                                                    onChange={(e) =>
                                                        updateGroup(
                                                            groupIndex,
                                                            {
                                                                subRows:
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                            },
                                                        )
                                                    }
                                                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-center"
                                                    placeholder="行数"
                                                />
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={12}
                                                    aria-label={`小問${groupIndex + 1}列数`}
                                                    value={group.subCols || 1}
                                                    onChange={(e) =>
                                                        updateGroup(
                                                            groupIndex,
                                                            {
                                                                subCols:
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                            },
                                                        )
                                                    }
                                                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-center"
                                                    placeholder="列数"
                                                />
                                                <input
                                                    type="text"
                                                    aria-label={`小問${groupIndex + 1}ラベル`}
                                                    value={(
                                                        group.subLabels || []
                                                    ).join(", ")}
                                                    onChange={(e) =>
                                                        updateGroup(
                                                            groupIndex,
                                                            {
                                                                subLabels:
                                                                    e.target.value
                                                                        .split(
                                                                            ",",
                                                                        )
                                                                        .map(
                                                                            (
                                                                                value,
                                                                            ) =>
                                                                                value.trim(),
                                                                        )
                                                                        .filter(
                                                                            Boolean,
                                                                        ),
                                                            },
                                                        )
                                                    }
                                                    className="col-span-1 w-full px-1.5 py-1 border border-slate-300 rounded font-mono"
                                                    placeholder="(a), (b)"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {pattern === "grouped" && (
                        <GroupedQuestionEditor
                            groups={groups}
                            onChange={setGroups}
                            title="小問グループの設定"
                        />
                    )}

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
