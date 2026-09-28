import type { ReactNode } from "react";
import type { PaperMargins } from "@/types/editor";

export interface EditorToolbarProps {
    creation: CreationActions;
    blockOperations: BlockOperations;
    view: ViewOptions;
}

export interface CreationActions {
    onOpenQuestionModal: () => void;
    onOpenImportModal: () => void;
    onAddHeader: () => void;
    onAddNamebox: () => void;
    onAddScoretable: () => void;
}

export interface BlockOperations {
    onClone: () => void;
    onDelete: () => void;
    hasEditableSelection: boolean;
    isPropertyPanelOpen: boolean;
    onTogglePropertyPanel: () => void;
}

export interface GuideOptions {
    isGridVisible: boolean;
    onToggleGrid: (visible: boolean) => void;
    isSnapEnabled: boolean;
    onToggleSnap: (enabled: boolean) => void;
    isAlignmentGuidesEnabled: boolean;
    onToggleAlignmentGuides: (enabled: boolean) => void;
    isMarginGuidesVisible: boolean;
    onToggleMarginGuides: (visible: boolean) => void;
}

export interface MarginOptions {
    paperMargins: PaperMargins;
    onPaperMarginsChange: (margins: PaperMargins) => void;
}

export interface ZoomOptions {
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomFit: () => void;
}

export interface ViewOptions {
    guides: GuideOptions;
    margins: MarginOptions;
    zoom: ZoomOptions;
}

export type CreationButtonsProps = CreationActions;

export type BlockOperationButtonsProps = BlockOperations;

export interface MarginOptionsProps extends MarginOptions {
    isOpen: boolean;
    onToggle: () => void;
    isMarginGuidesVisible: boolean;
}

export type ZoomControlsProps = ZoomOptions;

export interface ViewOptionsProps {
    children: ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    guides: GuideOptions;
    margins: MarginOptionsProps;
    zoom: ZoomOptions;
}
