"use client";

import type { QuestionBlockConfig, ExamHeaderConfig, NameboxConfig, ScoreTableConfig } from "@/types/editor";
import type { CustomQuestionBlockGroup } from "@/lib/editor/questionBlockBuilder";
import type {
    CustomExamHeaderGroup,
    CustomNameboxGroup,
    CustomScoreTableGroup,
} from "@/lib/editor/basicPartBuilder";
import { fabric } from "fabric";

export type EditableBlockType =
    | "question-block"
    | "exam-header"
    | "namebox"
    | "score-table";

export type CustomFabricBlock =
    | CustomQuestionBlockGroup
    | CustomExamHeaderGroup
    | CustomNameboxGroup
    | CustomScoreTableGroup
    | (fabric.Group & {
          customType?: EditableBlockType;
          questionConfig?: QuestionBlockConfig;
          examHeaderConfig?: ExamHeaderConfig;
          nameboxConfig?: NameboxConfig;
          scoreTableConfig?: ScoreTableConfig;
      });

export interface QuestionUpdateHandlers {
    onUpdateQuestion: (config: QuestionBlockConfig) => void;
}

export interface BasicPartUpdateHandlers {
    onUpdateExamHeader: (config: ExamHeaderConfig) => void;
    onUpdateNamebox: (config: NameboxConfig) => void;
    onUpdateScoreTable: (config: ScoreTableConfig) => void;
}

export interface QuestionBlockPropertyPanelProps
    extends QuestionUpdateHandlers,
        BasicPartUpdateHandlers {
    selectedBlock: CustomFabricBlock | null;
    onClose: () => void;
}

export interface ExamHeaderFormProps {
    block: CustomExamHeaderGroup;
    onUpdate?: (config: ExamHeaderConfig) => void;
    onClose: () => void;
}

export interface NameboxFormProps {
    block: CustomNameboxGroup;
    onUpdate?: (config: NameboxConfig) => void;
    onClose: () => void;
}

export interface ScoreTableFormProps {
    block: CustomScoreTableGroup;
    onUpdate?: (config: ScoreTableConfig) => void;
    onClose: () => void;
}

export interface QuestionBlockFormProps {
    block: CustomQuestionBlockGroup;
    onUpdate?: (config: QuestionBlockConfig) => void;
    onClose: () => void;
}
