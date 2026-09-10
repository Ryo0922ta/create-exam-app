import { PaperSize, PaperSizeConfig } from "@/types/editor";

export const PAPER_SIZES: Record<PaperSize, PaperSizeConfig> = {
    B4_LANDSCAPE: {
        name: "B4_LANDSCAPE",
        label: "B4横 (364 × 257 mm)",
        widthPx: 1376,
        heightPx: 972,
        pdfWidthPt: 1031.8,
        pdfHeightPt: 728.5,
    },
    A4: {
        name: "A4",
        label: "A4縦 (210 × 297 mm)",
        widthPx: 794,
        heightPx: 1123,
        pdfWidthPt: 595.28,
        pdfHeightPt: 841.89,
    },
    B4: {
        name: "B4",
        label: "B4縦 (257 × 364 mm)",
        widthPx: 971,
        heightPx: 1376,
        pdfWidthPt: 728.5,
        pdfHeightPt: 1031.8,
    },
};

export const DEFAULT_PAPER_SIZE: PaperSize = "B4_LANDSCAPE";

export const B4_LANDSCAPE_MM = { width: 364, height: 257 };

export function mmToPx(mm: number, axis: "x" | "y"): number {
    const b4 = PAPER_SIZES.B4_LANDSCAPE;
    const mmSize =
        axis === "x" ? B4_LANDSCAPE_MM.width : B4_LANDSCAPE_MM.height;
    const pxSize = axis === "x" ? b4.widthPx : b4.heightPx;
    return mm * (pxSize / mmSize);
}

/** 方眼グリッド1マスの実寸（余白ガイド5mm時の角マスと同じ） */
export const GRID_CELL_MM = 5;

/** 太線方眼のマス数（5マス = 25mm） */
export const GRID_MAJOR_CELL_COUNT = 5;

/** 方眼スナップ間隔（px・用紙座標系）。横方向の5mm相当 */
export const GRID_SNAP_SIZE = mmToPx(GRID_CELL_MM, "x");

export function getGridCellSizePx(axis: "x" | "y"): number {
    return mmToPx(GRID_CELL_MM, axis);
}

export const SECTION_STANDARD_WIDTH = 630;

export const QUESTION_BLOCK_WIDTH_LIMITS = {
    min: 200,
    max: 1200,
} as const;

export function clampQuestionBlockWidth(width: number): number {
    const { min, max } = QUESTION_BLOCK_WIDTH_LIMITS;
    return Math.min(max, Math.max(min, Math.round(width) || SECTION_STANDARD_WIDTH));
}
