"use client";

import React from "react";
import {
    SubQuestionGroup,
    SubQuestionLabelType,
    SubQuestionPattern,
} from "@/types/editor";
import {
    createSubQuestionLabels,
    SUB_QUESTION_LABEL_OPTIONS,
} from "@/lib/editor/subQuestionLabels";

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
    pattern: "sub_parens",
    subRowConfigs: [
        {
            labels: ["①", "②"],
            labelType: "circle",
        },
    ],
});

type EditableSubQuestionRow = {
    labels: string[];
    labelType: SubQuestionLabelType;
};

const getSubParensRows = (
    group: SubQuestionGroup,
): EditableSubQuestionRow[] => {
    if (group.subRowConfigs?.length) {
        return group.subRowConfigs.map((row) => ({
            labels: [...row.labels],
            labelType: row.labelType || "manual",
        }));
    }

    const rows = Math.max(1, Number(group.subRows) || 1);
    const cols = Math.max(1, Number(group.subCols) || 1);
    return Array.from({ length: rows }, (_, rowIndex) => ({
        labels: Array.from(
            { length: cols },
            (_, colIndex) =>
                group.subLabels?.[rowIndex * cols + colIndex] || "",
        ),
        labelType: "manual",
    }));
};

const rowsToUpdates = (
    rows: EditableSubQuestionRow[],
): Partial<SubQuestionGroup> => ({
    subRowConfigs: rows.map((row) => ({
        labels: row.labels,
        labelType: row.labelType,
    })),
    subRows: rows.length,
    subCols: Math.max(1, ...rows.map((row) => row.labels.length)),
    subLabels: rows.flatMap((row) => row.labels),
});

const GroupNodeEditor: React.FC<{
    group: SubQuestionGroup;
    path: number[];
    canRemove: boolean;
    onChange: (path: number[], updates: Partial<SubQuestionGroup>) => void;
    onRemove: (path: number[]) => void;
}> = ({ group, path, canRemove, onChange, onRemove }) => {
    const pattern = group.pattern || "sub_parens";
    const update = (updates: Partial<SubQuestionGroup>) =>
        onChange(path, updates);
    const rows = getSubParensRows(group);
    const updateRows = (nextRows: EditableSubQuestionRow[]) =>
        update(rowsToUpdates(nextRows));
    const updateLabelType = (
        rowIndex: number,
        labelType: SubQuestionLabelType,
    ) => {
        const nextRows = rows.map((row, index) =>
            index === rowIndex
                ? {
                      ...row,
                      labelType,
                      labels:
                          labelType === "manual"
                              ? row.labels
                              : createSubQuestionLabels(
                                    labelType,
                                    row.labels.length,
                                ),
                  }
                : row,
        );
        updateRows(nextRows);
    };
    const updateCellLabel = (
        rowIndex: number,
        colIndex: number,
        value: string,
    ) => {
        const nextRows = rows.map((row, index) => {
            if (index !== rowIndex) return row;
            const labels = [...row.labels];
            labels[colIndex] = value;
            return { ...row, labels, labelType: "manual" as const };
        });
        updateRows(nextRows);
    };
    const addColumn = (rowIndex: number) => {
        const nextRows = rows.map((row, index) =>
            index === rowIndex
                ? {
                      ...row,
                      labels:
                          row.labelType === "manual"
                              ? [...row.labels, ""]
                              : createSubQuestionLabels(
                                    row.labelType,
                                    row.labels.length + 1,
                                ),
                  }
                : row,
        );
        updateRows(nextRows);
    };
    const removeColumn = (rowIndex: number, colIndex: number) => {
        const nextRows = rows.map((row, index) => {
            if (index !== rowIndex) return row;
            if (row.labels.length <= 1) return row;
            const labels = row.labels.filter(
                (_, columnIndex) => columnIndex !== colIndex,
            );
            return {
                ...row,
                labels:
                    row.labelType === "manual"
                        ? labels
                        : createSubQuestionLabels(row.labelType, labels.length),
            };
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
                                    onClick={() =>
                                        updateRows([
                                            ...rows,
                                            {
                                                labels: [""],
                                                labelType: "manual",
                                            },
                                        ])
                                    }
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
                                            <select
                                                aria-label={`小問${group.label} ${rowIndex + 1}行目のラベル形式`}
                                                value={row.labelType}
                                                onChange={(e) =>
                                                    updateLabelType(
                                                        rowIndex,
                                                        e.target
                                                            .value as SubQuestionLabelType,
                                                    )
                                                }
                                                className="px-1.5 py-0.5 text-[10px] border border-slate-300 rounded bg-white"
                                            >
                                                {SUB_QUESTION_LABEL_OPTIONS.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
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
                                        {row.labels.map((label, colIndex) => (
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
                                                {row.labels.length > 1 && (
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

                    {pattern === "sub_parens" && (
                        <div className="space-y-1 text-[10px] text-slate-600">
                            <label className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={group.subCommaEnabled ?? false}
                                    onChange={(e) =>
                                        update({
                                            subCommaEnabled: e.target.checked,
                                        })
                                    }
                                />
                                「,」で区切る
                            </label>
                            <label className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={group.subCommaPaddingAuto ?? true}
                                    disabled={!group.subCommaEnabled}
                                    onChange={(e) =>
                                        update({
                                            subCommaPaddingAuto: e.target.checked,
                                        })
                                    }
                                />
                                位置を自動調整
                            </label>
                            <label className="flex items-center gap-1">
                                カンマ位置（%）
                                <input
                                    type="number"
                                    min={5}
                                    max={95}
                                    value={Math.round(
                                        ((group.subCommaPaddingAuto ?? true)
                                            ? 0.45
                                            : (group.subCommaPaddingRatio ??
                                              0.45)) * 100,
                                    )}
                                    disabled={
                                        !group.subCommaEnabled ||
                                        (group.subCommaPaddingAuto ?? true)
                                    }
                                    onChange={(e) =>
                                        update({
                                            subCommaPaddingAuto: false,
                                            subCommaPaddingRatio: Math.min(
                                                0.95,
                                                Math.max(
                                                    0.05,
                                                    (Number(e.target.value) ||
                                                        5) / 100,
                                                ),
                                            ),
                                        })
                                    }
                                    className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center disabled:bg-slate-100"
                                />
                            </label>
                        </div>
                    )}

                    {pattern === "essay" && (
                        <div className="space-y-1.5 text-[10px] text-slate-600">
                            <label className="flex items-center gap-1">
                                表示方式
                                <select
                                    aria-label={`小問${group.label}記述欄表示方式`}
                                    value={group.essayLayout ?? "line"}
                                    onChange={(e) =>
                                        update({
                                            essayLayout: e.target.value as
                                                | "line"
                                                | "grid",
                                        })
                                    }
                                    className="px-1.5 py-0.5 border border-slate-300 rounded bg-white"
                                >
                                    <option value="line">通常記述欄</option>
                                    <option value="grid">マス目方式</option>
                                </select>
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                <label className="flex items-center gap-1">
                                    行数
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={group.essayRows ?? 1}
                                        onChange={(e) =>
                                            update({
                                                essayRows: Math.max(
                                                    1,
                                                    Number(e.target.value) || 1,
                                                ),
                                            })
                                        }
                                        className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center"
                                    />
                                </label>
                                {(group.essayLayout ?? "line") === "grid" && (
                                    <>
                                        <label className="flex items-center gap-1">
                                            列数
                                            <input
                                                type="number"
                                                min={1}
                                                max={50}
                                                value={group.essayCols ?? 1}
                                                onChange={(e) => {
                                                    const cols = Math.max(
                                                        1,
                                                        Number(
                                                            e.target.value,
                                                        ) || 1,
                                                    );
                                                    update({
                                                        essayCols: cols,
                                                        essayCellCount: Math.min(
                                                            group.essayCellCount ??
                                                                1,
                                                            (group.essayRows ??
                                                                1) * cols,
                                                        ),
                                                    });
                                                }}
                                                className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center"
                                            />
                                        </label>
                                        <label className="flex items-center gap-1">
                                            マス数
                                            <input
                                                type="number"
                                                min={1}
                                                max={2500}
                                                value={Math.min(
                                                    group.essayCellCount ??
                                                        1,
                                                    (group.essayRows ?? 1) *
                                                        (group.essayCols ?? 1),
                                                )}
                                                onChange={(e) =>
                                                    update({
                                                        essayCellCount: Math.min(
                                                            (group.essayRows ??
                                                                1) *
                                                                (group.essayCols ??
                                                                    1),
                                                            Math.max(
                                                                1,
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ) || 1,
                                                            ),
                                                        ),
                                                    })
                                                }
                                                className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center"
                                            />
                                        </label>
                                        <label className="flex items-center gap-1">
                                            列幅
                                            <input
                                                type="number"
                                                min={1}
                                                max={1000}
                                                placeholder="自動"
                                                value={
                                                    group.essayColumnWidth ??
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    update({
                                                        essayColumnWidth:
                                                            e.target.value
                                                                ? Math.max(
                                                                      1,
                                                                      Number(
                                                                          e
                                                                              .target
                                                                              .value,
                                                                      ) || 1,
                                                                  )
                                                                : undefined,
                                                    })
                                                }
                                                className="w-16 px-1 py-0.5 border border-slate-300 rounded text-center"
                                            />
                                            px
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
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
