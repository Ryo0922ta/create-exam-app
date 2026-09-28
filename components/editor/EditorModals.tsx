"use client";

import type { QuestionBlockConfig } from "@/types/editor";
import type { CustomQuestionBlockGroup } from "@/lib/editor/questionBlockBuilder";
import { QuestionEditModal } from "./modals/QuestionEditModal";
import { ImportTextModal } from "./modals/ImportTextModal";
import { BatchReplaceModal } from "./modals/BatchReplaceModal";

export interface EditorModalsProps {
    isQuestionModalOpen: boolean;
    isImportModalOpen: boolean;
    isReplaceModalOpen: boolean;
    editingBlock: CustomQuestionBlockGroup | null;
    onCloseQuestionModal: () => void;
    onCloseImportModal: () => void;
    onCloseReplaceModal: () => void;
    onApplyQuestionConfig: (config: QuestionBlockConfig) => void;
    onApplyBatchReplace: (target: string, newText: string) => void;
}

export function EditorModals({
    isQuestionModalOpen,
    isImportModalOpen,
    isReplaceModalOpen,
    editingBlock,
    onCloseQuestionModal,
    onCloseImportModal,
    onCloseReplaceModal,
    onApplyQuestionConfig,
    onApplyBatchReplace,
}: EditorModalsProps) {
    return (
        <>
            <QuestionEditModal
                isOpen={isQuestionModalOpen}
                initialConfig={editingBlock?.questionConfig || null}
                onClose={onCloseQuestionModal}
                onApply={onApplyQuestionConfig}
            />
            <ImportTextModal
                isOpen={isImportModalOpen}
                onClose={onCloseImportModal}
                onApply={onApplyQuestionConfig}
            />
            <BatchReplaceModal
                isOpen={isReplaceModalOpen}
                onClose={onCloseReplaceModal}
                onApply={onApplyBatchReplace}
            />
        </>
    );
}
