"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
    DEFAULT_PAPER_MARGINS,
} from "@/types/editor";
import {
    PAPER_SIZES,
    GRID_MAJOR_CELL_COUNT,
    getGridCellSizePx,
} from "@/lib/editor/paperSizes";
import { exportB4LandscapePdf, exportA4SplitPdf } from "@/lib/editor/exportPdf";
import { exportB4WordDocx } from "@/lib/editor/exportWord";
import { computeMarginGuideLines } from "@/lib/editor/marginGuides";
import { EditorToolbar } from "../toolbar/EditorToolbar";
import { EditorHeader } from "./EditorHeader";
import { CanvasWorkspace } from "./CanvasWorkspace";
import { EditorModals } from "./EditorModals";
import { QuestionBlockPropertyPanel } from "../question-property-panel/QuestionBlockPropertyPanel";
import type { QuestionBlockPropertyPanelProps } from "../question-property-panel/types";
import type { CustomQuestionBlockGroup } from "@/lib/editor/questionBlockBuilder";
import { useFabricEditor } from "./useFabricEditor";
import type {
    BlockOperations,
    CreationActions,
    ViewOptions,
} from "../toolbar/types";

const GRID_CELL_SIZE_PX = {
    x: getGridCellSizePx("x"),
    y: getGridCellSizePx("y"),
};

export function AnswerSheetCanvasEditor() {
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] =
        useState<CustomQuestionBlockGroup | null>(null);

    const [isGridVisible, setIsGridVisible] = useState(false);
    const [isMarginGuidesVisible, setIsMarginGuidesVisible] = useState(true);
    const [paperMargins, setPaperMargins] = useState(DEFAULT_PAPER_MARGINS);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage((current) =>
                current === message ? null : current,
            );
        }, 2500);
    }, []);

    const fabricEditor = useFabricEditor({
        paperMargins,
        onToast: showToast,
    });
    const {
        fabricHostRef,
        fabricCanvasRef,
        containerWrapRef,
        selectedBlock,
        isPropertyPanelOpen,
        questionBlockCount,
        isSnapEnabled,
        isAlignmentGuidesEnabled,
        zoomLevel,
        fitCanvasToScreen,
        applyZoom,
        toggleSnap,
        toggleAlignmentGuides,
        applyQuestionConfig,
        updateSelectedQuestion,
        updateSelectedExamHeader,
        updateSelectedNamebox,
        updateSelectedScoreTable,
        togglePropertyPanel,
        closePropertyPanel,
        applyBatchReplace,
        addHeader,
        addNamebox,
        addScoreTable,
        cloneSelectedBlock,
        deleteSelectedBlocks,
        clearCanvas,
    } = fabricEditor;

    const handleApplyQuestionConfig = useCallback(
        (config: Parameters<typeof applyQuestionConfig>[0]) => {
            if (applyQuestionConfig(config, editingBlock) && editingBlock) {
                setEditingBlock(null);
            }
        },
        [applyQuestionConfig, editingBlock],
    );

    const handleExportPdfB4 = async () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || isExporting) return;
        setIsExporting(true);
        setIsPdfDropdownOpen(false);
        try {
            showToast("B4横 PDFを作成中...");
            await exportB4LandscapePdf(canvas);
            showToast("B4横 PDFを保存しました");
        } catch (err) {
            console.error("PDF Export Error:", err);
            showToast("PDF出力中にエラーが発生しました");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPdfSplit = async () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || isExporting) return;
        setIsExporting(true);
        setIsPdfDropdownOpen(false);
        try {
            showToast("A4分割 PDFを作成中...");
            await exportA4SplitPdf(canvas);
            showToast("A4分割 PDFを保存しました");
        } catch (err) {
            console.error("PDF Split Export Error:", err);
            showToast("PDF出力中にエラーが発生しました");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportWord = async () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || isExporting) return;
        setIsExporting(true);
        try {
            showToast("Word形式 (.docx) を作成中...");
            await exportB4WordDocx(canvas);
            showToast("Word文書 (.docx) を保存しました");
        } catch (err) {
            console.error("Word Export Error:", err);
            showToast("Word出力中にエラーが発生しました");
        } finally {
            setIsExporting(false);
        }
    };

    const b4Config = PAPER_SIZES.B4_LANDSCAPE;
    const hasQuestionBlock = questionBlockCount > 0;

    const gridHostStyle = useMemo((): React.CSSProperties | undefined => {
        if (!isGridVisible) return undefined;
        const cellX = GRID_CELL_SIZE_PX.x * zoomLevel;
        const cellY = GRID_CELL_SIZE_PX.y * zoomLevel;
        const majorX = cellX * GRID_MAJOR_CELL_COUNT;
        const majorY = cellY * GRID_MAJOR_CELL_COUNT;
        return {
            ["--grid-cell-x" as string]: `${cellX}px`,
            ["--grid-cell-y" as string]: `${cellY}px`,
            ["--grid-major-x" as string]: `${majorX}px`,
            ["--grid-major-y" as string]: `${majorY}px`,
        };
    }, [isGridVisible, zoomLevel]);
    const marginGuideLines = useMemo(
        () =>
            computeMarginGuideLines(
                paperMargins,
                b4Config.widthPx,
                b4Config.heightPx,
            ),
        [paperMargins, b4Config.widthPx, b4Config.heightPx],
    );

    const creationActions: CreationActions = {
        onOpenQuestionModal: () => {
            setEditingBlock(null);
            setIsQuestionModalOpen(true);
        },
        onOpenImportModal: () => setIsImportModalOpen(true),
        onAddHeader: addHeader,
        onAddNamebox: addNamebox,
        onAddScoreTable: addScoreTable,
    };

    const blockOperations: BlockOperations = {
        onClone: cloneSelectedBlock,
        onDelete: deleteSelectedBlocks,
        hasEditableSelection: selectedBlock !== null,
        isPropertyPanelOpen,
        onTogglePropertyPanel: togglePropertyPanel,
    };

    const viewOptions: ViewOptions = {
        guides: {
            isGridVisible,
            onToggleGrid: setIsGridVisible,
            isSnapEnabled,
            onToggleSnap: toggleSnap,
            isAlignmentGuidesEnabled,
            onToggleAlignmentGuides: toggleAlignmentGuides,
            isMarginGuidesVisible,
            onToggleMarginGuides: setIsMarginGuidesVisible,
        },
        margins: {
            paperMargins,
            onPaperMarginsChange: setPaperMargins,
        },
        zoom: {
            zoomLevel,
            onZoomIn: () => applyZoom(zoomLevel + 0.1),
            onZoomOut: () => applyZoom(zoomLevel - 0.1),
            onZoomFit: fitCanvasToScreen,
        },
    };

    const propertyPanelProps: QuestionBlockPropertyPanelProps = {
        selectedBlock,
        onUpdateQuestion: updateSelectedQuestion,
        onUpdateExamHeader: updateSelectedExamHeader,
        onUpdateNamebox: updateSelectedNamebox,
        onUpdateScoreTable: updateSelectedScoreTable,
        onClose: closePropertyPanel,
    };

    return (
        <div className="h-screen bg-slate-100 text-slate-800 flex flex-col overflow-hidden font-sans">
            <EditorHeader
                onOpenBatchReplace={() => setIsReplaceModalOpen(true)}
                onClear={clearCanvas}
                onExportPdfB4={handleExportPdfB4}
                onExportPdfSplit={handleExportPdfSplit}
                onExportWord={handleExportWord}
                isExporting={isExporting}
                isPdfDropdownOpen={isPdfDropdownOpen}
                onTogglePdfDropdown={() =>
                    setIsPdfDropdownOpen((isOpen) => !isOpen)
                }
            />


            {/* ツールバー */}
            <EditorToolbar
                creation={creationActions}
                blockOperations={blockOperations}
                view={viewOptions}
            />

            {/* メイン編集エリア（キャンバス + プロパティパネル） */}
            <div className="flex-1 flex overflow-hidden relative">
                <CanvasWorkspace
                    containerRef={containerWrapRef}
                    fabricHostRef={fabricHostRef}
                    canvasWidth={b4Config.widthPx * zoomLevel}
                    canvasHeight={b4Config.heightPx * zoomLevel}
                    gridHostStyle={gridHostStyle}
                    isGridVisible={isGridVisible}
                    isMarginGuidesVisible={isMarginGuidesVisible}
                    marginGuideLines={marginGuideLines}
                    hasQuestionBlock={hasQuestionBlock}
                    onOpenQuestionModal={() => {
                        setEditingBlock(null);
                        setIsQuestionModalOpen(true);
                    }}
                    onClosePdfDropdown={() => setIsPdfDropdownOpen(false)}
                />

                {/* プロパティ編集サイドパネル（選択時に自動表示） */}
                {isPropertyPanelOpen && selectedBlock && (
                    <QuestionBlockPropertyPanel
                        selectedBlock={propertyPanelProps.selectedBlock}
                        onUpdateQuestion={propertyPanelProps.onUpdateQuestion}
                        onUpdateExamHeader={
                            propertyPanelProps.onUpdateExamHeader
                        }
                        onUpdateNamebox={propertyPanelProps.onUpdateNamebox}
                        onUpdateScoreTable={
                            propertyPanelProps.onUpdateScoreTable
                        }
                        onClose={propertyPanelProps.onClose}
                    />
                )}
            </div>

            <EditorModals
                isQuestionModalOpen={isQuestionModalOpen}
                isImportModalOpen={isImportModalOpen}
                isReplaceModalOpen={isReplaceModalOpen}
                editingBlock={editingBlock}
                onCloseQuestionModal={() => {
                    setIsQuestionModalOpen(false);
                    setEditingBlock(null);
                }}
                onCloseImportModal={() => setIsImportModalOpen(false)}
                onCloseReplaceModal={() => setIsReplaceModalOpen(false)}
                onApplyQuestionConfig={handleApplyQuestionConfig}
                onApplyBatchReplace={applyBatchReplace}
            />

            {/* トースト通知 */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5 duration-200">
                    <svg
                        className="w-4 h-4 text-emerald-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
};
