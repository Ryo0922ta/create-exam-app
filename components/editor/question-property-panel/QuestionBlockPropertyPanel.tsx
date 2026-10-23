"use client";

import { ExamHeaderForm } from "./ExamHeaderForm";
import { NameboxForm } from "./NameboxForm";
import { QuestionBlockForm } from "./QuestionBlockForm";
import { ScoreTableForm } from "./ScoreTableForm";
import type { CustomQuestionBlockGroup } from "@/lib/editor/questionBlockBuilder";
import type {
    CustomExamHeaderGroup,
    CustomNameboxGroup,
    CustomScoreTableGroup,
} from "@/lib/editor/basicPartBuilder";
import type { QuestionBlockPropertyPanelProps } from "./types";

export type { CustomFabricBlock } from "./types";

export const QuestionBlockPropertyPanel = ({
    selectedBlock,
    onUpdateQuestion,
    onUpdateExamHeader,
    onUpdateNamebox,
    onUpdateScoreTable,
    onClose,
}: QuestionBlockPropertyPanelProps) => {
    const customType = selectedBlock?.customType;

    if (!selectedBlock) return null;

    return (
        <aside
            role="dialog"
            aria-label="プロパティ編集パネル"
            className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shadow-lg z-30 transition-all duration-200 ease-in-out shrink-0 text-xs overflow-hidden"
        >
            {customType === "exam-header" && (
                <ExamHeaderForm
                    block={selectedBlock as CustomExamHeaderGroup}
                    onUpdate={onUpdateExamHeader}
                    onClose={onClose}
                />
            )}
            {customType === "namebox" && (
                <NameboxForm
                    block={selectedBlock as CustomNameboxGroup}
                    onUpdate={onUpdateNamebox}
                    onClose={onClose}
                />
            )}
            {customType === "score-table" && (
                <ScoreTableForm
                    block={selectedBlock as CustomScoreTableGroup}
                    onUpdate={onUpdateScoreTable}
                    onClose={onClose}
                />
            )}
            {(customType === "question-block" || !customType) && (
                <QuestionBlockForm
                    block={selectedBlock as CustomQuestionBlockGroup}
                    onUpdate={onUpdateQuestion}
                    onClose={onClose}
                />
            )}
        </aside>
    );
};
