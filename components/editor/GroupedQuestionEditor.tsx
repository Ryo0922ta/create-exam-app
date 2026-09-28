"use client";

import type { SubQuestionGroup } from "@/types/editor";
import { GroupNodeEditor } from "./grouped-question/GroupNodeEditor";
import {
    createLeafGroup,
    updateGroupAtIndex,
} from "./grouped-question/model";
import type { GroupedQuestionEditorProps } from "./types";

export const GroupedQuestionEditor = ({
    data,
    options,
}: GroupedQuestionEditorProps) => {
    const { groups, onChange } = data;
    const title = options?.title ?? "小問グループの設定";

    const handleChange = (
        index: number,
        updates: Partial<SubQuestionGroup>,
    ) => {
        onChange(updateGroupAtIndex(groups, index, updates));
    };

    const handleAddGroup = () =>
        onChange([...groups, createLeafGroup(String(groups.length + 1))]);

    const handleRemoveGroup = (index: number) =>
        onChange(groups.filter((_, groupIndex) => groupIndex !== index));

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
                    index={index}
                    canRemove={groups.length > 1}
                    onChange={handleChange}
                    onRemove={handleRemoveGroup}
                />
            ))}
        </div>
    );
};
