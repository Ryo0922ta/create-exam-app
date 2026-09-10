import { PaperMargins } from "@/types/editor";
import { mmToPx } from "@/lib/editor/paperSizes";

export interface MarginGuideLines {
    top: number;
    bottom: number;
    outerLeft: number;
    foldLeft: number;
    foldRight: number;
    outerRight: number;
}

export interface MarginFaceRegion {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface MarginRegions {
    leftFace: MarginFaceRegion;
    rightFace: MarginFaceRegion;
    fullHeight: { top: number; bottom: number };
    foldX: number;
}

export function computeMarginGuideLines(
    margins: PaperMargins,
    paperWidth: number,
    paperHeight: number,
): MarginGuideLines {
    const top = mmToPx(margins.verticalMm, "y");
    const bottom = paperHeight - top;
    const outerMargin = mmToPx(margins.outerHorizontalMm, "x");
    const foldMargin = mmToPx(margins.foldHorizontalMm, "x");
    const foldX = paperWidth / 2;

    return {
        top,
        bottom,
        outerLeft: outerMargin,
        foldLeft: foldX - foldMargin,
        foldRight: foldX + foldMargin,
        outerRight: paperWidth - outerMargin,
    };
}

export function computeMarginRegions(
    margins: PaperMargins,
    paperWidth: number,
    paperHeight: number,
): MarginRegions {
    const lines = computeMarginGuideLines(margins, paperWidth, paperHeight);
    const foldX = paperWidth / 2;

    return {
        leftFace: {
            left: lines.outerLeft,
            right: lines.foldLeft,
            top: lines.top,
            bottom: lines.bottom,
        },
        rightFace: {
            left: lines.foldRight,
            right: lines.outerRight,
            top: lines.top,
            bottom: lines.bottom,
        },
        fullHeight: {
            top: lines.top,
            bottom: lines.bottom,
        },
        foldX,
    };
}

export function getFaceRegion(
    regions: MarginRegions,
    centerX: number,
): MarginFaceRegion {
    return centerX < regions.foldX ? regions.leftFace : regions.rightFace;
}
