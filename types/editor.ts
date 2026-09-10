export type PaperSize = "B4_LANDSCAPE" | "A4" | "B4";

export type QuestionPattern =
    | "sub_parens"
    | "grid"
    | "circle_comma"
    | "split_2";

export interface QuestionBlockConfig {
    num: string;
    rubric: string;
    points: string;
    pattern: QuestionPattern;
    subRows: number;
    subCols: number;
    subRowHeight: number;
    subLabels: string[];
    gridRows: number;
    gridCols: number;
    gridRowHeight: number;
    circleCount: number;
    circleRows: number;
    circleCols: number;
    circleHeight: number;
    circleCommaEnabled: boolean;
    circleCommaCount: number;
    /** true=小問数に応じてカンマ位置を自動調整（デフォルト） */
    circleCommaPaddingAuto?: boolean;
    /** 手動指定時の右余白比率（0〜1、例: 0.45 = セル幅の45%） */
    circleCommaPaddingRatio?: number;
    splitRatio: "50:50" | "30:70" | "70:30" | string;
    splitHeight: number;
}

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
