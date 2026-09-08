export type PaperSize = "A4" | "B4";

export type LabelType = "alpha" | "num" | "kata" | "kanji" | "none";

export interface ShortAnswerOptions {
    qNo?: string;
    subNo?: string;
    rows?: number;
    cols?: number;
    labelType?: LabelType;
    left?: number;
    top?: number;
}

export interface HeaderBlockOptions {
    left?: number;
    top?: number;
}

export interface TitleBlockOptions {
    text?: string;
    left?: number;
    top?: number;
}

export interface EssayBlockOptions {
    lines?: number;
    left?: number;
    top?: number;
}

export interface CharGridBlockOptions {
    chars?: number;
    left?: number;
    top?: number;
}

export interface PaperSizeConfig {
    name: PaperSize;
    label: string;
    widthPx: number;
    heightPx: number;
    pdfWidthPt: number;
    pdfHeightPt: number;
}
