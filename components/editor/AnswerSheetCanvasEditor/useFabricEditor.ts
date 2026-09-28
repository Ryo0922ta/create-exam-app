"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import {
    DEFAULT_PAPER_MARGINS,
    type ExamHeaderConfig,
    type NameboxConfig,
    type QuestionBlockConfig,
    type ScoreTableConfig,
    type PaperMargins,
} from "@/types/editor";
import {
    PAPER_SIZES,
    getGridCellSizePx,
} from "@/lib/editor/paperSizes";
import {
    createExamHeaderBlock,
    createNameboxBlock,
    createScoreTableBlock,
    DEFAULT_EXAM_HEADER_CONFIG,
    DEFAULT_NAMEBOX_CONFIG,
    DEFAULT_SCORE_TABLE_CONFIG,
} from "@/lib/editor/basicPartBuilder";
import { createQuestionBlock } from "@/lib/editor/questionBlockBuilder";
import {
    computeAlignmentSnap,
    clearAlignmentGuides,
    isAlignmentGuide,
    renderAlignmentGuides,
} from "@/lib/editor/alignmentGuides";
import { computeMarginRegions } from "@/lib/editor/marginGuides";
import type { CustomFabricBlock } from "../question-property-panel/types";
import {
    cloneBlockObject,
    isEditableBlock,
    removeObjectsFromCanvas,
    replaceQuestionRubric,
    setupInitialSampleLayout,
} from "./model";

const GRID_CELL_SIZE_PX = {
    x: getGridCellSizePx("x"),
    y: getGridCellSizePx("y"),
};

export interface UseFabricEditorOptions {
    paperMargins?: PaperMargins;
    onToast: (message: string) => void;
}

export function useFabricEditor({
    paperMargins = DEFAULT_PAPER_MARGINS,
    onToast,
}: UseFabricEditorOptions) {
    const fabricHostRef = useRef<HTMLDivElement | null>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const containerWrapRef = useRef<HTMLDivElement | null>(null);
    const snapEnabledRef = useRef(true);
    const alignmentGuidesEnabledRef = useRef(true);
    const paperMarginsRef = useRef(paperMargins);
    const selectedBlockRef = useRef<CustomFabricBlock | null>(null);
    const isPropertyPanelOpenRef = useRef(false);
    const suppressSelectionClearRef = useRef(false);

    const [selectedBlock, setSelectedBlock] =
        useState<CustomFabricBlock | null>(null);
    const [isPropertyPanelOpen, setIsPropertyPanelOpen] = useState(false);
    const [questionBlockCount, setQuestionBlockCount] = useState(0);
    const [isSnapEnabled, setIsSnapEnabled] = useState(true);
    const [isAlignmentGuidesEnabled, setIsAlignmentGuidesEnabled] =
        useState(true);
    const [zoomLevel, setZoomLevel] = useState(0.5);

    useEffect(() => {
        paperMarginsRef.current = paperMargins;
    }, [paperMargins]);

    useEffect(() => {
        isPropertyPanelOpenRef.current = isPropertyPanelOpen;
    }, [isPropertyPanelOpen]);

    const selectEditableBlock = useCallback(
        (block: CustomFabricBlock, options?: { openPanel?: boolean }) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            canvas.setActiveObject(block);
            setSelectedBlock(block);
            selectedBlockRef.current = block;
            if (options?.openPanel ?? true) {
                setIsPropertyPanelOpen(true);
            }
            canvas.requestRenderAll();
        },
        [],
    );

    const selectEditableBlockRef = useRef(selectEditableBlock);
    selectEditableBlockRef.current = selectEditableBlock;

    const fitCanvasToScreen = useCallback(() => {
        const container = containerWrapRef.current;
        const canvas = fabricCanvasRef.current;
        if (!container || !canvas) return;

        const b4 = PAPER_SIZES.B4_LANDSCAPE;
        const availableW = container.clientWidth - 48;
        const availableH = container.clientHeight - 48;
        const scaleW = availableW / b4.widthPx;
        const scaleH = availableH / b4.heightPx;
        const bestScale = Math.min(scaleW, scaleH, 1.0);
        const newZoom = Math.max(Math.floor(bestScale * 100) / 100, 0.4);

        setZoomLevel(newZoom);
        canvas.setDimensions({
            width: b4.widthPx * newZoom,
            height: b4.heightPx * newZoom,
        });
        canvas.setZoom(newZoom);
        canvas.calcOffset();
        canvas.requestRenderAll();
    }, []);

    const applyZoom = useCallback((value: number) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const b4 = PAPER_SIZES.B4_LANDSCAPE;
        const nextZoom = Math.min(Math.max(value, 0.35), 1.5);
        const roundedZoom = Math.round(nextZoom * 100) / 100;
        setZoomLevel(roundedZoom);
        canvas.setDimensions({
            width: b4.widthPx * roundedZoom,
            height: b4.heightPx * roundedZoom,
        });
        canvas.setZoom(roundedZoom);
        canvas.calcOffset();
        canvas.requestRenderAll();
    }, []);

    useEffect(() => {
        const host = fabricHostRef.current;
        if (!host) return;

        const b4 = PAPER_SIZES.B4_LANDSCAPE;
        const canvasElement = document.createElement("canvas");
        host.appendChild(canvasElement);
        const canvas = new fabric.Canvas(canvasElement, {
            width: b4.widthPx,
            height: b4.heightPx,
            backgroundColor: "transparent",
            selection: true,
            preserveObjectStacking: true,
        });
        fabricCanvasRef.current = canvas;

        canvas.on("object:moving", (event) => {
            if (!event.target) return;
            const object = event.target;
            const alignmentOn = alignmentGuidesEnabledRef.current;
            const gridSnapOn = snapEnabledRef.current;

            if (!alignmentOn && !gridSnapOn) {
                clearAlignmentGuides(canvas);
                return;
            }

            let left = object.left ?? 0;
            let top = object.top ?? 0;
            let snappedX = false;
            let snappedY = false;

            if (alignmentOn) {
                const refs = canvas
                    .getObjects()
                    .filter((item) => item !== object && !isAlignmentGuide(item));
                const regions = computeMarginRegions(
                    paperMarginsRef.current,
                    b4.widthPx,
                    b4.heightPx,
                );
                const result = computeAlignmentSnap(
                    object,
                    refs,
                    b4.widthPx,
                    b4.heightPx,
                    canvas.getZoom(),
                    regions,
                );
                left = result.left;
                top = result.top;
                snappedX = result.snappedX;
                snappedY = result.snappedY;
                renderAlignmentGuides(canvas, result.guides);
            } else {
                clearAlignmentGuides(canvas);
            }

            if (gridSnapOn) {
                if (!snappedX) {
                    left =
                        Math.round(left / GRID_CELL_SIZE_PX.x) *
                        GRID_CELL_SIZE_PX.x;
                }
                if (!snappedY) {
                    top =
                        Math.round(top / GRID_CELL_SIZE_PX.y) *
                        GRID_CELL_SIZE_PX.y;
                }
            }

            object.set({ left, top });
            object.setCoords();
        });

        const updateSelectionState = () => {
            const activeObject = canvas.getActiveObject();
            if (isEditableBlock(activeObject)) {
                selectEditableBlockRef.current(activeObject, {
                    openPanel: true,
                });
            } else {
                setSelectedBlock(null);
                selectedBlockRef.current = null;
            }
        };
        const handleClearGuides = () => clearAlignmentGuides(canvas);

        canvas.on("mouse:up", handleClearGuides);
        canvas.on("object:modified", handleClearGuides);
        canvas.on("selection:created", updateSelectionState);
        canvas.on("selection:updated", updateSelectionState);
        canvas.on("selection:cleared", () => {
            handleClearGuides();
            if (suppressSelectionClearRef.current) return;
            if (isPropertyPanelOpenRef.current) return;
            setSelectedBlock(null);
            selectedBlockRef.current = null;
            setIsPropertyPanelOpen(false);
        });

        setupInitialSampleLayout(canvas);
        setTimeout(fitCanvasToScreen, 150);

        const handleResize = () => fitCanvasToScreen();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            canvas.dispose();
            fabricCanvasRef.current = null;
            host.replaceChildren();
        };
    }, [fitCanvasToScreen]);

    const toggleSnap = useCallback(
        (enabled: boolean) => {
            snapEnabledRef.current = enabled;
            setIsSnapEnabled(enabled);
            onToast(
                enabled
                    ? "スナップ吸着を有効にしました"
                    : "スナップ吸着を無効にしました",
            );
        },
        [onToast],
    );

    const toggleAlignmentGuides = useCallback(
        (enabled: boolean) => {
            alignmentGuidesEnabledRef.current = enabled;
            setIsAlignmentGuidesEnabled(enabled);
            const canvas = fabricCanvasRef.current;
            if (!enabled && canvas) clearAlignmentGuides(canvas);
            onToast(
                enabled
                    ? "配置ガイドを有効にしました"
                    : "配置ガイドを無効にしました",
            );
        },
        [onToast],
    );

    const removeSelectedObjects = useCallback(
        (message: string) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length === 0) return;

            setQuestionBlockCount(
                removeObjectsFromCanvas(canvas, activeObjects),
            );
            setSelectedBlock(null);
            selectedBlockRef.current = null;
            setIsPropertyPanelOpen(false);
            onToast(message);
        },
        [onToast],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeTag = (
                document.activeElement?.tagName || ""
            ).toUpperCase();
            if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) return;
            if (event.key === "Delete" || event.key === "Backspace") {
                removeSelectedObjects("選択項目を削除しました");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [removeSelectedObjects]);

    const applyQuestionConfig = useCallback(
        (
            config: QuestionBlockConfig,
            editingBlock: fabric.Group | null,
        ): boolean => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return false;

            if (editingBlock) {
                const left = editingBlock.left || 40;
                const top = editingBlock.top || 40;
                canvas.remove(editingBlock);
                const newBlock = createQuestionBlock(config, left, top);
                canvas.add(newBlock);
                selectEditableBlock(newBlock, { openPanel: true });
                onToast(
                    `大問 ${config.num} を更新しました。右のプロパティで調整できます`,
                );
                return true;
            }

            const newBlock = createQuestionBlock(
                config,
                Math.round(50 / GRID_CELL_SIZE_PX.x) * GRID_CELL_SIZE_PX.x,
                Math.round(100 / GRID_CELL_SIZE_PX.y) * GRID_CELL_SIZE_PX.y,
            );
            canvas.add(newBlock);
            setQuestionBlockCount((count) => count + 1);
            selectEditableBlock(newBlock, { openPanel: true });
            onToast(
                `大問 ${config.num} を用紙に追加しました。右のプロパティで調整できます`,
            );
            return true;
        },
        [onToast, selectEditableBlock],
    );

    const replaceSelectedBlock = useCallback(
        (createBlock: (left: number, top: number) => CustomFabricBlock) => {
            const canvas = fabricCanvasRef.current;
            const target = selectedBlockRef.current;
            if (!canvas || !target) return;

            const left = target.left ?? 40;
            const top = target.top ?? 40;
            suppressSelectionClearRef.current = true;
            canvas.remove(target);
            const newBlock = createBlock(left, top);
            canvas.add(newBlock);
            selectEditableBlock(newBlock, { openPanel: true });
            requestAnimationFrame(() => {
                suppressSelectionClearRef.current = false;
            });
        },
        [selectEditableBlock],
    );

    const updateSelectedQuestion = useCallback(
        (config: QuestionBlockConfig) =>
            replaceSelectedBlock((left, top) =>
                createQuestionBlock(config, left, top),
            ),
        [replaceSelectedBlock],
    );
    const updateSelectedExamHeader = useCallback(
        (config: ExamHeaderConfig) =>
            replaceSelectedBlock((left, top) =>
                createExamHeaderBlock(config, left, top),
            ),
        [replaceSelectedBlock],
    );
    const updateSelectedNamebox = useCallback(
        (config: NameboxConfig) =>
            replaceSelectedBlock((left, top) =>
                createNameboxBlock(config, left, top),
            ),
        [replaceSelectedBlock],
    );
    const updateSelectedScoreTable = useCallback(
        (config: ScoreTableConfig) =>
            replaceSelectedBlock((left, top) =>
                createScoreTableBlock(config, left, top),
            ),
        [replaceSelectedBlock],
    );

    const togglePropertyPanel = useCallback(() => {
        if (!selectedBlockRef.current) {
            onToast("編集する枠を選択してください");
            return;
        }
        setIsPropertyPanelOpen((open) => !open);
    }, [onToast]);

    const closePropertyPanel = useCallback(() => {
        setIsPropertyPanelOpen(false);
    }, []);

    const applyBatchReplace = useCallback(
        (target: string, replacement: string) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas || !target) return;

            const replaceCount = replaceQuestionRubric(
                canvas,
                target,
                replacement,
            );
            if (replaceCount > 0) {
                canvas.requestRenderAll();
                onToast(`${replaceCount}件の大問の観点記号を置換しました`);
            } else {
                onToast("対象の観点記号が見つかりませんでした");
            }
        },
        [onToast],
    );

    const addHeader = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const group = createExamHeaderBlock(DEFAULT_EXAM_HEADER_CONFIG, 40, 40);
        canvas.add(group);
        selectEditableBlock(group, { openPanel: true });
        onToast("考査見出し枠を追加しました");
    }, [onToast, selectEditableBlock]);

    const addNamebox = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const group = createNameboxBlock(DEFAULT_NAMEBOX_CONFIG, 350, 90);
        canvas.add(group);
        selectEditableBlock(group, { openPanel: true });
        onToast("年組氏名欄を追加しました");
    }, [onToast, selectEditableBlock]);

    const addScoreTable = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const group = createScoreTableBlock(
            DEFAULT_SCORE_TABLE_CONFIG,
            1080,
            860,
        );
        canvas.add(group);
        selectEditableBlock(group, { openPanel: true });
        onToast("観点別得点枠を追加しました");
    }, [onToast, selectEditableBlock]);

    const cloneSelectedBlock = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        const activeObject = canvas?.getActiveObject() as
            | CustomFabricBlock
            | undefined;
        if (!canvas || !activeObject) return;

        cloneBlockObject(
            activeObject,
            (activeObject.left || 0) + GRID_CELL_SIZE_PX.x,
            (activeObject.top || 0) + GRID_CELL_SIZE_PX.y,
            (cloned) => {
                canvas.add(cloned);
                if (cloned.customType === "question-block") {
                    setQuestionBlockCount((count) => count + 1);
                }
                selectEditableBlock(cloned, { openPanel: true });
                onToast("枠を複製しました");
            },
        );
    }, [onToast, selectEditableBlock]);

    const clearCanvas = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        if (window.confirm("すべての要素を削除し、白紙に戻しますか？")) {
            canvas.clear();
            setQuestionBlockCount(0);
            setIsPropertyPanelOpen(false);
            canvas.requestRenderAll();
            onToast("白紙に戻しました");
        }
    }, [onToast]);

    return {
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
        deleteSelectedBlocks: () =>
            removeSelectedObjects("選択枠を削除しました"),
        clearCanvas,
    };
}
