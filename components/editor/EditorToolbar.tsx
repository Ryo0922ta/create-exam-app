"use client";

import { useState } from "react";
import { BlockOperationButtons } from "./toolbar/BlockOperationButtons";
import { CreationButtons } from "./toolbar/CreationButtons";
import { ViewOptions } from "./toolbar/ViewOptions";
import type { EditorToolbarProps } from "./toolbar/types";

export function EditorToolbar({
    onOpenQuestionModal,
    onOpenImportModal,
    onAddHeader,
    onAddNamebox,
    onAddScoretable,
    onClone,
    onDelete,
    hasEditableSelection,
    isPropertyPanelOpen,
    onTogglePropertyPanel,
    isGridVisible,
    onToggleGrid,
    isSnapEnabled,
    onToggleSnap,
    isAlignmentGuidesEnabled,
    onToggleAlignmentGuides,
    isMarginGuidesVisible,
    onToggleMarginGuides,
    paperMargins,
    onPaperMarginsChange,
    zoomLevel,
    onZoomIn,
    onZoomOut,
    onZoomFit,
}: EditorToolbarProps) {
    const [isViewOptionsOpen, setIsViewOptionsOpen] = useState(false);
    const [isMarginOptionsOpen, setIsMarginOptionsOpen] = useState(false);

    return (
        <div className="bg-white border-b border-slate-200 z-20 flex-shrink-0 shadow-xs select-none">
            <ViewOptions
                isOpen={isViewOptionsOpen}
                onToggle={() => setIsViewOptionsOpen((open) => !open)}
                isGridVisible={isGridVisible}
                onToggleGrid={onToggleGrid}
                isSnapEnabled={isSnapEnabled}
                onToggleSnap={onToggleSnap}
                isAlignmentGuidesEnabled={isAlignmentGuidesEnabled}
                onToggleAlignmentGuides={onToggleAlignmentGuides}
                isMarginGuidesVisible={isMarginGuidesVisible}
                onToggleMarginGuides={onToggleMarginGuides}
                isMarginOptionsOpen={isMarginOptionsOpen}
                onToggleMarginOptions={() =>
                    setIsMarginOptionsOpen((open) => !open)
                }
                paperMargins={paperMargins}
                onPaperMarginsChange={onPaperMarginsChange}
                zoomLevel={zoomLevel}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onZoomFit={onZoomFit}
            >
                <CreationButtons
                    onOpenQuestionModal={onOpenQuestionModal}
                    onOpenImportModal={onOpenImportModal}
                    onAddHeader={onAddHeader}
                    onAddNamebox={onAddNamebox}
                    onAddScoretable={onAddScoretable}
                />
                <div className="h-5 w-px bg-slate-300 mx-1"></div>
                <BlockOperationButtons
                    onClone={onClone}
                    onDelete={onDelete}
                    hasEditableSelection={hasEditableSelection}
                    isPropertyPanelOpen={isPropertyPanelOpen}
                    onTogglePropertyPanel={onTogglePropertyPanel}
                />
            </ViewOptions>
        </div>
    );
}
