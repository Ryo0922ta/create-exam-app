import type {
    SubQuestionGroup,
    SubQuestionLabelType,
} from "@/types/editor";

export interface GroupedQuestionData {
    groups: SubQuestionGroup[];
    onChange: (groups: SubQuestionGroup[]) => void;
}

export interface GroupedQuestionOptions {
    title?: string;
}

export interface GroupedQuestionEditorProps {
    data: GroupedQuestionData;
    options?: GroupedQuestionOptions;
}

export interface GroupNodeEditorProps {
    group: SubQuestionGroup;
    index: number;
    canRemove: boolean;
    onChange: (index: number, updates: Partial<SubQuestionGroup>) => void;
    onRemove: (index: number) => void;
}

export type EditableSubQuestionRow = {
    labels: string[];
    labelType: SubQuestionLabelType;
};

export interface SubParensEditorProps {
    group: SubQuestionGroup;
    rows: EditableSubQuestionRow[];
    onChange: (updates: Partial<SubQuestionGroup>) => void;
}

export interface EssayEditorProps {
    group: SubQuestionGroup;
    onChange: (updates: Partial<SubQuestionGroup>) => void;
}
