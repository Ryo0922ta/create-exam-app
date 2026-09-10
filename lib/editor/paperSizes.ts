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
export const GRID_SNAP_SIZE = 20;
export const SECTION_STANDARD_WIDTH = 610;
