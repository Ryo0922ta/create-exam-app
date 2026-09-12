"use client";

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
} from "react";
import Link from "next/link";
import { fabric } from "fabric";
import {
    DEFAULT_PAPER_MARGINS,
    QuestionBlockConfig,
    ExamHeaderConfig,
    NameboxConfig,
    ScoreTableConfig,
} from "@/types/editor";
import {
    PAPER_SIZES,
    GRID_MAJOR_CELL_COUNT,
    getGridCellSizePx,
    SECTION_STANDARD_WIDTH,
} from "@/lib/editor/paperSizes";

const GRID_CELL_SIZE_PX = {
    x: getGridCellSizePx("x"),
    y: getGridCellSizePx("y"),
};
import {
    createQuestionBlock,
    CustomQuestionBlockGroup,
} from "@/lib/editor/questionBlockBuilder";
import {
    createExamHeaderBlock,
    createNameboxBlock,
    createScoreTableBlock,
    DEFAULT_EXAM_HEADER_CONFIG,
    DEFAULT_NAMEBOX_CONFIG,
    DEFAULT_SCORE_TABLE_CONFIG,
    CustomExamHeaderGroup,
    CustomNameboxGroup,
    CustomScoreTableGroup,
} from "@/lib/editor/basicPartBuilder";
import { exportB4LandscapePdf, exportA4SplitPdf } from "@/lib/editor/exportPdf";
import { exportB4WordDocx } from "@/lib/editor/exportWord";
import {
    computeAlignmentSnap,
    clearAlignmentGuides,
    isAlignmentGuide,
    renderAlignmentGuides,
} from "@/lib/editor/alignmentGuides";
import {
    computeMarginGuideLines,
    computeMarginRegions,
} from "@/lib/editor/marginGuides";
import { EditorToolbar } from "./EditorToolbar";
import { QuestionEditModal } from "./modals/QuestionEditModal";
import { ImportTextModal } from "./modals/ImportTextModal";
import { BatchReplaceModal } from "./modals/BatchReplaceModal";
import {
    QuestionBlockPropertyPanel,
    CustomFabricBlock,
} from "./QuestionBlockPropertyPanel";

function isEditableBlock(
    obj: fabric.Object | null | undefined,
): obj is CustomFabricBlock {
    if (!obj) return false;
    const block = obj as CustomFabricBlock;
    return (
        block.customType === "question-block" ||
        block.customType === "exam-header" ||
        block.customType === "namebox" ||
        block.customType === "score-table"
    );
}

export const AnswerSheetCanvasEditor: React.FC = () => {
    const fabricHostRef = useRef<HTMLDivElement | null>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const containerWrapRef = useRef<HTMLDivElement | null>(null);
    const snapEnabledRef = useRef(true);
    const alignmentGuidesEnabledRef = useRef(true);
    const paperMarginsRef = useRef(DEFAULT_PAPER_MARGINS);
    const selectedBlockRef = useRef<CustomFabricBlock | null>(null);
    const isPropertyPanelOpenRef = useRef(false);
    const suppressSelectionClearRef = useRef(false);

    // モーダル表示状態
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] =
        useState<CustomQuestionBlockGroup | null>(null);

    // 選択中のブロック（大問・基本パーツ）
    const [selectedBlock, setSelectedBlock] =
        useState<CustomFabricBlock | null>(null);
    const [isPropertyPanelOpen, setIsPropertyPanelOpen] = useState(false);
    const [questionBlockCount, setQuestionBlockCount] = useState(0);

    // グリッド・スナップ・ズーム
    const [isGridVisible, setIsGridVisible] = useState(false);
    const [isSnapEnabled, setIsSnapEnabled] = useState(true);
    const [isAlignmentGuidesEnabled, setIsAlignmentGuidesEnabled] =
        useState(true);
    const [isMarginGuidesVisible, setIsMarginGuidesVisible] = useState(true);
    const [paperMargins, setPaperMargins] = useState(DEFAULT_PAPER_MARGINS);
    const [zoomLevel, setZoomLevel] = useState(0.5);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => (current === msg ? null : current));
        }, 2500);
    }, []);

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

    // 画面に合わせる（Fit to Screen）
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

    // ズーム変更
    const applyZoom = useCallback((val: number) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const b4 = PAPER_SIZES.B4_LANDSCAPE;
        const nextZoom = Math.min(Math.max(val, 0.35), 1.5);
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

    // 初期配置（考査見出し枠のみ）
    const setupInitialSampleLayout = (canvas: fabric.Canvas) => {
        const headerGroup = createExamHeaderBlock(
            DEFAULT_EXAM_HEADER_CONFIG,
            40,
            40,
        );
        canvas.add(headerGroup);

        canvas.getObjects().forEach((obj) => {
            obj.set({
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
            });
            obj.setCoords();
        });
        canvas.requestRenderAll();
    };

    // Fabric Canvas の初期化
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

        // オブジェクト移動時: 配置ガイド吸着 → 方眼スナップ
        canvas.on("object:moving", (e) => {
            if (!e.target) return;
            const obj = e.target;
            const alignmentOn = alignmentGuidesEnabledRef.current;
            const gridSnapOn = snapEnabledRef.current;

            if (!alignmentOn && !gridSnapOn) {
                clearAlignmentGuides(canvas);
                return;
            }

            let left = obj.left ?? 0;
            let top = obj.top ?? 0;
            let snappedX = false;
            let snappedY = false;

            if (alignmentOn) {
                const refs = canvas
                    .getObjects()
                    .filter((o) => o !== obj && !isAlignmentGuide(o));
                const regions = computeMarginRegions(
                    paperMarginsRef.current,
                    b4.widthPx,
                    b4.heightPx,
                );
                const result = computeAlignmentSnap(
                    obj,
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

            obj.set({ left, top });
            obj.setCoords();
        });

        const updateSelectionState = () => {
            const activeObj = canvas.getActiveObject();
            if (isEditableBlock(activeObj)) {
                selectEditableBlockRef.current(activeObj, { openPanel: true });
            } else {
                setSelectedBlock(null);
                selectedBlockRef.current = null;
            }
        };

        const handleClearGuides = () => {
            clearAlignmentGuides(canvas);
        };

        canvas.on("mouse:up", handleClearGuides);
        canvas.on("object:modified", handleClearGuides);
        canvas.on("selection:created", updateSelectionState);
        canvas.on("selection:updated", updateSelectionState);
        canvas.on("selection:cleared", () => {
            handleClearGuides();
            // プロパティ更新による置換、またはサイドバー操作時は閉じない
            if (suppressSelectionClearRef.current) return;
            if (isPropertyPanelOpenRef.current) return;
            setSelectedBlock(null);
            selectedBlockRef.current = null;
            setIsPropertyPanelOpen(false);
        });

        // 初期サンプルの配置
        setupInitialSampleLayout(canvas);

        setTimeout(() => {
            fitCanvasToScreen();
        }, 150);

        const handleResize = () => fitCanvasToScreen();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            canvas.dispose();
            fabricCanvasRef.current = null;
            host.replaceChildren();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // スナップ吸着トグル
    const handleToggleSnap = (enabled: boolean) => {
        snapEnabledRef.current = enabled;
        setIsSnapEnabled(enabled);
        showToast(
            enabled
                ? "スナップ吸着を有効にしました"
                : "スナップ吸着を無効にしました",
        );
    };

    // 配置ガイドトグル
    const handleToggleAlignmentGuides = (enabled: boolean) => {
        alignmentGuidesEnabledRef.current = enabled;
        setIsAlignmentGuidesEnabled(enabled);
        const canvas = fabricCanvasRef.current;
        if (!enabled && canvas) {
            clearAlignmentGuides(canvas);
        }
        showToast(
            enabled
                ? "配置ガイドを有効にしました"
                : "配置ガイドを無効にしました",
        );
    };

    // 方眼グリッドトグル
    const handleToggleGrid = (visible: boolean) => {
        setIsGridVisible(visible);
    };

    // キーボード削除ショートカット
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = (
                document.activeElement?.tagName || ""
            ).toUpperCase();
            if (
                activeTag === "INPUT" ||
                activeTag === "TEXTAREA" ||
                activeTag === "SELECT"
            ) {
                return;
            }

            if (e.key === "Delete" || e.key === "Backspace") {
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;

                const activeObjects = canvas.getActiveObjects();
                if (activeObjects.length > 0) {
                    canvas.discardActiveObject();
                    activeObjects.forEach((obj) => canvas.remove(obj));
                    setQuestionBlockCount(
                        canvas
                            .getObjects()
                            .filter(
                                (obj) =>
                                    (obj as CustomFabricBlock).customType ===
                                    "question-block",
                            ).length,
                    );
                    setSelectedBlock(null);
                    selectedBlockRef.current = null;
                    setIsPropertyPanelOpen(false);
                    canvas.requestRenderAll();
                    showToast("選択項目を削除しました");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showToast]);

    // 大問作成・更新の適用
    const handleApplyQuestionConfig = (cfg: QuestionBlockConfig) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        if (editingBlock) {
            // 編集中のブロックを置換
            const left = editingBlock.left || 40;
            const top = editingBlock.top || 40;
            canvas.remove(editingBlock);

            const newBlock = createQuestionBlock(cfg, left, top);
            canvas.add(newBlock);
            selectEditableBlock(newBlock, { openPanel: true });
            showToast(
                `大問 ${cfg.num} を更新しました。右のプロパティで調整できます`,
            );
            setEditingBlock(null);
        } else {
            // 新規大問の配置
            const newBlock = createQuestionBlock(
                cfg,
                Math.round(50 / GRID_CELL_SIZE_PX.x) * GRID_CELL_SIZE_PX.x,
                Math.round(100 / GRID_CELL_SIZE_PX.y) * GRID_CELL_SIZE_PX.y,
            );
            canvas.add(newBlock);
            setQuestionBlockCount((count) => count + 1);
            selectEditableBlock(newBlock, { openPanel: true });
            showToast(
                `大問 ${cfg.num} を用紙に追加しました。右のプロパティで調整できます`,
            );
        }
    };

    // サイドパネルからのプロパティ更新（置換時に selection:cleared でパネルが閉じないよう抑制）
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

    const handleUpdateSelectedQuestion = useCallback(
        (cfg: QuestionBlockConfig) => {
            replaceSelectedBlock((left, top) =>
                createQuestionBlock(cfg, left, top),
            );
        },
        [replaceSelectedBlock],
    );

    const handleUpdateSelectedExamHeader = useCallback(
        (cfg: ExamHeaderConfig) => {
            replaceSelectedBlock((left, top) =>
                createExamHeaderBlock(cfg, left, top),
            );
        },
        [replaceSelectedBlock],
    );

    const handleUpdateSelectedNamebox = useCallback(
        (cfg: NameboxConfig) => {
            replaceSelectedBlock((left, top) =>
                createNameboxBlock(cfg, left, top),
            );
        },
        [replaceSelectedBlock],
    );

    const handleUpdateSelectedScoreTable = useCallback(
        (cfg: ScoreTableConfig) => {
            replaceSelectedBlock((left, top) =>
                createScoreTableBlock(cfg, left, top),
            );
        },
        [replaceSelectedBlock],
    );

    // プロパティパネルを開く（選択中の枠を編集）
    const handleTogglePropertyPanel = useCallback(() => {
        if (!selectedBlockRef.current) {
            showToast("編集する枠を選択してください");
            return;
        }
        setIsPropertyPanelOpen((open) => !open);
    }, [showToast]);

    // プロパティパネルを閉じる（キャンバス上の選択は維持）
    const handleClosePropertyPanel = useCallback(() => {
        setIsPropertyPanelOpen(false);
    }, []);

    // 観点記号一括置換の適用
    const handleApplyBatchReplace = (target: string, newText: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !target) return;

        let replaceCount = 0;
        const objects = canvas
            .getObjects()
            .filter(
                (o): o is CustomQuestionBlockGroup =>
                    (o as CustomQuestionBlockGroup).customType ===
                    "question-block",
            );

        objects.forEach((obj) => {
            if (
                obj.questionConfig &&
                obj.questionConfig.rubric.includes(target)
            ) {
                obj.questionConfig.rubric =
                    obj.questionConfig.rubric.replaceAll(target, newText);
                replaceCount++;

                const left = obj.left || 40;
                const top = obj.top || 40;
                const cfg = obj.questionConfig;
                canvas.remove(obj);

                const newBlock = createQuestionBlock(cfg, left, top);
                canvas.add(newBlock);
            }
        });

        if (replaceCount > 0) {
            canvas.requestRenderAll();
            showToast(`${replaceCount}件の大問の観点記号を置換しました`);
        } else {
            showToast("対象の観点記号が見つかりませんでした");
        }
    };

    // 基本パーツ追加
    const handleAddHeader = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const group = createExamHeaderBlock(DEFAULT_EXAM_HEADER_CONFIG, 40, 40);
        canvas.add(group);
        selectEditableBlock(group, { openPanel: true });
        showToast("考査見出し枠を追加しました");
    };

    const handleAddNamebox = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const group = createNameboxBlock(DEFAULT_NAMEBOX_CONFIG, 350, 90);
        canvas.add(group);
        selectEditableBlock(group, { openPanel: true });
        showToast("年組氏名欄を追加しました");
    };

    const handleAddScoretable = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const group = createScoreTableBlock(
            DEFAULT_SCORE_TABLE_CONFIG,
            1080,
            860,
        );
        canvas.add(group);
        selectEditableBlock(group, { openPanel: true });
        showToast("観点別得点枠を追加しました");
    };

    // 複製
    const handleClone = () => {
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject() as
            | CustomQuestionBlockGroup
            | undefined;
        if (!canvas || !activeObj) return;

        activeObj.clone((cloned: CustomQuestionBlockGroup) => {
            cloned.set({
                left: (activeObj.left || 0) + GRID_CELL_SIZE_PX.x,
                top: (activeObj.top || 0) + GRID_CELL_SIZE_PX.y,
                evented: true,
            });
            if (activeObj.customType) cloned.customType = activeObj.customType;
            if (activeObj.questionConfig) {
                cloned.questionConfig = JSON.parse(
                    JSON.stringify(activeObj.questionConfig),
                );
            }
            canvas.add(cloned);
            if (cloned.customType === "question-block") {
                setQuestionBlockCount((count) => count + 1);
            }
            selectEditableBlock(cloned as CustomFabricBlock, {
                openPanel: true,
            });
            showToast("枠を複製しました");
        });
    };

    // 削除
    const handleDelete = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            canvas.discardActiveObject();
            activeObjects.forEach((obj) => canvas.remove(obj));
            setQuestionBlockCount(
                canvas
                    .getObjects()
                    .filter(
                        (obj) =>
                            (obj as CustomFabricBlock).customType ===
                            "question-block",
                    ).length,
            );
            setSelectedBlock(null);
            selectedBlockRef.current = null;
            setIsPropertyPanelOpen(false);
            canvas.requestRenderAll();
            showToast("選択枠を削除しました");
        }
    };

    // 白紙に戻す
    const handleClear = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        if (window.confirm("すべての要素を削除し、白紙に戻しますか？")) {
            canvas.clear();
            setQuestionBlockCount(0);
            setIsPropertyPanelOpen(false);
            canvas.requestRenderAll();
            showToast("白紙に戻しました");
        }
    };

    // PDF B4横
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

    // PDF A4分割
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

    // Word形式
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

    return (
        <div className="h-screen bg-slate-100 text-slate-800 flex flex-col overflow-hidden font-sans">
            {/* アプリヘッダー */}
            <header className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded transition border border-slate-700 flex items-center gap-1"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        CSVプレビュー
                    </Link>

                    <div className="h-4 w-px bg-slate-700"></div>

                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-xs">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-wide flex items-center gap-2">
                                <span>定期考査 解答用紙エディタ</span>
                                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-normal">
                                    B4横 (364×257mm)
                                </span>
                            </h1>
                        </div>
                    </div>
                </div>
                {/* 右側アクションボタン */}
                <div className="flex flex-1 items-center gap-3 min-w-0 justify-end">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsReplaceModalOpen(true)}
                            className="px-1 py-1 text-xs font-medium text-slate-400 hover:text-white transition"
                        >
                            観点記号の一括置換
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-1 py-1 text-[11px] text-slate-500 hover:text-red-300 transition"
                        >
                            白紙に戻す
                        </button>
                    </div>

                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500">出力</span>
                        {/* PDF保存ドロップダウン */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsPdfDropdownOpen(!isPdfDropdownOpen)
                                }
                                disabled={isExporting}
                            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded text-white shadow-xs transition flex items-center gap-1.5"
                            >
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>PDFに保存</span>
                                <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {isPdfDropdownOpen && (
                                <div className="absolute right-0 mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        type="button"
                                        onClick={handleExportPdfB4}
                                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-slate-800 font-medium flex items-center justify-between"
                                    >
                                        <span>B4横 (原寸1枚) PDF</span>
                                    <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                                            推奨
                                        </span>
                                    </button>
                                    <div className="border-t border-slate-200 my-0.5"></div>
                                    <button
                                        type="button"
                                        onClick={handleExportPdfSplit}
                                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-slate-800 font-medium"
                                    >
                                        A4分割 (左面・右面2ページ) PDF
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Word形式保存 */}
                        <button
                            type="button"
                            onClick={handleExportWord}
                            disabled={isExporting}
                            className="px-3.5 py-1.5 text-xs font-semibold border border-blue-400 text-blue-100 hover:bg-blue-900/50 disabled:opacity-50 rounded transition flex items-center gap-1.5"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span>Word形式 (.docx) で保存</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ツールバー */}
            <EditorToolbar
                onOpenQuestionModal={() => {
                    setEditingBlock(null);
                    setIsQuestionModalOpen(true);
                }}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onAddHeader={handleAddHeader}
                onAddNamebox={handleAddNamebox}
                onAddScoretable={handleAddScoretable}
                onClone={handleClone}
                onDelete={handleDelete}
                hasEditableSelection={selectedBlock !== null}
                isPropertyPanelOpen={isPropertyPanelOpen}
                onTogglePropertyPanel={handleTogglePropertyPanel}
                isGridVisible={isGridVisible}
                onToggleGrid={handleToggleGrid}
                isSnapEnabled={isSnapEnabled}
                onToggleSnap={handleToggleSnap}
                isAlignmentGuidesEnabled={isAlignmentGuidesEnabled}
                onToggleAlignmentGuides={handleToggleAlignmentGuides}
                isMarginGuidesVisible={isMarginGuidesVisible}
                onToggleMarginGuides={setIsMarginGuidesVisible}
                paperMargins={paperMargins}
                onPaperMarginsChange={setPaperMargins}
                zoomLevel={zoomLevel}
                onZoomIn={() => applyZoom(zoomLevel + 0.1)}
                onZoomOut={() => applyZoom(zoomLevel - 0.1)}
                onZoomFit={fitCanvasToScreen}
            />

            {/* メイン編集エリア（キャンバス + プロパティパネル） */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* キャンバスワークスペース */}
                <div
                    ref={containerWrapRef}
                    className="flex-1 overflow-auto bg-slate-200 p-6 flex items-start justify-center relative"
                    onClick={() => setIsPdfDropdownOpen(false)}
                >
                    <div
                        className="relative inline-block transition-all"
                        style={{
                            width: `${b4Config.widthPx * zoomLevel}px`,
                            height: `${b4Config.heightPx * zoomLevel}px`,
                        }}
                    >
                        {/* Fabric.js Canvas */}
                        <div
                            ref={fabricHostRef}
                            className={`fabric-canvas-host canvas-shadow rounded-none ${isGridVisible ? "grid-active" : "bg-white"}`}
                            style={gridHostStyle}
                        />

                        {/* 中央折り目 / A4分割ガイドライン */}
                        <div
                            className="absolute top-0 bottom-0 left-1/2 w-0 border-r-2 border-dashed border-indigo-400/70 pointer-events-none z-10"
                            style={{ transform: "translateX(-1px)" }}
                        />
                        {/* 余白ガイド（編集用・PDF非出力） */}
                        {isMarginGuidesVisible && (
                            <>
                                {[
                                    marginGuideLines.outerLeft,
                                    marginGuideLines.foldLeft,
                                    marginGuideLines.foldRight,
                                    marginGuideLines.outerRight,
                                ].map((left, index) => (
                                    <div
                                        key={`margin-v-${index}`}
                                        className="absolute top-0 bottom-0 w-0 border-r border-dashed border-amber-400/70 pointer-events-none z-10"
                                        style={{
                                            left: `${(left / b4Config.widthPx) * 100}%`,
                                        }}
                                    />
                                ))}
                                <div
                                    className="absolute left-0 right-0 h-0 border-t border-dashed border-amber-400/70 pointer-events-none z-10"
                                    style={{
                                        top: `${(marginGuideLines.top / b4Config.heightPx) * 100}%`,
                                    }}
                                />
                                <div
                                    className="absolute left-0 right-0 h-0 border-t border-dashed border-amber-400/70 pointer-events-none z-10"
                                    style={{
                                        top: `${(marginGuideLines.bottom / b4Config.heightPx) * 100}%`,
                                    }}
                                />
                            </>
                        )}

                        {!hasQuestionBlock && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                <div className="pointer-events-auto max-w-sm rounded-xl border border-indigo-200 bg-white/95 p-5 text-center shadow-lg">
                                    <p className="text-sm font-bold text-slate-800">
                                        解答用紙を作成しましょう
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                        大問を追加して配置を整えたら、PDFまたはWordで保存できます。
                                    </p>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                                        <div className="rounded border border-slate-200 bg-slate-50 p-2">
                                            <span className="block text-sm font-bold text-indigo-600">
                                                1
                                            </span>
                                            大問を作成
                                        </div>
                                        <div className="rounded border border-slate-200 bg-slate-50 p-2">
                                            <span className="block text-sm font-bold text-indigo-600">
                                                2
                                            </span>
                                            配置・調整
                                        </div>
                                        <div className="rounded border border-slate-200 bg-slate-50 p-2">
                                            <span className="block text-sm font-bold text-indigo-600">
                                                3
                                            </span>
                                            保存
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingBlock(null);
                                            setIsQuestionModalOpen(true);
                                        }}
                                        className="mt-4 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
                                    >
                                        大問を作成・追加
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* プロパティ編集サイドパネル（選択時に自動表示） */}
                {isPropertyPanelOpen && selectedBlock && (
                    <QuestionBlockPropertyPanel
                        selectedBlock={selectedBlock}
                        onUpdateQuestion={handleUpdateSelectedQuestion}
                        onUpdateExamHeader={handleUpdateSelectedExamHeader}
                        onUpdateNamebox={handleUpdateSelectedNamebox}
                        onUpdateScoreTable={handleUpdateSelectedScoreTable}
                        onClose={handleClosePropertyPanel}
                    />
                )}
            </div>

            {/* モーダル群 */}
            <QuestionEditModal
                isOpen={isQuestionModalOpen}
                initialConfig={editingBlock?.questionConfig || null}
                onClose={() => {
                    setIsQuestionModalOpen(false);
                    setEditingBlock(null);
                }}
                onApply={handleApplyQuestionConfig}
            />

            <ImportTextModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onApply={handleApplyQuestionConfig}
            />

            <BatchReplaceModal
                isOpen={isReplaceModalOpen}
                onClose={() => setIsReplaceModalOpen(false)}
                onApply={handleApplyBatchReplace}
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
