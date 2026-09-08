"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { fabric } from "fabric";
import { PaperSize, ShortAnswerOptions } from "@/types/editor";
import { PAPER_SIZES, DEFAULT_PAPER_SIZE } from "@/lib/editor/paperSizes";
import {
    createShortAnswerBlock,
    createHeaderBlock,
    createTitleBlock,
    createEssayBlock,
    createCharGridBlock,
    loadSampleLayout,
    CustomFabricObject,
} from "@/lib/editor/fabricBlocks";
import { exportCanvasToPdf } from "@/lib/editor/exportPdf";
import { EditorToolbar } from "./EditorToolbar";

export const AnswerSheetCanvasEditor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    const [paperSize, setPaperSize] = useState<PaperSize>(DEFAULT_PAPER_SIZE);
    const [selectedInfo, setSelectedInfo] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => (current === msg ? null : current));
        }, 2500);
    }, []);

    // 選択オブジェクトの監視コールバック
    const updateSelection = useCallback(() => {
        const active = fabricCanvasRef.current?.getActiveObject() as
            | CustomFabricObject
            | undefined;
        if (active) {
            setSelectedInfo(active.customType || "パーツ");
        } else {
            setSelectedInfo(null);
        }
    }, []);

    // Fabric Canvas の初期化
    useEffect(() => {
        if (!canvasRef.current) return;

        const sizeConfig = PAPER_SIZES[paperSize];
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: sizeConfig.widthPx,
            height: sizeConfig.heightPx,
            backgroundColor: "#ffffff",
            selection: true,
            preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        canvas.on("selection:created", updateSelection);
        canvas.on("selection:updated", updateSelection);
        canvas.on("selection:cleared", updateSelection);

        // 初回サンプル読み込み
        loadSampleLayout(canvas);

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 用紙サイズ切り替え時のキャンバスサイズ反映
    const handlePaperSizeChange = (newSize: PaperSize) => {
        setPaperSize(newSize);
        const canvas = fabricCanvasRef.current;
        if (canvas) {
            const sizeConfig = PAPER_SIZES[newSize];
            canvas.setWidth(sizeConfig.widthPx);
            canvas.setHeight(sizeConfig.heightPx);
            canvas.renderAll();
            showToast(`用紙サイズを ${newSize} に変更しました`);
        }
    };

    // キーボードショートカット (Delete / Backspace)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isInputFocused =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement;

            if (isInputFocused) return;

            if (e.key === "Delete" || e.key === "Backspace") {
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;

                const activeObj = canvas.getActiveObject() as
                    | fabric.IText
                    | fabric.Object
                    | undefined;
                if (
                    activeObj &&
                    !("isEditing" in activeObj && activeObj.isEditing)
                ) {
                    const activeObjects = canvas.getActiveObjects();
                    canvas.discardActiveObject();
                    activeObjects.forEach((obj) => canvas.remove(obj));
                    canvas.renderAll();
                    showToast("削除しました");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showToast]);

    // 各パーツ追加ハンドラー
    const handleAddShortAnswer = (options: ShortAnswerOptions) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const block = createShortAnswerBlock({
            ...options,
            left: 50,
            top: 200,
        });
        canvas.add(block);
        canvas.setActiveObject(block);
        canvas.renderAll();
        showToast("短答欄を追加しました");
    };

    const handleAddEssay = (lines: number) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const block = createEssayBlock({ lines, left: 50, top: 380 });
        canvas.add(block);
        canvas.setActiveObject(block);
        canvas.renderAll();
        showToast(`記述欄(${lines}行)を追加しました`);
    };

    const handleAddCharGrid = (chars: number) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const block = createCharGridBlock({ chars, left: 50, top: 460 });
        canvas.add(block);
        canvas.setActiveObject(block);
        canvas.renderAll();
        showToast(`マス目(${chars}字)を追加しました`);
    };

    const handleAddTitle = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const title = createTitleBlock({
            text: "社会科の復習",
            left: 50,
            top: 60,
        });
        canvas.add(title);
        canvas.setActiveObject(title);
        canvas.renderAll();
        showToast("タイトルを追加しました（ダブルクリックで編集可能）");
    };

    const handleAddHeader = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const header = createHeaderBlock({ left: 230, top: 75 });
        canvas.add(header);
        canvas.setActiveObject(header);
        canvas.renderAll();
        showToast("年組氏名・得点欄を追加しました");
    };

    // オブジェクト操作
    const handleBringToFront = () => {
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (activeObj) {
            activeObj.bringToFront();
            canvas?.renderAll();
        }
    };

    const handleSendToBack = () => {
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (activeObj) {
            activeObj.sendToBack();
            canvas?.renderAll();
        }
    };

    const handleDuplicate = () => {
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject() as
            | CustomFabricObject
            | undefined;
        if (!canvas || !activeObj) return;

        activeObj.clone((cloned: CustomFabricObject) => {
            canvas.discardActiveObject();
            cloned.set({
                left: (cloned.left || 0) + 15,
                top: (cloned.top || 0) + 15,
                evented: true,
            });
            cloned.customType = activeObj.customType;

            if (cloned.type === "activeSelection") {
                const selection = cloned as fabric.ActiveSelection;
                selection.canvas = canvas;
                selection.forEachObject((obj) => canvas.add(obj));
                selection.setCoords();
            } else {
                canvas.add(cloned);
            }
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            showToast("複製しました");
        });
    };

    const handleDelete = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            canvas.discardActiveObject();
            activeObjects.forEach((obj) => canvas.remove(obj));
            canvas.renderAll();
            showToast("削除しました");
        }
    };

    const handleClear = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        if (window.confirm("キャンバス上のすべてのパーツを消去しますか？")) {
            canvas.clear();
            canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
            showToast("キャンバスを全消去しました");
        }
    };

    const handleRestoreSample = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        loadSampleLayout(canvas);
        showToast("サンプルレイアウトを復元しました");
    };

    // PDF出力
    const handleExportPdf = async () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || isExportingPdf) return;

        setIsExportingPdf(true);
        try {
            await exportCanvasToPdf(canvas, paperSize);
            showToast(`${paperSize} サイズのPDFを出力しました`);
        } catch (error) {
            showToast(
                `PDF出力に失敗しました: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        } finally {
            setIsExportingPdf(false);
        }
    };

    const currentPaper = PAPER_SIZES[paperSize];

    return (
        <div className="min-h-screen bg-slate-200 flex flex-col text-slate-800 antialiased">
            {/* ヘッダー */}
            <header className="bg-slate-800 text-white shadow-md z-20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 rounded transition flex items-center gap-1"
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
                        CSVプレビューへ戻る
                    </Link>
                    <div className="h-4 w-px bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg text-white font-bold flex items-center justify-center shadow-inner">
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
                            <h1 className="text-sm md:text-base font-bold leading-tight">
                                解答用紙エディタ
                            </h1>
                            <p className="text-xs text-slate-400 hidden sm:block">
                                ドラッグ＆ドロップで自由配置・PDF出力
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="bg-slate-700/70 px-2 py-0.5 rounded font-mono">
                        {currentPaper.label} ({currentPaper.widthPx} ×{" "}
                        {currentPaper.heightPx} px)
                    </span>
                </div>
            </header>

            {/* 操作ツールバー */}
            <EditorToolbar
                paperSize={paperSize}
                onPaperSizeChange={handlePaperSizeChange}
                onAddShortAnswer={handleAddShortAnswer}
                onAddEssay={handleAddEssay}
                onAddCharGrid={handleAddCharGrid}
                onAddTitle={handleAddTitle}
                onAddHeader={handleAddHeader}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onClear={handleClear}
                onRestoreSample={handleRestoreSample}
                onExportPdf={handleExportPdf}
                isExportingPdf={isExportingPdf}
                selectedInfo={selectedInfo}
            />

            {/* キャンバスワークスペース */}
            <main className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start">
                <div
                    className="bg-white shadow-2xl rounded-sm border border-slate-300 relative transition-all"
                    style={{
                        width: `${currentPaper.widthPx}px`,
                        height: `${currentPaper.heightPx}px`,
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={currentPaper.widthPx}
                        height={currentPaper.heightPx}
                    />
                </div>
            </main>

            {/* トースト通知 */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 bg-slate-900/90 backdrop-blur-sm text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl transition-all duration-300 z-50 animate-bounce">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};
