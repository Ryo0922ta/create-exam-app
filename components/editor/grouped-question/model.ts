import type {
    SubQuestionGroup,
    SubQuestionLabelType,
} from "@/types/editor";
import { createSubQuestionLabels } from "@/lib/editor/subQuestionLabels";
import type { EditableSubQuestionRow } from "../types";

export const updateGroupAtIndex = (
    groups: SubQuestionGroup[],
    index: number,
    updates: Partial<SubQuestionGroup>,
): SubQuestionGroup[] =>
    groups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, ...updates } : group,
    );

export const createLeafGroup = (label: string): SubQuestionGroup => ({
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

export const getEditableSubQuestionRows = (
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

export const rowsToGroupUpdates = (
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

export const addSubQuestionRow = (
    rows: EditableSubQuestionRow[],
): EditableSubQuestionRow[] => [
    ...rows,
    { labels: [""], labelType: "manual" },
];

export const removeSubQuestionRow = (
    rows: EditableSubQuestionRow[],
    rowIndex: number,
): EditableSubQuestionRow[] =>
    rows.filter((_, index) => index !== rowIndex);

export const updateSubQuestionLabelType = (
    rows: EditableSubQuestionRow[],
    rowIndex: number,
    labelType: SubQuestionLabelType,
): EditableSubQuestionRow[] =>
    rows.map((row, index) =>
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

export const updateSubQuestionCellLabel = (
    rows: EditableSubQuestionRow[],
    rowIndex: number,
    colIndex: number,
    value: string,
): EditableSubQuestionRow[] =>
    rows.map((row, index) => {
        if (index !== rowIndex) return row;
        const labels = [...row.labels];
        labels[colIndex] = value;
        return { ...row, labels, labelType: "manual" as const };
    });

export const addSubQuestionColumn = (
    rows: EditableSubQuestionRow[],
    rowIndex: number,
): EditableSubQuestionRow[] =>
    rows.map((row, index) =>
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

export const removeSubQuestionColumn = (
    rows: EditableSubQuestionRow[],
    rowIndex: number,
    colIndex: number,
): EditableSubQuestionRow[] =>
    rows.map((row, index) => {
        if (index !== rowIndex || row.labels.length <= 1) return row;
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
