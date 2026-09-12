"use client";

import React from "react";
import {
    SubQuestionGroup,
    SubQuestionPattern,
} from "@/types/editor";

interface GroupedQuestionEditorProps {
    groups: SubQuestionGroup[];
    onChange: (groups: SubQuestionGroup[]) => void;
    title?: string;
}

const updateAtPath = (
    groups: SubQuestionGroup[],
    path: number[],
    updater: (group: SubQuestionGroup) => SubQuestionGroup,
): SubQuestionGroup[] =>
    groups.map((group, index) => {
        if (index !== path[0]) return group;
        return updater(group);
    });

const createLeaf = (label: string): SubQuestionGroup => ({
    label,
    height: 42,
    pattern: "essay",
});

const getSubParensRows = (group: SubQuestionGroup): string[][] => {
    if (group.subRowConfigs?.length) {
        return group.subRowConfigs.map((row) => [...row.labels]);
    }

    const rows = Math.max(1, Number(group.subRows) || 1);
    const cols = Math.max(1, Number(group.subCols) || 1);
    return Array.from({ length: rows }, (_, rowIndex) =>
        Array.from(
            { length: cols },
            (_, colIndex) =>
                group.subLabels?.[rowIndex * cols + colIndex] || "",
        ),
    );
};

const rowsToUpdates = (rows: string[][]): Partial<SubQuestionGroup> => ({
    subRowConfigs: rows.map((labels) => ({ labels })),
    subRows: rows.length,
    subCols: Math.max(1, ...rows.map((labels) => labels.length)),
    subLabels: rows.flat(),
});

const GroupNodeEditor: React.FC<{
    group: SubQuestionGroup;
    path: number[];
    canRemove: boolean;
    onChange: (path: number[], updates: Partial<SubQuestionGroup>) => void;
    onRemove: (path: number[]) => void;
}> = ({ group, path, canRemove, onChange, onRemove }) => {
    const pattern = group.pattern || "essay";
    const update = (updates: Partial<SubQuestionGroup>) =>
        onChange(path, updates);
    const rows = getSubParensRows(group);
    const updateRows = (nextRows: string[][]) => update(rowsToUpdates(nextRows));
    const updateCellLabel = (
        rowIndex: number,
        colIndex: number,
        value: string,
    ) => {
        const nextRows = rows.map((row, index) => {
            if (index !== rowIndex) return row;
            const nextRow = [...row];
            nextRow[colIndex] = value;
            return nextRow;
        });
        updateRows(nextRows);
    };
    const addColumn = (rowIndex: number) => {
        const nextRows = rows.map((row, index) =>
            index === rowIndex ? [...row, ""] : row,
        );
        updateRows(nextRows);
    };
    const removeColumn = (rowIndex: number, colIndex: number) => {
        const nextRows = rows.map((row, index) => {
            if (index !== rowIndex) return row;
            if (row.length <= 1) return row;
            return row.filter((_, columnIndex) => columnIndex !== colIndex);
        });
        updateRows(nextRows);
    };

    return (
        <div
            className={`rounded-lg border p-2.5 space-y-2 ${
                "border-slate-200 bg-white"
            }`}
        >
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500">
                    小問
                </span>
                <input
                    type="text"
                    aria-label="小問番号"
                    value={group.label}
                    onChange={(e) => update({ label: e.target.value })}
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
                            update({ height: Number(e.target.value) || 24 })
                        }
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-center bg-white disabled:bg-slate-100"
                    />
                    px
                </label>
                {canRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(path)}
                        className="ml-auto px-1.5 py-1 text-[10px] text-red-600 hover:bg-red-50 rounded"
                    >
                        削除
                    </button>
                )}
            </div>

            <>
                    <select
                        aria-label="小問の解答枠パターン"
                        value={pattern}
                        onChange={(e) =>
                            update({
                                pattern: e.target.value as SubQuestionPattern,
                            })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
                    >
                        <option value="sub_parens">小問複合枠</option>
                        <option value="grid">等分割グリッド</option>
                        <option value="circle_comma">丸数字区分</option>
                        <option value="split_2">左右2分割</option>
                        <option value="essay">記述欄</option>
                    </select>

                    {pattern === "sub_parens" && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500">
                                    行ごとのラベル・列数
                                </span>
                                <button
                                    type="button"
                                    onClick={() => updateRows([...rows, [""]])}
                                    className="px-1.5 py-0.5 text-[10px] text-indigo-700 border border-indigo-200 rounded"
                                >
                                    ＋行
                                </button>
                            </div>
                            {rows.map((row, rowIndex) => (
                                <div
                                    key={`sub-row-${rowIndex}`}
                                    className="rounded border border-slate-200 bg-slate-50 p-2 space-y-1.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-slate-500">
                                            {rowIndex + 1}行
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addColumn(rowIndex)
                                                }
                                                className="px-1.5 py-0.5 text-[10px] text-indigo-700 border border-indigo-200 rounded bg-white"
                                            >
                                                ＋列
                                            </button>
                                            {rows.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateRows(
                                                            rows.filter(
                                                                (_, index) =>
                                                                    index !==
                                                                    rowIndex,
                                                            ),
                                                        )
                                                    }
                                                    className="px-1.5 py-0.5 text-[10px] text-red-600 border border-red-200 rounded bg-white"
                                                >
                                                    行削除
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {row.map((label, colIndex) => (
                                            <div
                                                key={`sub-col-${rowIndex}-${colIndex}`}
                                                className="flex items-center gap-0.5"
                                            >
                                                <input
                                                    type="text"
                                                    aria-label={`小問${group.label} ${rowIndex + 1}行 ${colIndex + 1}列のラベル`}
                                                    value={label}
                                                    onChange={(e) =>
                                                        updateCellLabel(
                                                            rowIndex,
                                                            colIndex,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-16 px-1.5 py-1 border border-slate-300 rounded text-center font-mono bg-white"
                                                    placeholder="(a)"
                                                />
                                                {row.length > 1 && (
                                                    <button
                                                        type="button"
                                                        aria-label={`${rowIndex + 1}行 ${colIndex + 1}列を削除`}
                                                        onClick={() =>
                                                            removeColumn(
                                                                rowIndex,
                                                                colIndex,
                                                            )
                                                        }
                                                        className="px-1 py-0.5 text-[10px] text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {pattern === "grid" && (
                        <div className="grid grid-cols-2 gap-1.5">
                            <input
                                type="number"
                                min={1}
                                value={group.gridRows || 1}
                                onChange={(e) =>
                                    update({
                                        gridRows: Number(e.target.value) || 1,
                                    })
                                }
                                className="px-1.5 py-1 border border-slate-300 rounded text-center"
                                placeholder="行数"
                            />
                            <input
                                type="number"
                                min={1}
                                value={group.gridCols || 1}
                                onChange={(e) =>
                                    update({
                                        gridCols: Number(e.target.value) || 1,
                                    })
                                }
                                className="px-1.5 py-1 border border-slate-300 rounded text-center"
                                placeholder="列数"
                            />
                        </div>
                    )}

                    {pattern === "circle_comma" && (
                        <label className="flex items-center gap-1 text-[10px] text-slate-600">
                            <input
                                type="checkbox"
                                checked={group.circleCommaEnabled ?? false}
                                onChange={(e) =>
                                    update({
                                        circleCommaEnabled: e.target.checked,
                                    })
                                }
                            />
                            「,」で区切る
                        </label>
                    )}

                    {pattern === "split_2" && (
                        <select
                            value={group.splitRatio || "50:50"}
                            onChange={(e) =>
                                update({ splitRatio: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                            <option value="50:50">50 : 50</option>
                            <option value="30:70">30 : 70</option>
                            <option value="70:30">70 : 30</option>
                        </select>
                    )}

                    {group.unclassifiedLabels?.length ? (
                        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-800">
                            未分類ラベル:{" "}
                            {group.unclassifiedLabels.join(", ")}
                        </div>
                    ) : null}
            </>
        </div>
    );
};

export const GroupedQuestionEditor: React.FC<
    GroupedQuestionEditorProps
> = ({ groups, onChange, title = "小問グループの設定" }) => {
    const handleChange = (
        path: number[],
        updates: Partial<SubQuestionGroup>,
    ) => {
        onChange(updateAtPath(groups, path, (group) => ({ ...group, ...updates })));
    };

    const handleAddGroup = () =>
        onChange([...groups, createLeaf(String(groups.length + 1))]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-700">{title}</div>
                <button
                    type="button"
                    onClick={handleAddGroup}
                    className="px-2 py-1 text-[10px] font-semibold text-indigo-700 border border-indigo-200 rounded bg-white hover:bg-indigo-50"
                >
                    ＋小問を追加
                </button>
            </div>
            {groups.map((group, index) => (
                <GroupNodeEditor
                    key={`root-group-${index}`}
                    group={group}
                    path={[index]}
                    canRemove={groups.length > 1}
                    onChange={handleChange}
                    onRemove={(path) =>
                        onChange(groups.filter((_, groupIndex) => groupIndex !== path[0]))
                    }
                />
            ))}
        </div>
    );
};
