"use client";

import { SUB_QUESTION_LABEL_OPTIONS } from "@/lib/editor/subQuestionLabels";
import type { SubQuestionLabelType } from "@/types/editor";
import type { SubParensEditorProps } from "../types";
import {
    addSubQuestionColumn,
    addSubQuestionRow,
    removeSubQuestionColumn,
    removeSubQuestionRow,
    rowsToGroupUpdates,
    updateSubQuestionCellLabel,
    updateSubQuestionLabelType,
} from "./model";

export const SubParensEditor = ({
    group,
    rows,
    onChange,
}: SubParensEditorProps) => {
    const updateRows = (nextRows: typeof rows) =>
        onChange(rowsToGroupUpdates(nextRows));

    return (
        <>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                        行ごとのラベル・列数
                    </span>
                    <button
                        type="button"
                        onClick={() => updateRows(addSubQuestionRow(rows))}
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
                                        updateRows(
                                            updateSubQuestionLabelType(
                                                rows,
                                                rowIndex,
                                                e.target
                                                    .value as SubQuestionLabelType,
                                            ),
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
                                        updateRows(
                                            addSubQuestionColumn(
                                                rows,
                                                rowIndex,
                                            ),
                                        )
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
                                                removeSubQuestionRow(
                                                    rows,
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
                                            updateRows(
                                                updateSubQuestionCellLabel(
                                                    rows,
                                                    rowIndex,
                                                    colIndex,
                                                    e.target.value,
                                                ),
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
                                                updateRows(
                                                    removeSubQuestionColumn(
                                                        rows,
                                                        rowIndex,
                                                        colIndex,
                                                    ),
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

            <div className="space-y-1 text-[10px] text-slate-600">
                <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={group.subCommaEnabled ?? false}
                        onChange={(e) =>
                            onChange({ subCommaEnabled: e.target.checked })
                        }
                    />
                    「,」で区切る
                </label>
                <label className="flex items-center gap-1">
                    カンマ数
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={Math.max(
                            1,
                            Number(group.subCommaCount) || 1,
                        )}
                        disabled={!group.subCommaEnabled}
                        onChange={(e) =>
                            onChange({
                                subCommaCount: Math.min(
                                    20,
                                    Math.max(
                                        1,
                                        Number(e.target.value) || 1,
                                    ),
                                ),
                            })
                        }
                        className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center disabled:bg-slate-100"
                    />
                </label>
                <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={group.subCommaPaddingAuto ?? true}
                        disabled={!group.subCommaEnabled}
                        onChange={(e) =>
                            onChange({
                                subCommaPaddingAuto: e.target.checked,
                            })
                        }
                    />
                    位置を自動調整
                </label>
                {Math.max(1, Number(group.subCommaCount) || 1) === 1 ? (
                    <label className="flex items-center gap-1">
                        カンマ位置（%）
                        <input
                            type="number"
                            min={5}
                            max={95}
                            value={Math.round(
                                ((group.subCommaPaddingAuto ?? true)
                                    ? 0.45
                                    : (group.subCommaPaddingRatio ?? 0.45)) *
                                    100,
                            )}
                            disabled={
                                !group.subCommaEnabled ||
                                (group.subCommaPaddingAuto ?? true)
                            }
                            onChange={(e) =>
                                onChange({
                                    subCommaPaddingAuto: false,
                                    subCommaPaddingRatio: Math.min(
                                        0.95,
                                        Math.max(
                                            0.05,
                                            (Number(e.target.value) || 5) /
                                                100,
                                        ),
                                    ),
                                })
                            }
                            className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center disabled:bg-slate-100"
                        />
                    </label>
                ) : (
                    <span className="text-slate-500">
                        カンマはセル全体に等間隔で配置
                    </span>
                )}
            </div>
        </>
    );
};
