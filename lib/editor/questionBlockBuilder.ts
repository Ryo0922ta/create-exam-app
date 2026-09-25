import { fabric } from "fabric";
import {
    QuestionBlockConfig,
    SubQuestionGroup,
    SubQuestionPattern,
} from "@/types/editor";
import {
    SECTION_STANDARD_WIDTH,
    clampQuestionBlockWidth,
} from "@/lib/editor/paperSizes";

const CIRCLE_COMMA_RATIO_ANCHORS: [number, number][] = [
    [3, 0.467],
    [4, 0.492],
    [5, 0.451],
    [6, 0.443],
    [7, 0.402],
];
const MIN_CIRCLE_COMMA_PADDING_PX = 5;
const MIN_CIRCLE_COMMA_PADDING_RATIO = 0.05;
const MAX_CIRCLE_COMMA_PADDING_RATIO = 0.95;

export const CIRCLE_NUMBER_LABELS = [
    "①",
    "②",
    "③",
    "④",
    "⑤",
    "⑥",
    "⑦",
    "⑧",
    "⑨",
    "⑩",
    "⑪",
    "⑫",
    "⑬",
    "⑭",
    "⑮",
];

export interface CircleCommaCell {
    index: number;
    row: number;
    col: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CircleCommaLayout {
    rows: number;
    cols: number;
    rowHeight: number;
    totalHeight: number;
    cellW: number;
    commaEnabled: boolean;
    cells: CircleCommaCell[];
    blockWidth: number;
}

export function resolveCircleRowsCols(cfg: QuestionBlockConfig): {
    rows: number;
    cols: number;
} {
    const cols = cfg.circleCols ?? cfg.circleCount ?? 5;
    const rows = cfg.circleRows ?? 1;
    return {
        rows: Math.max(1, rows),
        cols: Math.max(1, cols),
    };
}

export function buildCircleCommaLayout(
    cfg: QuestionBlockConfig,
    blockWidth: number,
): CircleCommaLayout {
    const { rows, cols } = resolveCircleRowsCols(cfg);
    const rowHeight = cfg.circleHeight || 32;
    const cellW = blockWidth / cols;
    const totalHeight = rows * rowHeight;
    const commaEnabled = cfg.circleCommaEnabled ?? false;
    const cells: CircleCommaCell[] = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const index = r * cols + c;
            cells.push({
                index,
                row: r,
                col: c,
                x: c * cellW,
                y: r * rowHeight,
                width: cellW,
                height: rowHeight,
            });
        }
    }

    return {
        rows,
        cols,
        rowHeight,
        totalHeight,
        cellW,
        commaEnabled,
        cells,
        blockWidth,
    };
}

function circleNumberTagWidth(label: string, charWidth: number): number {
    return Math.max(34, label.length * charWidth + 12);
}

function interpolateCircleCommaPaddingRatio(count: number): number {
    const c = Math.max(1, count);
    const anchors = CIRCLE_COMMA_RATIO_ANCHORS;

    if (c <= anchors[0][0]) {
        const [c3, r3] = anchors[0];
        const [c4, r4] = anchors[1];
        const slope = (r4 - r3) / (c4 - c3);
        return Math.min(
            MAX_CIRCLE_COMMA_PADDING_RATIO,
            Math.max(MIN_CIRCLE_COMMA_PADDING_RATIO, r3 + slope * (c - c3)),
        );
    }

    if (c >= anchors[anchors.length - 1][0]) {
        const [c6, r6] = anchors[anchors.length - 2];
        const [c7, r7] = anchors[anchors.length - 1];
        const slope = (r7 - r6) / (c7 - c6);
        return Math.max(MIN_CIRCLE_COMMA_PADDING_RATIO, r7 + slope * (c - c7));
    }

    for (let i = 0; i < anchors.length - 1; i++) {
        const [c0, r0] = anchors[i];
        const [c1, r1] = anchors[i + 1];
        if (c >= c0 && c <= c1) {
            const t = (c - c0) / (c1 - c0);
            return r0 + t * (r1 - r0);
        }
    }

    return anchors[0][1];
}

export function getDefaultCircleCommaPaddingRatio(count: number): number {
    return interpolateCircleCommaPaddingRatio(count);
}

function resolveCircleCommaCols(cfg: QuestionBlockConfig): number {
    return resolveCircleRowsCols(cfg).cols;
}

export function resolveCircleCommaPaddingRatio(
    cfg: QuestionBlockConfig,
): number {
    const cols = resolveCircleCommaCols(cfg);
    if (cfg.circleCommaPaddingAuto !== false) {
        return getDefaultCircleCommaPaddingRatio(cols);
    }
    const fallback = getDefaultCircleCommaPaddingRatio(cols);
    const ratio = cfg.circleCommaPaddingRatio ?? fallback;
    return Math.min(
        MAX_CIRCLE_COMMA_PADDING_RATIO,
        Math.max(MIN_CIRCLE_COMMA_PADDING_RATIO, ratio),
    );
}

export function resolveCircleCommaRightPadding(
    cfg: QuestionBlockConfig,
    cellWidth: number,
): number {
    const ratio = resolveCircleCommaPaddingRatio(cfg);
    return Math.max(MIN_CIRCLE_COMMA_PADDING_PX, cellWidth * ratio);
}

export interface CustomQuestionBlockGroup extends fabric.Group {
    customType?: string;
    questionConfig?: QuestionBlockConfig;
}

export interface GroupedRowLayout {
    label: string;
    y: number;
    height: number;
    labelWidth: number;
    group: SubQuestionGroup;
}

export interface GroupedLayout {
    rows: GroupedRowLayout[];
    totalHeight: number;
    labelWidth: number;
    blockWidth: number;
}

const GROUPED_LABEL_WIDTH = 34;

const DEFAULT_GROUPED_GROUPS: SubQuestionGroup[] = [
    {
        label: "1",
        height: 42,
        pattern: "sub_parens",
        subRowConfigs: [
            {
                labels: ["①", "②"],
                labelType: "circle",
            },
        ],
    },
];

export function normalizeSubQuestionGroup(
    group: SubQuestionGroup,
    index = 0,
): SubQuestionGroup {
    if (group.pattern) {
        return {
            ...group,
            label: String(group.label ?? index + 1),
            height: Math.max(24, Number(group.height) || 42),
        };
    }

    const cells = group.cells?.length
        ? group.cells
        : [{ label: "", widthRatio: 1, type: "box" as const }];
    return {
        ...group,
        label: String(group.label ?? index + 1),
        height: Math.max(24, Number(group.height) || 42),
        pattern: "sub_parens",
        subRows: 1,
        subCols: cells.length,
        subLabels: cells.map((cell) => String(cell.label || "")),
        subRowHeight: Math.max(24, Number(group.height) || 42),
    };
}

export function resolveGroupedGroups(
    cfg: QuestionBlockConfig,
): SubQuestionGroup[] {
    const groups = cfg.groups?.length ? cfg.groups : DEFAULT_GROUPED_GROUPS;
    return groups.map((group, index) =>
        normalizeSubQuestionGroup(group, index),
    );
}

export function buildGroupedLayout(
    cfg: QuestionBlockConfig,
    blockWidth: number,
): GroupedLayout {
    let y = 0;
    const rows = resolveGroupedGroups(cfg).map((group) => {
        const height = Math.max(24, Number(group.height) || 42);
        const row = {
            label: String(group.label || ""),
            y,
            height,
            labelWidth: String(group.label || "").trim()
                ? GROUPED_LABEL_WIDTH
                : 0,
            group,
        };
        y += height;
        return row;
    });

    return {
        rows,
        totalHeight: y,
        labelWidth: GROUPED_LABEL_WIDTH,
        blockWidth,
    };
}

function groupedCellTagWidth(label: string): number {
    return Math.min(Math.max(28, label.length * 9 + 12), Math.max(28, 160));
}

function resolveGroupPattern(group: SubQuestionGroup): SubQuestionPattern {
    return group.pattern || "sub_parens";
}

export function resolveSubParensRows(group: SubQuestionGroup): string[][] {
    if (group.subRowConfigs?.length) {
        return group.subRowConfigs.map((row) =>
            row.labels.map((label) => String(label ?? "")),
        );
    }

    const rows = Math.max(1, Number(group.subRows) || 1);
    const cols = Math.max(1, Number(group.subCols) || 1);
    const labels = group.subLabels || [];

    return Array.from({ length: rows }, (_, rowIndex) =>
        Array.from(
            { length: cols },
            (_, colIndex) => labels[rowIndex * cols + colIndex] || "",
        ),
    );
}

function resolveGroupRows(group: SubQuestionGroup): number {
    if (resolveGroupPattern(group) === "sub_parens") {
        return resolveSubParensRows(group).length;
    }
    if (resolveGroupPattern(group) === "grid") {
        return Math.max(1, Number(group.gridRows) || 1);
    }
    if (resolveGroupPattern(group) === "circle_comma") {
        return Math.max(1, Number(group.circleRows) || 1);
    }
    if (resolveGroupPattern(group) === "essay") {
        return Math.max(1, Number(group.essayRows) || 1);
    }
    return 1;
}

function resolveEssayGrid(
    group: SubQuestionGroup,
    width: number,
): {
    rows: number;
    cols: number;
    cellCount: number;
    cellWidth: number;
} {
    const rows = Math.max(1, Number(group.essayRows) || 1);
    const cols = Math.max(1, Number(group.essayCols) || 1);
    const maxCells = rows * cols;
    const cellCount = Math.min(
        maxCells,
        Math.max(1, Number(group.essayCellCount) || maxCells),
    );
    const specifiedWidth = Number(group.essayColumnWidth);
    return {
        rows,
        cols,
        cellCount,
        cellWidth:
            specifiedWidth > 0 ? specifiedWidth : Math.max(1, width / cols),
    };
}

function resolveGroupedCommaPadding(
    group: SubQuestionGroup,
    cols: number,
    cellWidth: number,
): number {
    const ratio =
        group.circleCommaPaddingAuto !== false
            ? getDefaultCircleCommaPaddingRatio(cols)
            : Math.min(
                  0.95,
                  Math.max(
                      0.05,
                      group.circleCommaPaddingRatio ??
                          getDefaultCircleCommaPaddingRatio(cols),
                  ),
              );
    return Math.max(5, cellWidth * ratio);
}

function resolveSubCommaPadding(
    group: SubQuestionGroup,
    cols: number,
    cellWidth: number,
): number {
    const ratio =
        group.subCommaPaddingAuto !== false
            ? getDefaultCircleCommaPaddingRatio(cols)
            : Math.min(
                  0.95,
                  Math.max(
                      0.05,
                      group.subCommaPaddingRatio ??
                          getDefaultCircleCommaPaddingRatio(cols),
                  ),
              );
    return Math.max(5, cellWidth * ratio);
}

function resolveSubCommaPositions(
    group: SubQuestionGroup,
    cols: number,
    cellWidth: number,
): number[] {
    const count = Math.max(1, Number(group.subCommaCount) || 1);
    const rightPadding = resolveSubCommaPadding(group, cols, cellWidth);

    if (count === 1) {
        return [cellWidth - rightPadding];
    }

    return Array.from(
        { length: count },
        (_, index) => (cellWidth * (index + 1)) / (count + 1),
    );
}

function addGroupedPatternFabric(
    items: fabric.Object[],
    group: SubQuestionGroup,
    x: number,
    y: number,
    width: number,
    height: number,
) {
    const pattern = resolveGroupPattern(group);
    const rows = resolveGroupRows(group);
    const rowHeight = height / rows;

    if (pattern === "essay") {
        const essayLayout = resolveEssayGrid(group, width);
        if ((group.essayLayout ?? "line") === "grid") {
            for (let index = 0; index < essayLayout.cellCount; index++) {
                const row = Math.floor(index / essayLayout.cols);
                const col = index % essayLayout.cols;
                items.push(
                    new fabric.Rect({
                        left: x + col * essayLayout.cellWidth,
                        top: y + row * rowHeight,
                        width: essayLayout.cellWidth,
                        height: rowHeight,
                        fill: "transparent",
                        stroke: "#000000",
                        strokeWidth: 1,
                    }),
                );
            }
        } else {
            for (let row = 0; row < essayLayout.rows; row++) {
                items.push(
                    new fabric.Rect({
                        left: x,
                        top: y + row * rowHeight,
                        width,
                        height: rowHeight,
                        fill: "transparent",
                        stroke: "#000000",
                        strokeWidth: 1,
                    }),
                );
            }
        }
        return;
    }

    if (pattern === "split_2") {
        let leftWidth = width * 0.5;
        if (group.splitRatio === "30:70") leftWidth = width * 0.3;
        if (group.splitRatio === "70:30") leftWidth = width * 0.7;
        items.push(
            new fabric.Rect({
                left: x,
                top: y,
                width: leftWidth,
                height,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
            new fabric.Rect({
                left: x + leftWidth,
                top: y,
                width: width - leftWidth,
                height,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        return;
    }

    if (pattern === "sub_parens") {
        const rowLabels = resolveSubParensRows(group);
        const rowHeight = height / rowLabels.length;

        rowLabels.forEach((labels, row) => {
            const cols = Math.max(1, labels.length);
            const cellWidth = width / cols;
            labels.forEach((label, col) => {
                const cellX = x + col * cellWidth;
                const cellY = y + row * rowHeight;
                items.push(
                    new fabric.Rect({
                        left: cellX,
                        top: cellY,
                        width: cellWidth,
                        height: rowHeight,
                        fill: "transparent",
                        stroke: "#000000",
                        strokeWidth: 1,
                    }),
                );
                if (label) {
                    const tagWidth = Math.min(
                        groupedCellTagWidth(label),
                        cellWidth,
                    );
                    items.push(
                        new fabric.Rect({
                            left: cellX,
                            top: cellY,
                            width: tagWidth,
                            height: rowHeight,
                            fill: "transparent",
                            stroke: "#000000",
                            strokeWidth: 1,
                        }),
                        new fabric.Text(label, {
                            left: cellX + tagWidth / 2,
                            top: cellY + rowHeight / 2,
                            originX: "center",
                            originY: "center",
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            fill: "#000000",
                        }),
                    );
                }
                if (group.subCommaEnabled) {
                    for (const commaX of resolveSubCommaPositions(
                        group,
                        cols,
                        cellWidth,
                    )) {
                        items.push(
                            new fabric.Text(",", {
                                left: cellX + commaX,
                                top: cellY + rowHeight / 2,
                                originX: "center",
                                originY: "center",
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                fill: "#000000",
                            }),
                        );
                    }
                }
            });
        });
        return;
    }

    const cols =
        pattern === "grid"
              ? Math.max(1, Number(group.gridCols) || 1)
              : Math.max(1, Number(group.circleCols) || 1);
    const cellWidth = width / cols;

    if (pattern === "circle_comma") {
        items.push(
            new fabric.Rect({
                left: x,
                top: y,
                width,
                height,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        for (let col = 1; col < cols; col++) {
            items.push(
                new fabric.Line(
                    [x + col * cellWidth, y, x + col * cellWidth, y + height],
                    {
                        stroke: "#000000",
                        strokeWidth: 1,
                        selectable: false,
                        evented: false,
                    },
                ),
            );
        }
        for (let row = 1; row < rows; row++) {
            items.push(
                new fabric.Line(
                    [x, y + row * rowHeight, x + width, y + row * rowHeight],
                    {
                        stroke: "#000000",
                        strokeWidth: 1,
                        selectable: false,
                        evented: false,
                    },
                ),
            );
        }
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const index = row * cols + col;
                const label = CIRCLE_NUMBER_LABELS[index] || String(index + 1);
                items.push(
                    new fabric.Text(label, {
                        left: x + col * cellWidth + 16,
                        top: y + row * rowHeight + rowHeight / 2,
                        originX: "center",
                        originY: "center",
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        fill: "#000000",
                    }),
                );
                if (group.circleCommaEnabled) {
                    items.push(
                        new fabric.Text(",", {
                            left:
                                x +
                                (col + 1) * cellWidth -
                                resolveGroupedCommaPadding(
                                    group,
                                    cols,
                                    cellWidth,
                                ),
                            top: y + row * rowHeight + rowHeight / 2,
                            originX: "center",
                            originY: "center",
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            fill: "#000000",
                        }),
                    );
                }
            }
        }
        return;
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cellX = x + col * cellWidth;
            const cellY = y + row * rowHeight;
            items.push(
                new fabric.Rect({
                    left: cellX,
                    top: cellY,
                    width: cellWidth,
                    height: rowHeight,
                    fill: "transparent",
                    stroke: "#000000",
                    strokeWidth: 1,
                }),
            );
        }
    }
}

function drawGroupedPatternCanvas(
    ctx: CanvasRenderingContext2D,
    group: SubQuestionGroup,
    x: number,
    y: number,
    width: number,
    height: number,
) {
    const pattern = resolveGroupPattern(group);
    const rows = resolveGroupRows(group);
    const rowHeight = height / rows;

    if (pattern === "essay") {
        const essayLayout = resolveEssayGrid(group, width);
        if ((group.essayLayout ?? "line") === "grid") {
            for (let index = 0; index < essayLayout.cellCount; index++) {
                const row = Math.floor(index / essayLayout.cols);
                const col = index % essayLayout.cols;
                ctx.strokeRect(
                    x + col * essayLayout.cellWidth,
                    y + row * rowHeight,
                    essayLayout.cellWidth,
                    rowHeight,
                );
            }
        } else {
            for (let row = 0; row < essayLayout.rows; row++) {
                ctx.strokeRect(
                    x,
                    y + row * rowHeight,
                    width,
                    rowHeight,
                );
            }
        }
        return;
    }
    if (pattern === "split_2") {
        let leftWidth = width * 0.5;
        if (group.splitRatio === "30:70") leftWidth = width * 0.3;
        if (group.splitRatio === "70:30") leftWidth = width * 0.7;
        ctx.strokeRect(x, y, leftWidth, height);
        ctx.strokeRect(x + leftWidth, y, width - leftWidth, height);
        return;
    }

    if (pattern === "sub_parens") {
        const rowLabels = resolveSubParensRows(group);
        const rowHeight = height / rowLabels.length;

        rowLabels.forEach((labels, row) => {
            const cols = Math.max(1, labels.length);
            const cellWidth = width / cols;
            labels.forEach((label, col) => {
                const cellX = x + col * cellWidth;
                const cellY = y + row * rowHeight;
                ctx.strokeRect(cellX, cellY, cellWidth, rowHeight);
                if (label) {
                    const tagWidth = Math.min(
                        groupedCellTagWidth(label),
                        cellWidth,
                    );
                    ctx.strokeRect(cellX, cellY, tagWidth, rowHeight);
                    ctx.fillStyle = "#000000";
                    ctx.font = "11px 'Noto Sans JP', sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        label,
                        cellX + tagWidth / 2,
                        cellY + rowHeight / 2,
                    );
                }
                if (group.subCommaEnabled) {
                    ctx.fillStyle = "#000000";
                    ctx.font = "12px 'Noto Sans JP', sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    for (const commaX of resolveSubCommaPositions(
                        group,
                        cols,
                        cellWidth,
                    )) {
                        ctx.fillText(
                            ",",
                            cellX + commaX,
                            cellY + rowHeight / 2,
                        );
                    }
                }
            });
        });
        return;
    }

    const cols =
        pattern === "grid"
              ? Math.max(1, Number(group.gridCols) || 1)
              : Math.max(1, Number(group.circleCols) || 1);
    const cellWidth = width / cols;
    ctx.strokeRect(x, y, width, height);

    if (pattern === "circle_comma") {
        for (let col = 1; col < cols; col++) {
            ctx.beginPath();
            ctx.moveTo(x + col * cellWidth, y);
            ctx.lineTo(x + col * cellWidth, y + height);
            ctx.stroke();
        }
        for (let row = 1; row < rows; row++) {
            ctx.beginPath();
            ctx.moveTo(x, y + row * rowHeight);
            ctx.lineTo(x + width, y + row * rowHeight);
            ctx.stroke();
        }
        ctx.fillStyle = "#000000";
        ctx.font = "12px 'Noto Sans JP', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const index = row * cols + col;
                ctx.fillText(
                    CIRCLE_NUMBER_LABELS[index] || String(index + 1),
                    x + col * cellWidth + 16,
                    y + row * rowHeight + rowHeight / 2,
                );
                if (group.circleCommaEnabled) {
                    ctx.fillText(
                        ",",
                        x +
                            (col + 1) * cellWidth -
                            resolveGroupedCommaPadding(group, cols, cellWidth),
                        y + row * rowHeight + rowHeight / 2,
                    );
                }
            }
        }
        return;
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cellX = x + col * cellWidth;
            const cellY = y + row * rowHeight;
            ctx.strokeRect(cellX, cellY, cellWidth, rowHeight);
        }
    }
}

/**
 * モーダル等の設定情報（QuestionBlockConfig）から、Fabric.jsのグループオブジェクトを生成する。
 * 各子オブジェクトの座標を相対配置で正しく計算し、確実にキャンバスへ配置できるようにする。
 */
export function resolveQuestionBlockWidth(
    cfg: QuestionBlockConfig,
    override?: number,
): number {
    if (override !== undefined) {
        return clampQuestionBlockWidth(override);
    }
    return clampQuestionBlockWidth(cfg.blockWidth ?? SECTION_STANDARD_WIDTH);
}

export function createQuestionBlock(
    cfg: QuestionBlockConfig,
    left: number = 50,
    top: number = 50,
    blockWidthOverride?: number,
): CustomQuestionBlockGroup {
    const blockWidth = resolveQuestionBlockWidth(cfg, blockWidthOverride);
    const items: fabric.Object[] = [];

    // 1. 大問番号
    const numText = new fabric.Text(String(cfg.num || "1"), {
        left: 0,
        top: 0,
        fontFamily: "'Noto Serif JP', serif, 'Hiragino Mincho ProN'",
        fontSize: 16,
        fontWeight: "bold",
        fill: "#000000",
    });
    items.push(numText);

    // 2. 観点区分と配点ヘッダー
    const rubricPart = cfg.rubric ? `[ ${cfg.rubric} ]` : "";
    const headerStr = `${rubricPart} ${cfg.points || ""}`.trim();
    const infoText = new fabric.Text(String(headerStr || " "), {
        left: 28,
        top: 2,
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: 13,
        fill: "#000000",
    });
    items.push(infoText);

    const tableTop = 26;

    // 3. パターン別の解答枠の構築
    if (cfg.pattern === "sub_parens") {
        const cellW = blockWidth / (cfg.subCols || 1);
        const rowH = cfg.subRowHeight || 34;

        for (let r = 0; r < cfg.subRows; r++) {
            const y = tableTop + r * rowH;
            for (let c = 0; c < cfg.subCols; c++) {
                const x = c * cellW;
                const idx = r * cfg.subCols + c;

                // セル外枠
                items.push(
                    new fabric.Rect({
                        left: x,
                        top: y,
                        width: cellW,
                        height: rowH,
                        fill: "transparent",
                        stroke: "#000000",
                        strokeWidth: 1,
                    }),
                );

                // 小問記号ラベル枠 (1), (2)...
                if (idx < cfg.subLabels.length) {
                    const label = String(cfg.subLabels[idx] || "");
                    const tagW = Math.max(34, label.length * 9 + 12);

                    items.push(
                        new fabric.Rect({
                            left: x,
                            top: y,
                            width: tagW,
                            height: rowH,
                            fill: "transparent",
                            stroke: "#000000",
                            strokeWidth: 1,
                        }),
                    );

                    items.push(
                        new fabric.Text(label || " ", {
                            left: x + tagW / 2,
                            top: y + rowH / 2,
                            originX: "center",
                            originY: "center",
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            fill: "#000000",
                        }),
                    );
                }
            }
        }
    } else if (cfg.pattern === "grid") {
        const cellW = blockWidth / (cfg.gridCols || 1);
        const rowH = cfg.gridRowHeight || 32;

        for (let r = 0; r < cfg.gridRows; r++) {
            const y = tableTop + r * rowH;
            for (let c = 0; c < cfg.gridCols; c++) {
                items.push(
                    new fabric.Rect({
                        left: c * cellW,
                        top: y,
                        width: cellW,
                        height: rowH,
                        fill: "transparent",
                        stroke: "#000000",
                        strokeWidth: 1,
                    }),
                );
            }
        }
    } else if (cfg.pattern === "circle_comma") {
        const layout = buildCircleCommaLayout(cfg, blockWidth);

        items.push(
            new fabric.Rect({
                left: 0,
                top: tableTop,
                width: layout.blockWidth,
                height: layout.totalHeight,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );

        for (let i = 1; i < layout.cols; i++) {
            const x = i * layout.cellW;
            items.push(
                new fabric.Line(
                    [x, tableTop, x, tableTop + layout.totalHeight],
                    {
                        stroke: "#000000",
                        strokeWidth: 1,
                        selectable: false,
                        evented: false,
                    },
                ),
            );
        }

        for (let r = 1; r < layout.rows; r++) {
            const y = tableTop + r * layout.rowHeight;
            items.push(
                new fabric.Line([0, y, layout.blockWidth, y], {
                    stroke: "#000000",
                    strokeWidth: 1,
                    selectable: false,
                    evented: false,
                }),
            );
        }

        for (const cell of layout.cells) {
            const cellTop = tableTop + cell.y;
            const cellCenterY = cellTop + cell.height / 2;
            const textVal =
                CIRCLE_NUMBER_LABELS[cell.index] || `${cell.index + 1}`;
            const tagW = circleNumberTagWidth(textVal, 9);
            items.push(
                new fabric.Text(textVal, {
                    left: cell.x + tagW / 2,
                    top: cellCenterY,
                    originX: "center",
                    originY: "center",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    fill: "#000000",
                }),
            );

            if (layout.commaEnabled) {
                const commaPadding = resolveCircleCommaRightPadding(
                    cfg,
                    cell.width,
                );
                items.push(
                    new fabric.Text(",", {
                        left: cell.x + cell.width - commaPadding,
                        top: cellCenterY,
                        originX: "center",
                        originY: "center",
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        fill: "#000000",
                    }),
                );
            }
        }
    } else if (cfg.pattern === "split_2") {
        const height = cfg.splitHeight || 38;
        let leftW = blockWidth * 0.5;
        if (cfg.splitRatio === "30:70") leftW = blockWidth * 0.3;
        if (cfg.splitRatio === "70:30") leftW = blockWidth * 0.7;

        items.push(
            new fabric.Rect({
                left: 0,
                top: tableTop,
                width: leftW,
                height: height,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
        items.push(
            new fabric.Rect({
                left: leftW,
                top: tableTop,
                width: blockWidth - leftW,
                height: height,
                fill: "transparent",
                stroke: "#000000",
                strokeWidth: 1,
            }),
        );
    } else if (cfg.pattern === "grouped") {
        const layout = buildGroupedLayout(cfg, blockWidth);

        for (const row of layout.rows) {
            const y = tableTop + row.y;
            const isEssayGrid =
                row.group.pattern === "essay" &&
                (row.group.essayLayout ?? "line") === "grid";
            items.push(
                new fabric.Rect({
                    left: 0,
                    top: y,
                    width: isEssayGrid
                        ? row.labelWidth
                        : layout.blockWidth,
                    height: row.height,
                    fill: "transparent",
                    stroke: "#000000",
                    strokeWidth: 1,
                }),
            );
            if (row.label) {
                items.push(
                    new fabric.Text(row.label, {
                        left: row.labelWidth / 2,
                        top: y + row.height / 2,
                        originX: "center",
                        originY: "center",
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        fill: "#000000",
                    }),
                );
            }
            if (row.labelWidth > 0 && !isEssayGrid) {
                items.push(
                    new fabric.Line(
                        [row.labelWidth, y, row.labelWidth, y + row.height],
                        {
                            stroke: "#000000",
                            strokeWidth: 1,
                            selectable: false,
                            evented: false,
                        },
                    ),
                );
            }
            addGroupedPatternFabric(
                items,
                row.group,
                row.labelWidth,
                y,
                layout.blockWidth - row.labelWidth,
                row.height,
            );
        }
    }

    const group = new fabric.Group(items, {
        left: left,
        top: top,
        originX: "left",
        originY: "top",
        lockRotation: true,
    }) as CustomQuestionBlockGroup;

    group.customType = "question-block";
    group.questionConfig = JSON.parse(JSON.stringify({ ...cfg, blockWidth }));
    group.setCoords();

    return group;
}

/**
 * モーダル内のリアルタイムプレビューをHTML5 Canvas (2D Context) に描画する
 */
export function drawModalPreviewCanvas(
    canvas: HTMLCanvasElement,
    cfg: QuestionBlockConfig,
    width?: number,
): void {
    const resolvedWidth = resolveQuestionBlockWidth(cfg, width);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let totalH = 65;
    if (cfg.pattern === "sub_parens")
        totalH = 30 + cfg.subRows * cfg.subRowHeight;
    if (cfg.pattern === "grid") totalH = 30 + cfg.gridRows * cfg.gridRowHeight;
    if (cfg.pattern === "circle_comma") {
        const { rows } = resolveCircleRowsCols(cfg);
        totalH = 30 + rows * cfg.circleHeight;
    }
    if (cfg.pattern === "split_2") totalH = 30 + cfg.splitHeight;
    if (cfg.pattern === "grouped") {
        totalH = 30 + buildGroupedLayout(cfg, resolvedWidth).totalHeight;
    }

    const dpr =
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = resolvedWidth * dpr;
    canvas.height = totalH * dpr;
    canvas.style.width = `${resolvedWidth}px`;
    canvas.style.height = `${totalH}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, resolvedWidth, totalH);

    // 大問番号
    ctx.fillStyle = "#000000";
    ctx.font = "bold 15px 'Noto Serif JP', serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(cfg.num || "1", 4, 18);

    // 観点・配点
    ctx.font = "13px 'Noto Sans JP', sans-serif";
    const rubricText = cfg.rubric ? `[ ${cfg.rubric} ]` : "";
    const headerStr = `${rubricText} ${cfg.points || ""}`.trim();
    ctx.fillText(headerStr, 28, 18);

    const tableTop = 26;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";

    if (cfg.pattern === "sub_parens") {
        const cols = cfg.subCols || 1;
        const cellW = resolvedWidth / cols;
        for (let r = 0; r < cfg.subRows; r++) {
            const y = tableTop + r * cfg.subRowHeight;
            for (let c = 0; c < cols; c++) {
                const x = c * cellW;
                const idx = r * cols + c;
                ctx.strokeRect(x, y, cellW, cfg.subRowHeight);

                if (idx < cfg.subLabels.length) {
                    const label = cfg.subLabels[idx];
                    const tagW = Math.max(34, label.length * 10 + 12);
                    ctx.strokeRect(x, y, tagW, cfg.subRowHeight);
                    ctx.fillStyle = "#000000";
                    ctx.font = "11px 'Noto Sans JP', sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(label, x + tagW / 2, y + cfg.subRowHeight / 2);
                }
            }
        }
    } else if (cfg.pattern === "grid") {
        const cols = cfg.gridCols || 1;
        const cellW = resolvedWidth / cols;
        for (let r = 0; r < cfg.gridRows; r++) {
            const y = tableTop + r * cfg.gridRowHeight;
            for (let c = 0; c < cols; c++) {
                ctx.strokeRect(c * cellW, y, cellW, cfg.gridRowHeight);
            }
        }
    } else if (cfg.pattern === "circle_comma") {
        const layout = buildCircleCommaLayout(cfg, resolvedWidth);
        ctx.strokeRect(0, tableTop, resolvedWidth, layout.totalHeight);

        for (let i = 1; i < layout.cols; i++) {
            const x = i * layout.cellW;
            ctx.beginPath();
            ctx.moveTo(x, tableTop);
            ctx.lineTo(x, tableTop + layout.totalHeight);
            ctx.stroke();
        }

        for (let r = 1; r < layout.rows; r++) {
            const y = tableTop + r * layout.rowHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(resolvedWidth, y);
            ctx.stroke();
        }

        ctx.fillStyle = "#000000";
        ctx.font = "12px 'Noto Sans JP', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const cell of layout.cells) {
            const cellCenterY = tableTop + cell.y + cell.height / 2;
            const textVal =
                CIRCLE_NUMBER_LABELS[cell.index] || `${cell.index + 1}`;
            const tagW = circleNumberTagWidth(textVal, 10);
            ctx.fillText(textVal, cell.x + tagW / 2, cellCenterY);

            if (layout.commaEnabled) {
                const commaPadding = resolveCircleCommaRightPadding(
                    cfg,
                    cell.width,
                );
                ctx.fillText(
                    ",",
                    cell.x + cell.width - commaPadding,
                    cellCenterY,
                );
            }
        }
    } else if (cfg.pattern === "split_2") {
        let leftW = resolvedWidth * 0.5;
        if (cfg.splitRatio === "30:70") leftW = resolvedWidth * 0.3;
        if (cfg.splitRatio === "70:30") leftW = resolvedWidth * 0.7;
        ctx.strokeRect(0, tableTop, leftW, cfg.splitHeight);
        ctx.strokeRect(leftW, tableTop, resolvedWidth - leftW, cfg.splitHeight);
    } else if (cfg.pattern === "grouped") {
        const layout = buildGroupedLayout(cfg, resolvedWidth);
        for (const row of layout.rows) {
            const y = tableTop + row.y;
            const isEssayGrid =
                row.group.pattern === "essay" &&
                (row.group.essayLayout ?? "line") === "grid";
            ctx.strokeRect(
                0,
                y,
                isEssayGrid ? row.labelWidth : layout.blockWidth,
                row.height,
            );
            if (row.labelWidth > 0 && !isEssayGrid) {
                ctx.beginPath();
                ctx.moveTo(row.labelWidth, y);
                ctx.lineTo(row.labelWidth, y + row.height);
                ctx.stroke();
            }

            if (row.label) {
                ctx.fillStyle = "#000000";
                ctx.font = "12px 'Noto Sans JP', sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(row.label, row.labelWidth / 2, y + row.height / 2);
            }

            drawGroupedPatternCanvas(
                ctx,
                row.group,
                row.labelWidth,
                y,
                layout.blockWidth - row.labelWidth,
                row.height,
            );
        }
    }
}
