"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { fabric } from "fabric";
import { QuestionBlockConfig } from "@/types/editor";
import {
    PAPER_SIZES,
    GRID_SNAP_SIZE,
    SECTION_STANDARD_WIDTH,
} from "@/lib/editor/paperSizes";
import {
    createQuestionBlock,
    CustomQuestionBlockGroup,
} from "@/lib/editor/questionBlockBuilder";
import { exportB4LandscapePdf, exportA4SplitPdf } from "@/lib/editor/exportPdf";
import { exportB4WordDocx } from "@/lib/editor/exportWord";
import {
    computeAlignmentSnap,
    clearAlignmentGuides,
    isAlignmentGuide,
    renderAlignmentGuides,
} from "@/lib/editor/alignmentGuides";
import { EditorToolbar } from "./EditorToolbar";
import { QuestionEditModal } from "./modals/QuestionEditModal";
import { ImportTextModal } from "./modals/ImportTextModal";
import { BatchReplaceModal } from "./modals/BatchReplaceModal";

export const AnswerSheetCanvasEditor: React.FC = () => {
    const fabricHostRef = useRef<HTMLDivElement | null>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const containerWrapRef = useRef<HTMLDivElement | null>(null);
    const snapEnabledRef = useRef(true);
    const alignmentGuidesEnabledRef = useRef(true);

    // モーダル表示状態
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] =
        useState<CustomQuestionBlockGroup | null>(null);

    // グリッド・スナップ・ズーム
    const [isGridVisible, setIsGridVisible] = useState(true);
    const [isSnapEnabled, setIsSnapEnabled] = useState(true);
    const [isAlignmentGuidesEnabled, setIsAlignmentGuidesEnabled] =
        useState(true);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => (current === msg ? null : current));
        }, 2500);
    }, []);

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

    // サンプル初期配置
    const setupInitialSampleLayout = (canvas: fabric.Canvas) => {
        // 1. 考査見出し枠
        const headerItems: fabric.Object[] = [];
        headerItems.push(
            new fabric.Rect({
                left: 0,
                top: 0,
                width: SECTION_STANDARD_WIDTH,
                height: 40,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        headerItems.push(
            new fabric.Text(
                "令和○年度　○学期考査　○年　○○○　解答用紙　令和○年　○月○日　(○)　○限目実施",
                {
                    left: 10,
                    top: 12,
                    fontFamily: "'Noto Serif JP', serif",
                    fontSize: 13,
                    fontWeight: "bold",
                    fill: "#000000",
                },
            ),
        );
        const headerGroup = new fabric.Group(headerItems, {
            left: 40,
            top: 40,
            selectable: true,
            evented: true,
        });
        canvas.add(headerGroup);

        // 2. 年組氏名枠
        const nameItems: fabric.Object[] = [];
        const nw = 300;
        const nh = 40;
        nameItems.push(
            new fabric.Rect({
                left: 0,
                top: 0,
                width: nw,
                height: nh,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        nameItems.push(
            new fabric.Line([40, 0, 40, nh], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        nameItems.push(
            new fabric.Line([80, 0, 80, nh], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        nameItems.push(
            new fabric.Line([120, 0, 120, nh], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        nameItems.push(
            new fabric.Text("○年", {
                left: 10,
                top: 12,
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        nameItems.push(
            new fabric.Text("組", {
                left: 52,
                top: 12,
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        nameItems.push(
            new fabric.Text("番", {
                left: 92,
                top: 12,
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        nameItems.push(
            new fabric.Text("氏名", {
                left: 132,
                top: 12,
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        const nameGroup = new fabric.Group(nameItems, {
            left: 350,
            top: 90,
            selectable: true,
            evented: true,
        });
        canvas.add(nameGroup);

        // 3. 大問 1
        const q1 = createQuestionBlock(
            {
                num: "1",
                rubric: "○・△・×",
                points: "各問2点/10点",
                pattern: "sub_parens",
                subRows: 2,
                subCols: 3,
                subRowHeight: 34,
                subLabels: ["(1)", "(2)", "(3)", "(4)", "(5)"],
                gridRows: 2,
                gridCols: 4,
                gridRowHeight: 32,
                circleRows: 1,
                circleCols: 5,
                circleCount: 5,
                circleHeight: 32,
                circleCommaEnabled: false,
                circleCommaCount: 1,
                circleCommaPaddingAuto: true,
                splitRatio: "50:50",
                splitHeight: 38,
            },
            40,
            160,
        );
        canvas.add(q1);

        // 4. 大問 2
        const q2 = createQuestionBlock(
            {
                num: "2",
                rubric: "知識・技能",
                points: "各問2点/10点",
                pattern: "circle_comma",
                subRows: 2,
                subCols: 3,
                subRowHeight: 34,
                subLabels: [],
                gridRows: 2,
                gridCols: 4,
                gridRowHeight: 32,
                circleRows: 1,
                circleCols: 5,
                circleCount: 5,
                circleHeight: 32,
                circleCommaEnabled: false,
                circleCommaCount: 1,
                circleCommaPaddingAuto: true,
                splitRatio: "50:50",
                splitHeight: 38,
            },
            40,
            280,
        );
        canvas.add(q2);

        // 5. 大問 3 (右面)
        const q3 = createQuestionBlock(
            {
                num: "3",
                rubric: "思考・判断・表現",
                points: "15点",
                pattern: "split_2",
                subRows: 2,
                subCols: 3,
                subRowHeight: 34,
                subLabels: [],
                gridRows: 2,
                gridCols: 4,
                gridRowHeight: 32,
                circleRows: 1,
                circleCols: 5,
                circleCount: 5,
                circleHeight: 32,
                circleCommaEnabled: false,
                circleCommaCount: 1,
                circleCommaPaddingAuto: true,
                splitRatio: "30:70",
                splitHeight: 60,
            },
            720,
            40,
        );
        canvas.add(q3);

        // 6. 得点欄 (右面下部)
        const scoreItems: fabric.Object[] = [];
        const sw = 240;
        const sh = 60;
        scoreItems.push(
            new fabric.Rect({
                left: 0,
                top: 0,
                width: sw,
                height: sh,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        scoreItems.push(
            new fabric.Line([0, 30, sw, 30], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        scoreItems.push(
            new fabric.Line([80, 0, 80, sh], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        scoreItems.push(
            new fabric.Line([160, 0, 160, sh], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        scoreItems.push(
            new fabric.Text("知・技", {
                left: 40,
                top: 8,
                originX: "center",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        scoreItems.push(
            new fabric.Text("思・判・表", {
                left: 120,
                top: 8,
                originX: "center",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        scoreItems.push(
            new fabric.Text("合計", {
                left: 200,
                top: 8,
                originX: "center",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        scoreItems.push(
            new fabric.Text("/50", {
                left: 75,
                top: 40,
                originX: "right",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        scoreItems.push(
            new fabric.Text("/50", {
                left: 155,
                top: 40,
                originX: "right",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        scoreItems.push(
            new fabric.Text("/100", {
                left: 235,
                top: 40,
                originX: "right",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        const scoreGroup = new fabric.Group(scoreItems, {
            left: 1080,
            top: 860,
            selectable: true,
            evented: true,
        });
        canvas.add(scoreGroup);

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

        // 方眼グリッドは Fabric 外側のホスト div に表示
        host.classList.add("grid-active");

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
                const result = computeAlignmentSnap(
                    obj,
                    refs,
                    b4.widthPx,
                    b4.heightPx,
                    canvas.getZoom(),
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
                        Math.round(left / GRID_SNAP_SIZE) * GRID_SNAP_SIZE;
                }
                if (!snappedY) {
                    top = Math.round(top / GRID_SNAP_SIZE) * GRID_SNAP_SIZE;
                }
            }

            obj.set({ left, top });
            obj.setCoords();
        });

        const handleClearGuides = () => clearAlignmentGuides(canvas);
        canvas.on("mouse:up", handleClearGuides);
        canvas.on("object:modified", handleClearGuides);
        canvas.on("selection:cleared", handleClearGuides);

        // ダブルクリックで大問編集
        canvas.on("mouse:dblclick", (e) => {
            const target = e.target as CustomQuestionBlockGroup | undefined;
            if (
                target &&
                target.customType === "question-block" &&
                target.questionConfig
            ) {
                setEditingBlock(target);
                setIsQuestionModalOpen(true);
            }
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
        const host = fabricHostRef.current;
        if (!host) return;
        if (visible) {
            host.classList.add("grid-active");
            host.classList.remove("bg-white");
        } else {
            host.classList.remove("grid-active");
            host.classList.add("bg-white");
        }
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
            canvas.setActiveObject(newBlock);
            canvas.requestRenderAll();
            showToast(`大問 ${cfg.num} を更新しました`);
            setEditingBlock(null);
        } else {
            // 新規大問の配置
            const newBlock = createQuestionBlock(
                cfg,
                Math.round(50 / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
                Math.round(100 / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
            );
            canvas.add(newBlock);
            canvas.setActiveObject(newBlock);
            canvas.requestRenderAll();
            showToast(`大問 ${cfg.num} を用紙に追加しました`);
        }
    };

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
        const items: fabric.Object[] = [];
        items.push(
            new fabric.Rect({
                left: 0,
                top: 0,
                width: SECTION_STANDARD_WIDTH,
                height: 40,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Text(
                "令和○年度　○学期考査　○年　○○○　解答用紙　令和○年　○月○日　(○)　○限目実施",
                {
                    left: 10,
                    top: 12,
                    fontFamily: "'Noto Serif JP', serif",
                    fontSize: 13,
                    fontWeight: "bold",
                    fill: "#000000",
                },
            ),
        );
        const group = new fabric.Group(items, { left: 40, top: 40 });
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        showToast("考査見出し枠を追加しました");
    };

    const handleAddNamebox = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const items: fabric.Object[] = [];
        const w = 300;
        const h = 40;
        items.push(
            new fabric.Rect({
                left: 0,
                top: 0,
                width: w,
                height: h,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Line([40, 0, 40, h], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Line([80, 0, 80, h], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Line([120, 0, 120, h], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Text("○年", {
                left: 10,
                top: 12,
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text("組", {
                left: 52,
                top: 12,
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text("番", {
                left: 92,
                top: 12,
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text("氏名", {
                left: 132,
                top: 12,
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        const group = new fabric.Group(items, { left: 350, top: 90 });
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        showToast("年組氏名欄を追加しました");
    };

    const handleAddScoretable = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const items: fabric.Object[] = [];
        const w = 240;
        const h = 60;
        items.push(
            new fabric.Rect({
                left: 0,
                top: 0,
                width: w,
                height: h,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Line([0, 30, w, 30], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Line([80, 0, 80, h], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Line([160, 0, 160, h], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Text("知・技", {
                left: 40,
                top: 8,
                originX: "center",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text("思・判・表", {
                left: 120,
                top: 8,
                originX: "center",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text("合計", {
                left: 200,
                top: 8,
                originX: "center",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text("/50", {
                left: 75,
                top: 40,
                originX: "right",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text("/50", {
                left: 155,
                top: 40,
                originX: "right",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text("/100", {
                left: 235,
                top: 40,
                originX: "right",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        const group = new fabric.Group(items, { left: 1080, top: 860 });
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
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
                left: (activeObj.left || 0) + GRID_SNAP_SIZE,
                top: (activeObj.top || 0) + GRID_SNAP_SIZE,
                evented: true,
            });
            if (activeObj.customType) cloned.customType = activeObj.customType;
            if (activeObj.questionConfig) {
                cloned.questionConfig = JSON.parse(
                    JSON.stringify(activeObj.questionConfig),
                );
            }
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
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
                            <p className="text-[11px] text-slate-400 hidden sm:block">
                                大問ブロック配置・問題文自動解析・PDF/Word出力
                            </p>
                        </div>
                    </div>
                </div>

                {/* 右側アクションボタン */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsReplaceModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 rounded text-white shadow-xs transition flex items-center gap-1"
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
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                        </svg>
                        観点記号の一括置換
                    </button>

                    <div className="h-4 w-px bg-slate-700 mx-1"></div>

                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-red-700 text-slate-300 hover:text-white rounded border border-slate-700 transition"
                    >
                        白紙に戻す
                    </button>

                    {/* PDF保存ドロップダウン */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() =>
                                setIsPdfDropdownOpen(!isPdfDropdownOpen)
                            }
                            disabled={isExporting}
                            className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 rounded text-white shadow-xs transition flex items-center gap-1.5"
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
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-slate-800 font-medium flex items-center justify-between"
                                >
                                    <span>B4横 (原寸1枚) PDF</span>
                                    <span className="text-[10px] text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded font-bold">
                                        推奨
                                    </span>
                                </button>
                                <div className="border-t border-slate-200 my-0.5"></div>
                                <button
                                    type="button"
                                    onClick={handleExportPdfSplit}
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-slate-800 font-medium"
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
                        className="px-3.5 py-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-600 disabled:bg-blue-400 rounded text-white shadow-xs transition flex items-center gap-1.5"
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
                isGridVisible={isGridVisible}
                onToggleGrid={handleToggleGrid}
                isSnapEnabled={isSnapEnabled}
                onToggleSnap={handleToggleSnap}
                isAlignmentGuidesEnabled={isAlignmentGuidesEnabled}
                onToggleAlignmentGuides={handleToggleAlignmentGuides}
                zoomLevel={zoomLevel}
                onZoomIn={() => applyZoom(zoomLevel + 0.1)}
                onZoomOut={() => applyZoom(zoomLevel - 0.1)}
                onZoomFit={fitCanvasToScreen}
            />

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
                        className="fabric-canvas-host canvas-shadow rounded-none grid-active"
                    />

                    {/* 中央折り目 / A4分割ガイドライン */}
                    <div
                        className="absolute top-0 bottom-0 left-1/2 w-0 border-r-2 border-dashed border-indigo-400/70 pointer-events-none z-10"
                        style={{ transform: "translateX(-1px)" }}
                    />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-90 flex items-center gap-1.5 text-[11px] text-slate-600 bg-white/95 px-3 py-0.5 rounded-full border border-slate-300 shadow-xs z-10">
                        <span>← 左面 (A4)</span>
                        <span className="font-bold text-indigo-700">
                            | B4中央折り目 |
                        </span>
                        <span>右面 (A4) →</span>
                    </div>
                </div>
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
