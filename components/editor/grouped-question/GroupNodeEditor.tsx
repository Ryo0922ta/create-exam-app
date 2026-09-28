"use client";

import type { SubQuestionPattern } from "@/types/editor";
import type { GroupNodeEditorProps } from "../types";
import { EssayEditor } from "./EssayEditor";
import { getEditableSubQuestionRows } from "./model";
import { SubParensEditor } from "./SubParensEditor";

export const GroupNodeEditor = ({
    group,
    index,
    canRemove,
    onChange,
    onRemove,
}: GroupNodeEditorProps) => {
    const pattern = group.pattern || "sub_parens";
    const update = (
        updates: Parameters<GroupNodeEditorProps["onChange"]>[1],
    ) => onChange(index, updates);
    const rows = getEditableSubQuestionRows(group);

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
                        onClick={() => onRemove(index)}
                        className="ml-auto px-1.5 py-1 text-[10px] text-red-600 hover:bg-red-50 rounded"
                    >
                        削除
                    </button>
                )}
            </div>

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
                <SubParensEditor
                    group={group}
                    rows={rows}
                    onChange={update}
                />
            )}

            {pattern === "essay" && (
                <EssayEditor group={group} onChange={update} />
            )}

            {group.unclassifiedLabels?.length ? (
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-800">
                    未分類ラベル: {group.unclassifiedLabels.join(", ")}
                </div>
            ) : null}
        </div>
    );
};
