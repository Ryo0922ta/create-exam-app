import { fabric } from "fabric";
import {
    ExamHeaderConfig,
    NameboxConfig,
    ScoreTableConfig,
} from "@/types/editor";
import { SECTION_STANDARD_WIDTH } from "@/lib/editor/paperSizes";

export interface CustomExamHeaderGroup extends fabric.Group {
    customType?: "exam-header";
    examHeaderConfig?: ExamHeaderConfig;
}

export interface CustomNameboxGroup extends fabric.Group {
    customType?: "namebox";
    nameboxConfig?: NameboxConfig;
}

export interface CustomScoreTableGroup extends fabric.Group {
    customType?: "score-table";
    scoreTableConfig?: ScoreTableConfig;
}

export const DEFAULT_EXAM_HEADER_CONFIG: ExamHeaderConfig = {
    text: "令和○年度　○学期考査　○年　○○○　解答用紙　令和○年　○月○日　(○)　○限目実施",
    width: SECTION_STANDARD_WIDTH,
    height: 40,
};

export const DEFAULT_NAMEBOX_CONFIG: NameboxConfig = {
    width: 320,
    height: 40,
    labels: ["○年", "組", "番", "氏名"],
};

export const DEFAULT_SCORE_TABLE_CONFIG: ScoreTableConfig = {
    width: 260,
    height: 60,
    colHeaders: ["知・技", "思・判・表", "合計"],
    maxScores: ["/50", "/50", "/100"],
};

/**
 * 考査見出し枠ブロックを生成
 */
export function createExamHeaderBlock(
    config: ExamHeaderConfig,
    left: number = 40,
    top: number = 40,
): CustomExamHeaderGroup {
    const items: fabric.Object[] = [];
    const w = Math.max(100, config.width || SECTION_STANDARD_WIDTH);
    const h = Math.max(24, config.height || 40);

    // 外枠
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

    // 見出しテキスト
    const textTop = Math.max(4, Math.round((h - 13) / 2));
    items.push(
        new fabric.Text(config.text || "", {
            left: 10,
            top: textTop,
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 13,
            fontWeight: "bold",
            fill: "#000000",
        }),
    );

    const group = new fabric.Group(items, {
        left,
        top,
        selectable: true,
        evented: true,
    }) as CustomExamHeaderGroup;

    group.customType = "exam-header";
    group.examHeaderConfig = JSON.parse(JSON.stringify(config));

    return group;
}

/**
 * 年組氏名枠ブロックを生成
 */
export function createNameboxBlock(
    config: NameboxConfig,
    left: number = 350,
    top: number = 90,
): CustomNameboxGroup {
    const items: fabric.Object[] = [];
    const w = Math.max(120, config.width || 300);
    const h = Math.max(24, config.height || 40);

    // 外枠
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

    // 区切り線の位置計算 (年, 組, 番 は固定40px、ただし合計が幅の半分を超える場合は比率で調整)
    const fixedSlotWidth = Math.min(40, w / 4);
    const x1 = Math.round(fixedSlotWidth);
    const x2 = Math.round(fixedSlotWidth * 2);
    const x3 = Math.round(fixedSlotWidth * 3);

    items.push(
        new fabric.Line([x1, 0, x1, h], {
            stroke: "#000000",
            strokeWidth: 1,
        }),
    );
    items.push(
        new fabric.Line([x2, 0, x2, h], {
            stroke: "#000000",
            strokeWidth: 1,
        }),
    );
    items.push(
        new fabric.Line([x3, 0, x3, h], {
            stroke: "#000000",
            strokeWidth: 1,
        }),
    );

    const textTop = Math.max(4, Math.round((h - 13) / 2));
    const labels = config.labels || DEFAULT_NAMEBOX_CONFIG.labels;

    // 年
    items.push(
        new fabric.Text(labels[0] || "", {
            left: Math.round(x1 / 2),
            top: textTop,
            originX: "center",
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 13,
            fill: "#000000",
        }),
    );
    // 組
    items.push(
        new fabric.Text(labels[1] || "", {
            left: Math.round(x1 + (x2 - x1) / 2),
            top: textTop,
            originX: "center",
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 13,
            fill: "#000000",
        }),
    );
    // 番
    items.push(
        new fabric.Text(labels[2] || "", {
            left: Math.round(x2 + (x3 - x2) / 2),
            top: textTop,
            originX: "center",
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 13,
            fill: "#000000",
        }),
    );
    // 氏名
    items.push(
        new fabric.Text(labels[3] || "", {
            left: x3 + 12,
            top: textTop,
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 13,
            fill: "#000000",
        }),
    );

    const group = new fabric.Group(items, {
        left,
        top,
        selectable: true,
        evented: true,
    }) as CustomNameboxGroup;

    group.customType = "namebox";
    group.nameboxConfig = JSON.parse(JSON.stringify(config));

    return group;
}

/**
 * 観点別得点枠ブロックを生成
 */
export function createScoreTableBlock(
    config: ScoreTableConfig,
    left: number = 1080,
    top: number = 860,
): CustomScoreTableGroup {
    const items: fabric.Object[] = [];
    const w = Math.max(120, config.width || 240);
    const h = Math.max(30, config.height || 60);
    const halfH = Math.round(h / 2);
    const colW = w / 3;

    // 外枠
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

    // 水平区切り線
    items.push(
        new fabric.Line([0, halfH, w, halfH], {
            stroke: "#000000",
            strokeWidth: 1,
        }),
    );

    // 垂直区切り線 2本
    const x1 = Math.round(colW);
    const x2 = Math.round(colW * 2);

    items.push(
        new fabric.Line([x1, 0, x1, h], {
            stroke: "#000000",
            strokeWidth: 1,
        }),
    );
    items.push(
        new fabric.Line([x2, 0, x2, h], {
            stroke: "#000000",
            strokeWidth: 1,
        }),
    );

    const headerTop = Math.max(2, Math.round((halfH - 12) / 2));
    const scoreTop = halfH + Math.max(2, Math.round((halfH - 12) / 2));
    const colHeaders =
        config.colHeaders || DEFAULT_SCORE_TABLE_CONFIG.colHeaders;
    const maxScores = config.maxScores || DEFAULT_SCORE_TABLE_CONFIG.maxScores;

    // ヘッダー（観点名）
    items.push(
        new fabric.Text(colHeaders[0] || "", {
            left: Math.round(colW * 0.5),
            top: headerTop,
            originX: "center",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 12,
            fill: "#000000",
        }),
    );
    items.push(
        new fabric.Text(colHeaders[1] || "", {
            left: Math.round(colW * 1.5),
            top: headerTop,
            originX: "center",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 12,
            fill: "#000000",
        }),
    );
    items.push(
        new fabric.Text(colHeaders[2] || "", {
            left: Math.round(colW * 2.5),
            top: headerTop,
            originX: "center",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 12,
            fill: "#000000",
        }),
    );

    // 得点/配点表記
    items.push(
        new fabric.Text(maxScores[0] || "", {
            left: Math.round(colW * 1 - 6),
            top: scoreTop,
            originX: "right",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 12,
            fill: "#000000",
        }),
    );
    items.push(
        new fabric.Text(maxScores[1] || "", {
            left: Math.round(colW * 2 - 6),
            top: scoreTop,
            originX: "right",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 12,
            fill: "#000000",
        }),
    );
    items.push(
        new fabric.Text(maxScores[2] || "", {
            left: Math.round(colW * 3 - 6),
            top: scoreTop,
            originX: "right",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 12,
            fill: "#000000",
        }),
    );

    const group = new fabric.Group(items, {
        left,
        top,
        selectable: true,
        evented: true,
    }) as CustomScoreTableGroup;

    group.customType = "score-table";
    group.scoreTableConfig = JSON.parse(JSON.stringify(config));

    return group;
}
