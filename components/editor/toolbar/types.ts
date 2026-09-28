import type { ReactNode } from "react";
import type { PaperMargins } from "@/types/editor";

export interface EditorToolbarProps {
    onOpenQuestionModal: () => void;
    onOpenImportModal: () => void;
    onAddHeader: () => void;
    onAddNamebox: () => void;
    onAddScoretable: () => void;
    onClone: () => void;
    onDelete: () => void;
    hasEditableSelection: boolean;
    isPropertyPanelOpen: boolean;
    onTogglePropertyPanel: () => void;
    isGridVisible: boolean;
    onToggleGrid: (visible: boolean) => void;
    isSnapEnabled: boolean;
    onToggleSnap: (enabled: boolean) => void;
    isAlignmentGuidesEnabled: boolean;
    onToggleAlignmentGuides: (enabled: boolean) => void;
    isMarginGuidesVisible: boolean;
    onToggleMarginGuides: (visible: boolean) => void;
    paperMargins: PaperMargins;
    onPaperMarginsChange: (margins: PaperMargins) => void;
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomFit: () => void;
}

export interface CreationButtonsProps {
    onOpenQuestionModal: () => void;
    onOpenImportModal: () => void;
    onAddHeader: () => void;
    onAddNamebox: () => void;
    onAddScoretable: () => void;
}

export interface BlockOperationButtonsProps {
    onClone: () => void;
    onDelete: () => void;
    hasEditableSelection: boolean;
    isPropertyPanelOpen: boolean;
    onTogglePropertyPanel: () => void;
}

export interface MarginOptionsProps {
    isOpen: boolean;
    onToggle: () => void;
    isMarginGuidesVisible: boolean;
    paperMargins: PaperMargins;
    onPaperMarginsChange: (margins: PaperMargins) => void;
}

export interface ZoomControlsProps {
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomFit: () => void;
}

export interface ViewOptionsProps {
    children: ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    isGridVisible: boolean;
    onToggleGrid: (visible: boolean) => void;
    isSnapEnabled: boolean;
    onToggleSnap: (enabled: boolean) => void;
    isAlignmentGuidesEnabled: boolean;
    onToggleAlignmentGuides: (enabled: boolean) => void;
    isMarginGuidesVisible: boolean;
    onToggleMarginGuides: (visible: boolean) => void;
    isMarginOptionsOpen: boolean;
    onToggleMarginOptions: () => void;
    paperMargins: PaperMargins;
    onPaperMarginsChange: (margins: PaperMargins) => void;
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomFit: () => void;
}
