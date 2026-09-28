"use client";

import { useState } from "react";
import { BlockOperationButtons } from "./toolbar/BlockOperationButtons";
import { CreationButtons } from "./toolbar/CreationButtons";
import { ViewOptions } from "./toolbar/ViewOptions";
import type { EditorToolbarProps } from "./toolbar/types";

export function EditorToolbar({
    creation,
    blockOperations,
    view,
}: EditorToolbarProps) {
    const [isViewOptionsOpen, setIsViewOptionsOpen] = useState(false);
    const [isMarginOptionsOpen, setIsMarginOptionsOpen] = useState(false);

    return (
        <div className="bg-white border-b border-slate-200 z-20 flex-shrink-0 shadow-xs select-none">
            <ViewOptions
                isOpen={isViewOptionsOpen}
                onToggle={() => setIsViewOptionsOpen((open) => !open)}
                guides={view.guides}
                margins={{
                    paperMargins: view.margins.paperMargins,
                    onPaperMarginsChange:
                        view.margins.onPaperMarginsChange,
                    isOpen: isMarginOptionsOpen,
                    onToggle: () =>
                        setIsMarginOptionsOpen((open) => !open),
                    isMarginGuidesVisible:
                        view.guides.isMarginGuidesVisible,
                }}
                zoom={view.zoom}
            >
                <CreationButtons
                    onOpenQuestionModal={creation.onOpenQuestionModal}
                    onOpenImportModal={creation.onOpenImportModal}
                    onAddHeader={creation.onAddHeader}
                    onAddNamebox={creation.onAddNamebox}
                    onAddScoreTable={creation.onAddScoreTable}
                />
                <div className="h-5 w-px bg-slate-300 mx-1"></div>
                <BlockOperationButtons
                    onClone={blockOperations.onClone}
                    onDelete={blockOperations.onDelete}
                    hasEditableSelection={
                        blockOperations.hasEditableSelection
                    }
                    isPropertyPanelOpen={
                        blockOperations.isPropertyPanelOpen
                    }
                    onTogglePropertyPanel={
                        blockOperations.onTogglePropertyPanel
                    }
                />
            </ViewOptions>
        </div>
    );
}
