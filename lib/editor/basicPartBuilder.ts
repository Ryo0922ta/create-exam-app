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
    columnWidths: [40, 40, 40],
};

export const DEFAULT_SCORE_TABLE_CONFIG: ScoreTableConfig = {
    width: 260,
    height: 60,
    colHeaders: ["知・技", "思・判・表", "合計"],
    maxScores: ["/50", "/50", "/100"],
};

const BASIC_PART_MIN_ROW_HEIGHT = 15;

function resolveNameboxColumnWidths(
    config: NameboxConfig,
    width: number,
): [number, number, number, number] {
    const requested = config.columnWidths || [40, 40, 40];
    const minimumNameWidth = 40;
    const availableForFixed = Math.max(minimumNameWidth, width - minimumNameWidth);
    const fixed = requested.map((value) => Math.max(20, Number(value) || 40));
    const fixedTotal = fixed.reduce((sum, value) => sum + value, 0);
    const scale = fixedTotal > availableForFixed ? availableForFixed / fixedTotal : 1;
    const firstThree = fixed.map((value) => Math.max(20, Math.round(value * scale))) as [
        number,
        number,
        number,
    ];
    const roundedTotal = firstThree.reduce((sum, value) => sum + value, 0);
    if (roundedTotal > availableForFixed) {
        firstThree[2] = Math.max(
            20,
            firstThree[2] - (roundedTotal - availableForFixed),
        );
    }
    const nameWidth = Math.max(
        minimumNameWidth,
        width - firstThree.reduce((sum, value) => sum + value, 0),
    );
    return [...firstThree, nameWidth];
}

function resolveScoreTableColumns(config: ScoreTableConfig): {
    colHeaders: string[];
    maxScores: string[];
} {
    const colHeaders =
        config.colHeaders?.length >= 2
            ? config.colHeaders.map((value) => value ?? "")
            : DEFAULT_SCORE_TABLE_CONFIG.colHeaders;
    const maxScores = colHeaders.map(
        (_, index) => config.maxScores?.[index] ?? "",
    );
    return { colHeaders, maxScores };
}

function resolveScoreTableRowHeights(
    config: ScoreTableConfig,
    height: number,
): [number, number] {
    const maxFirstRow = Math.max(
        BASIC_PART_MIN_ROW_HEIGHT,
        height - BASIC_PART_MIN_ROW_HEIGHT,
    );
    const requestedFirstRow = config.rowHeights?.[0];
    const firstRow =
        requestedFirstRow === undefined
            ? Math.round(height / 2)
            : Number(requestedFirstRow) || Math.round(height / 2);
    const clampedFirstRow = Math.min(
        maxFirstRow,
        Math.max(BASIC_PART_MIN_ROW_HEIGHT, Math.round(firstRow)),
    );
    return [clampedFirstRow, height - clampedFirstRow];
}

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

    const columnWidths = resolveNameboxColumnWidths(config, w);
    const columnEdges = columnWidths.slice(0, 3).reduce<number[]>(
        (edges, columnWidth) => [
            ...edges,
            (edges[edges.length - 1] || 0) + columnWidth,
        ],
        [],
    );

    columnEdges.forEach((x) => {
        items.push(
            new fabric.Line([x, 0, x, h], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
    });

    const textTop = Math.max(4, Math.round((h - 13) / 2));
    const labels = config.labels || DEFAULT_NAMEBOX_CONFIG.labels;

    let cellLeft = 0;
    labels.forEach((label, index) => {
        const cellWidth = columnWidths[index];
        items.push(
            new fabric.Text(label || "", {
                left:
                    index < 3
                        ? Math.round(cellLeft + cellWidth - 6)
                        : Math.round(cellLeft + 12),
                top: textTop,
                originX: index < 3 ? "right" : "left",
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 13,
                fill: "#000000",
            }),
        );
        cellLeft += cellWidth;
    });

    const group = new fabric.Group(items, {
        left,
        top,
        selectable: true,
        evented: true,
    }) as CustomNameboxGroup;

    group.customType = "namebox";
    group.nameboxConfig = {
        ...JSON.parse(JSON.stringify(config)),
        columnWidths: columnWidths.slice(0, 3),
    };

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
    const { colHeaders, maxScores } = resolveScoreTableColumns(config);
    const columnCount = colHeaders.length;
    const colW = w / columnCount;
    const [headerHeight, scoreHeight] = resolveScoreTableRowHeights(config, h);

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
        new fabric.Line([0, headerHeight, w, headerHeight], {
            stroke: "#000000",
            strokeWidth: 1,
        }),
    );

    // 垂直区切り線
    for (let index = 1; index < columnCount; index += 1) {
        const x = Math.round(colW * index);
        items.push(
            new fabric.Line([x, 0, x, h], {
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
    }

    const headerTop = Math.max(2, Math.round((headerHeight - 12) / 2));
    const scoreTop =
        headerHeight + Math.max(2, Math.round((scoreHeight - 12) / 2));

    colHeaders.forEach((header, index) => {
        const centerX = Math.round(colW * (index + 0.5));
        items.push(
            new fabric.Text(header || "", {
                left: centerX,
                top: headerTop,
                originX: "center",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
        items.push(
            new fabric.Text(maxScores[index] || "", {
                left: Math.round(colW * (index + 1) - 6),
                top: scoreTop,
                originX: "right",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fill: "#000000",
            }),
        );
    });

    const group = new fabric.Group(items, {
        left,
        top,
        selectable: true,
        evented: true,
    }) as CustomScoreTableGroup;

    group.customType = "score-table";
    group.scoreTableConfig = {
        ...JSON.parse(JSON.stringify(config)),
        colHeaders,
        maxScores,
        rowHeights: [headerHeight, scoreHeight],
    };

    return group;
}
