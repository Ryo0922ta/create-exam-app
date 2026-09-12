export type PaperSize = "B4_LANDSCAPE" | "A4" | "B4";

export type QuestionPattern =
    | "sub_parens"
    | "grid"
    | "circle_comma"
    | "split_2"
    | "grouped";

export type SubQuestionCellType = "box" | "essay" | "grid";
export type SubQuestionPattern =
    | "sub_parens"
    | "grid"
    | "circle_comma"
    | "split_2"
    | "essay";

export interface SubQuestionCell {
    label: string;
    widthRatio: number;
    type: SubQuestionCellType;
}

export interface SubQuestionRowConfig {
    labels: string[];
}

export interface SubQuestionGroup {
    label: string;
    height: number;
    unclassifiedLabels?: string[];
    pattern?: SubQuestionPattern;
    subRows?: number;
    subCols?: number;
    subRowHeight?: number;
    subLabels?: string[];
    /** 小問複合枠の行ごとのラベル。行ごとに列数を変えられる新形式 */
    subRowConfigs?: SubQuestionRowConfig[];
    gridRows?: number;
    gridCols?: number;
    gridRowHeight?: number;
    circleRows?: number;
    circleCols?: number;
    circleHeight?: number;
    circleCommaEnabled?: boolean;
    circleCommaPaddingAuto?: boolean;
    circleCommaPaddingRatio?: number;
    splitRatio?: "50:50" | "30:70" | "70:30" | string;
    /** 旧 grouped 形式。読み込み時に sub_parens へ変換する */
    cells?: SubQuestionCell[];
}

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
    /** 小問ごとに高さ・分割数を変える grouped 用 */
    groups?: SubQuestionGroup[];
    /** 大問ブロック全体の横幅（px）。未指定時は SECTION_STANDARD_WIDTH */
    blockWidth?: number;
}

export type LabelType = "alpha" | "num" | "kata" | "kanji" | "none";

export type EditorBlockType =
    | "question-block"
    | "exam-header"
    | "namebox"
    | "score-table";

export interface ExamHeaderConfig {
    text: string;
    width: number;
    height: number;
}

export interface NameboxConfig {
    width: number;
    height: number;
    labels: [string, string, string, string];
}

export interface ScoreTableConfig {
    width: number;
    height: number;
    colHeaders: [string, string, string];
    maxScores: [string, string, string];
}

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

export interface PaperMargins {
    verticalMm: number;
    /** 用紙外端（左端・右端）からの余白 */
    outerHorizontalMm: number;
    /** 中央折り目付近（折り目内側）からの余白 */
    foldHorizontalMm: number;
}

export const DEFAULT_PAPER_MARGINS: PaperMargins = {
    verticalMm: 10,
    outerHorizontalMm: 10,
    foldHorizontalMm: 5,
};

export const MARGIN_LIMITS = {
    vertical: { min: 5, max: 25 },
    outerHorizontal: { min: 5, max: 20 },
    foldHorizontal: { min: 5, max: 20 },
} as const;
