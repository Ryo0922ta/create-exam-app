import { PaperSize, PaperSizeConfig } from "@/types/editor";

export const PAPER_SIZES: Record<PaperSize, PaperSizeConfig> = {
    A4: {
        name: "A4",
        label: "A4 (210 × 297 mm)",
        widthPx: 794,
        heightPx: 1123,
        pdfWidthPt: 595.28,
        pdfHeightPt: 841.89,
    },
    B4: {
        name: "B4",
        label: "B4 (257 × 364 mm)",
        widthPx: 971,
        heightPx: 1376,
        pdfWidthPt: 728.5,
        pdfHeightPt: 1031.8,
    },
};

export const DEFAULT_PAPER_SIZE: PaperSize = "A4";
