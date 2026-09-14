import { fabric } from "fabric";
import {
    AlignmentType,
    BorderStyle,
    ColumnBreak,
    Document,
    HeightRule,
    ISectionOptions,
    PageOrientation,
    Packer,
    Paragraph,
    SectionType,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
} from "docx";
import {
    CIRCLE_NUMBER_LABELS,
    resolveGroupedGroups,
} from "@/lib/editor/questionBlockBuilder";
import {
    ExamHeaderConfig,
    NameboxConfig,
    QuestionBlockConfig,
    ScoreTableConfig,
    SubQuestionGroup,
} from "@/types/editor";

function triggerDownload(blob: Blob, fileName: string) {
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);
}

interface ExportableBlock extends fabric.Group {
    customType?: string;
    questionConfig?: QuestionBlockConfig;
    examHeaderConfig?: ExamHeaderConfig;
    nameboxConfig?: NameboxConfig;
    scoreTableConfig?: ScoreTableConfig;
}

const PAGE_WIDTH_TWIP = 20639;
const PAGE_HEIGHT_TWIP = 14572;
const PAGE_MARGIN_TWIP = 280;
const CONTENT_WIDTH_TWIP = PAGE_WIDTH_TWIP - PAGE_MARGIN_TWIP * 2;
const CANVAS_WIDTH_PX = 1376;
const PX_TO_TWIP = CONTENT_WIDTH_TWIP / CANVAS_WIDTH_PX;
const DEFAULT_FONT = "Noto Sans JP";

const BLACK_BORDER = {
    style: BorderStyle.SINGLE,
    size: 8,
    color: "000000",
};

const TABLE_BORDERS = {
    top: BLACK_BORDER,
    bottom: BLACK_BORDER,
    left: BLACK_BORDER,
    right: BLACK_BORDER,
    insideHorizontal: BLACK_BORDER,
    insideVertical: BLACK_BORDER,
};

const NO_BORDERS = {
    top: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
    insideHorizontal: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
    insideVertical: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
};

function pxToTwip(value: number): number {
    return Math.max(0, Math.round(value * PX_TO_TWIP));
}

function wordText(text: string, size = 20, bold = false): TextRun {
    return new TextRun({
        text,
        font: DEFAULT_FONT,
        size,
        bold,
    });
}

function wordParagraph(
    text: string,
    options: {
        size?: number;
        bold?: boolean;
        indent?: number;
        spacingBefore?: number;
        spacingAfter?: number;
        alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    } = {},
): Paragraph {
    return new Paragraph({
        alignment: options.alignment,
        indent:
            options.indent === undefined
                ? undefined
                : { left: pxToTwip(options.indent) },
        spacing: {
            before: options.spacingBefore ?? 0,
            after: options.spacingAfter ?? 60,
        },
        children: [wordText(text, options.size ?? 22, options.bold)],
    });
}

function wordCell(
    text = "",
    width?: number,
    options: {
        bold?: boolean;
        fill?: string;
        size?: number;
        alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
        borders?: typeof TABLE_BORDERS | typeof NO_BORDERS;
    } = {},
): TableCell {
    return new TableCell({
        width:
            width === undefined
                ? undefined
                : { size: Math.max(1, width), type: WidthType.DXA },
        margins: {
            top: 40,
            bottom: 40,
            left: 60,
            right: 60,
        },
        borders: options.borders ?? TABLE_BORDERS,
        shading: options.fill
            ? { type: ShadingType.CLEAR, fill: options.fill }
            : undefined,
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: options.alignment ?? AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                    wordText(text, options.size ?? 18, options.bold),
                ],
            }),
        ],
    });
}

function gridTable(
    values: string[][],
    width: number,
    rowHeight: number | number[],
    columnWidths?: number[],
    borders = TABLE_BORDERS,
): Table {
    const columns = Math.max(
        1,
        columnWidths?.length ?? Math.max(...values.map((row) => row.length), 1),
    );
    const widths =
        columnWidths ??
        Array.from({ length: columns }, () => Math.round(width / columns));
    const rows = values.map(
        (valuesInRow, rowIndex) =>
            new TableRow({
                height: {
                    value: Math.max(
                        1,
                        Array.isArray(rowHeight)
                            ? rowHeight[rowIndex] ?? rowHeight[0] ?? 1
                            : rowHeight,
                    ),
                    rule: HeightRule.EXACT,
                },
                children: Array.from({ length: columns }, (_, index) =>
                    wordCell(valuesInRow[index] ?? "", widths[index], {
                        borders,
                    }),
                ),
            }),
    );
    return new Table({
        rows,
        width: { size: Math.max(1, width), type: WidthType.DXA },
        columnWidths: widths,
        borders,
        layout: TableLayoutType.FIXED,
        alignment: AlignmentType.LEFT,
    });
}

function questionSubParensRows(config: QuestionBlockConfig): string[][] {
    const rows = Math.max(1, Number(config.subRows) || 1);
    const columns = Math.max(1, Number(config.subCols) || 1);
    return Array.from({ length: rows }, (_, row) =>
        Array.from(
            { length: columns },
            (_, column) =>
                config.subLabels?.[row * columns + column] || "",
        ),
    );
}

function expandSubParensRows(
    rows: string[][],
    tableWidth: number,
): { values: string[][]; widths: number[] } {
    const columns = Math.max(1, ...rows.map((row) => row.length));
    const slotWidth = Math.floor(tableWidth / columns);

    const tagWidths = Array.from({ length: columns }, (_, column) => {
        const longestLabel = Math.max(
            0,
            ...rows.map((row) => String(row[column] || "").length),
        );
        // タグの横幅: 最低32px(約470twip)、文字数に応じて広げるがスロット幅の35%を上限とする
        const computedTag = Math.max(
            pxToTwip(32),
            pxToTwip(longestLabel * 11 + 16),
        );
        return Math.min(computedTag, Math.floor(slotWidth * 0.35));
    });

    const answerWidths = tagWidths.map((tagWidth) =>
        Math.max(1, slotWidth - tagWidth),
    );

    // 全幅との差分（端数）を最後の解答欄に足して合計を完全一致させる
    const totalAssigned = tagWidths.reduce(
        (sum, tw, col) => sum + tw + answerWidths[col],
        0,
    );
    const remainder = tableWidth - totalAssigned;
    if (remainder !== 0 && answerWidths.length > 0) {
        answerWidths[answerWidths.length - 1] = Math.max(
            1,
            answerWidths[answerWidths.length - 1] + remainder,
        );
    }

    const allWidths: number[] = [];
    for (let c = 0; c < columns; c++) {
        allWidths.push(tagWidths[c], answerWidths[c]);
    }

    return {
        values: rows.map((row) =>
            Array.from({ length: columns }).flatMap((_, column) => [
                row[column] || "",
                "",
            ]),
        ),
        widths: allWidths,
    };
}

function questionPatternTables(
    config: QuestionBlockConfig,
    width: number,
): (Paragraph | Table)[] {
    const tableWidth = pxToTwip(width);

    if (config.pattern === "sub_parens") {
        const rows = questionSubParensRows(config);
        const expanded = expandSubParensRows(rows, tableWidth);
        return [
            gridTable(
                expanded.values,
                tableWidth,
                pxToTwip(config.subRowHeight || 34),
                expanded.widths,
            ),
        ];
    }

    if (config.pattern === "grid") {
        const columns = Math.max(1, config.gridCols || 1);
        const colW = Math.floor(tableWidth / columns);
        const colWidths = Array.from({ length: columns }, () => colW);
        const rem = tableWidth - colW * columns;
        if (rem !== 0 && colWidths.length > 0) colWidths[colWidths.length - 1] += rem;

        return [
            gridTable(
                Array.from({ length: Math.max(1, config.gridRows) }, () =>
                    Array.from({ length: columns }, () => ""),
                ),
                tableWidth,
                pxToTwip(config.gridRowHeight || 32),
                colWidths,
            ),
        ];
    }

    if (config.pattern === "circle_comma") {
        const columns = Math.max(
            1,
            config.circleCols || config.circleCount || 1,
        );
        const rows = Math.max(1, config.circleRows || 1);
        const values = Array.from({ length: rows }, (_, row) =>
            Array.from({ length: columns }, (_, column) => {
                const index = row * columns + column;
                const label = CIRCLE_NUMBER_LABELS[index] || `${index + 1}`;
                return config.circleCommaEnabled ? `${label},` : label;
            }),
        );
        const colW = Math.floor(tableWidth / columns);
        const colWidths = Array.from({ length: columns }, () => colW);
        const rem = tableWidth - colW * columns;
        if (rem !== 0 && colWidths.length > 0) colWidths[colWidths.length - 1] += rem;

        return [
            gridTable(
                values,
                tableWidth,
                pxToTwip(config.circleHeight || 32),
                colWidths,
            ),
        ];
    }

    if (config.pattern === "split_2") {
        let leftRatio = 0.5;
        if (config.splitRatio === "30:70") leftRatio = 0.3;
        if (config.splitRatio === "70:30") leftRatio = 0.7;
        const leftWidth = Math.round(tableWidth * leftRatio);
        return [
            gridTable(
                [["", ""]],
                tableWidth,
                pxToTwip(config.splitHeight || 38),
                [leftWidth, tableWidth - leftWidth],
            ),
        ];
    }

    const children: (Paragraph | Table)[] = [];
    for (const group of resolveGroupedGroups(config)) {
        children.push(...groupToWordTables(group, tableWidth));
    }
    return children;
}

function groupSubParensRows(group: SubQuestionGroup): string[][] {
    if (group.subRowConfigs?.length) {
        return group.subRowConfigs.map((row) =>
            row.labels.map((label) => String(label ?? "")),
        );
    }

    const rows = Math.max(1, Number(group.subRows) || 1);
    const columns = Math.max(1, Number(group.subCols) || 1);
    const labels = group.subLabels || [];
    return Array.from({ length: rows }, (_, row) =>
        Array.from(
            { length: columns },
            (_, column) => labels[row * columns + column] || "",
        ),
    );
}

function groupToWordTables(
    group: SubQuestionGroup,
    width: number,
): (Paragraph | Table)[] {
    const labelWidth = group.label ? pxToTwip(34) : 0;
    const contentWidth = Math.max(1, width - labelWidth);
    const pattern = group.pattern || "sub_parens";
    const rowHeight = pxToTwip(group.height || 42);

    if (pattern === "sub_parens") {
        const values = groupSubParensRows(group).map((row) =>
            row.map((label) =>
                group.subCommaEnabled
                    ? `${label}${",".repeat(
                          Math.max(1, Number(group.subCommaCount) || 1),
                      )}`
                    : label,
            ),
        );
        const contentRows = values.length ? values : [[""]];
        const expanded = expandSubParensRows(contentRows, contentWidth);
        const rows = expanded.values.map((row, index) => [
            labelWidth && index === 0 ? group.label : "",
            ...row,
        ]);
        const fullWidths = [
            ...(labelWidth ? [labelWidth] : []),
            ...expanded.widths,
        ];
        return [
            gridTable(
                rows,
                width,
                Math.max(1, Math.round(rowHeight / contentRows.length)),
                fullWidths,
            ),
        ];
    }

    if (pattern === "split_2") {
        let ratio = 0.5;
        if (group.splitRatio === "30:70") ratio = 0.3;
        if (group.splitRatio === "70:30") ratio = 0.7;
        const leftW = labelWidth || Math.round(width * ratio);
        return [
            gridTable(
                [[group.label, ""]],
                width,
                rowHeight,
                [leftW, width - leftW],
            ),
        ];
    }

    const isEssayGrid = pattern === "essay" && group.essayLayout === "grid";
    const columns =
        pattern === "grid"
            ? Math.max(1, Number(group.gridCols) || 1)
            : pattern === "circle_comma"
              ? Math.max(1, Number(group.circleCols) || 1)
              : isEssayGrid
                ? Math.max(1, Number(group.essayCols) || 1)
                : 1;
    const rows =
        pattern === "grid"
            ? Math.max(1, Number(group.gridRows) || 1)
            : pattern === "circle_comma"
              ? Math.max(1, Number(group.circleRows) || 1)
              : Math.max(1, Number(group.essayRows) || 1);
    const values = Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => {
            if (pattern === "circle_comma") {
                const index = row * columns + column;
                const label = CIRCLE_NUMBER_LABELS[index] || `${index + 1}`;
                return group.circleCommaEnabled ? `${label},` : label;
            }
            return "";
        }),
    );
    const tableRows = values.map((row, index) => [
        labelWidth && index === 0 ? group.label : "",
        ...row,
    ]);

    const colWidth = Math.floor(contentWidth / columns);
    const subColWidths = Array.from({ length: columns }, () => colWidth);
    const colRemainder = contentWidth - colWidth * columns;
    if (colRemainder !== 0 && subColWidths.length > 0) {
        subColWidths[subColWidths.length - 1] += colRemainder;
    }

    return [
        gridTable(
            tableRows,
            width,
            Math.max(1, Math.round(rowHeight / rows)),
            [
                ...(labelWidth ? [labelWidth] : []),
                ...subColWidths,
            ],
        ),
    ];
}

function questionBlockChildren(
    config: QuestionBlockConfig,
    maxWidth = Number.POSITIVE_INFINITY,
): (Paragraph | Table)[] {
    const width = Math.max(
        200,
        Math.min(maxWidth, config.blockWidth || 630),
    );
    const rubricPart = config.rubric ? `[ ${config.rubric} ]` : "";
    const headerStr = `[${config.num || "1"}] ${rubricPart} ${config.points || ""}`.trim();

    return [
        wordParagraph(headerStr, {
            bold: true,
            size: 22,
            spacingBefore: 120,
            spacingAfter: 60,
        }),
        ...questionPatternTables(config, width),
    ];
}

function basicBlockChildren(
    block: ExportableBlock,
    maxWidth = Number.POSITIVE_INFINITY,
): (Paragraph | Table)[] {
    if (block.customType === "exam-header" && block.examHeaderConfig) {
        const config = block.examHeaderConfig;
        const width = pxToTwip(Math.min(maxWidth, config.width));
        return [
            gridTable(
                [[config.text]],
                width,
                pxToTwip(config.height),
                [width],
            ),
        ];
    }

    if (block.customType === "namebox" && block.nameboxConfig) {
        const config = block.nameboxConfig;
        const width = pxToTwip(Math.min(maxWidth, config.width));
        const fixedWidths = config.columnWidths || [40, 40, 40];
        const firstThree = fixedWidths.map((value) =>
            Math.min(pxToTwip(value), Math.floor(width / 4)),
        );
        const finalWidth = Math.max(
            1,
            width - firstThree.reduce((sum, value) => sum + value, 0),
        );
        const colWidths = [...firstThree, finalWidth];
        return [
            gridTable(
                [Array.from(config.labels)],
                width,
                pxToTwip(config.height),
                colWidths,
            ),
        ];
    }

    if (block.customType === "score-table" && block.scoreTableConfig) {
        const config = block.scoreTableConfig;
        const width = pxToTwip(Math.min(maxWidth, config.width));
        const columns = Math.max(1, config.colHeaders.length);
        const colW = Math.floor(width / columns);
        const colWidths = Array.from({ length: columns }, () => colW);
        const rem = width - colW * columns;
        if (rem !== 0 && colWidths.length > 0) colWidths[colWidths.length - 1] += rem;

        const rowHeights = config.rowHeights || [
            config.height / 2,
            config.height / 2,
        ];
        return [
            gridTable(
                [
                    Array.from(config.colHeaders),
                    Array.from(config.maxScores),
                ],
                width,
                rowHeights.map(pxToTwip),
                colWidths,
            ),
        ];
    }

    return [];
}

function getBlockWidth(block: ExportableBlock): number {
    return Math.max(
        1,
        Number(block.width || 0) * Math.abs(Number(block.scaleX || 1)),
    );
}

function getBlockTop(block: ExportableBlock): number {
    return Math.max(0, Number(block.top) || 0);
}

function convertBlockToElements(
    block: ExportableBlock,
    maxWidth: number,
): (Paragraph | Table)[] {
    if (block.customType === "question-block" && block.questionConfig) {
        return questionBlockChildren(block.questionConfig, maxWidth);
    }
    return basicBlockChildren(block, maxWidth);
}

/**
 * Fabricキャンバスの編集ブロックを、Word上で編集しやすい表・段落へ変換して出力する。
 * Wordネイティブの2段組セクションを活用し、テーブルの入れ子なしで確実な外枠描画と編集性を実現。
 */
export async function exportB4WordDocx(canvas: fabric.Canvas): Promise<void> {
    const sections = exportCanvasSections(canvas);
    const doc = new Document({
        sections,
    });

    const blob = await Packer.toBlob(doc);
    triggerDownload(
        blob,
        `解答用紙_B4横_${new Date().toISOString().slice(0, 10)}.docx`,
    );
}

function exportCanvasSections(canvas: fabric.Canvas): ISectionOptions[] {
    const pageSettings = {
        size: {
            // JIS B4 landscape (364mm x 257mm), in twips.
            width: PAGE_WIDTH_TWIP,
            height: PAGE_HEIGHT_TWIP,
            orientation: PageOrientation.LANDSCAPE,
        },
        margin: {
            top: PAGE_MARGIN_TWIP,
            bottom: PAGE_MARGIN_TWIP,
            left: PAGE_MARGIN_TWIP,
            right: PAGE_MARGIN_TWIP,
        },
    };

    const blocks = canvas
        .getObjects()
        .filter((object): object is ExportableBlock => {
            const block = object as ExportableBlock;
            return (
                block.customType === "question-block" ||
                block.customType === "exam-header" ||
                block.customType === "namebox" ||
                block.customType === "score-table"
            );
        })
        .sort((a, b) => getBlockTop(a) - getBlockTop(b));

    if (blocks.length === 0) {
        return [
            {
                properties: {
                    page: pageSettings,
                },
                children: [
                    new Paragraph({
                        children: [
                            wordText(
                                "解答用紙（編集対象のブロックがありません）",
                            ),
                        ],
                    }),
                ],
            },
        ];
    }

    const centerX = CANVAS_WIDTH_PX / 2;
    const halfWidthPx = CANVAS_WIDTH_PX / 2;

    // 1. 全幅要素（考査見出し等）と左右2列要素に分類
    const topFullBlocks: ExportableBlock[] = [];
    const leftBlocks: ExportableBlock[] = [];
    const rightBlocks: ExportableBlock[] = [];
    const bottomFullBlocks: ExportableBlock[] = [];

    for (const block of blocks) {
        const left = Math.max(0, Number(block.left) || 0);
        const width = getBlockWidth(block);
        const right = left + width;
        const crossesCenter = left < centerX - 40 && right > centerX + 40;

        if (crossesCenter || width > CANVAS_WIDTH_PX * 0.75) {
            // 全幅要素（用紙幅の75%以上または中央を大きく跨ぐ）
            if (getBlockTop(block) < 200) {
                topFullBlocks.push(block);
            } else {
                bottomFullBlocks.push(block);
            }
        } else if (right <= centerX + 30) {
            leftBlocks.push(block);
        } else {
            rightBlocks.push(block);
        }
    }

    const sections: ISectionOptions[] = [];

    // A. 上部全幅セクション（全幅ブロックが存在する場合）
    if (topFullBlocks.length > 0) {
        const topChildren: (Paragraph | Table)[] = [];
        for (const block of topFullBlocks) {
            topChildren.push(...convertBlockToElements(block, CANVAS_WIDTH_PX));
        }
        sections.push({
            properties: {
                type: SectionType.CONTINUOUS,
                page: pageSettings,
            },
            children: topChildren,
        });
    }

    // B. 本文 2段組セクション
    if (leftBlocks.length > 0 || rightBlocks.length > 0) {
        const twoColumnChildren: (Paragraph | Table)[] = [];

        // 左段のブロック
        for (const block of leftBlocks) {
            twoColumnChildren.push(
                ...convertBlockToElements(block, halfWidthPx - 20),
            );
        }

        // 右段へ移るための段区切り（ColumnBreak）
        if (rightBlocks.length > 0) {
            twoColumnChildren.push(
                new Paragraph({
                    children: [new ColumnBreak()],
                    spacing: { before: 0, after: 0 },
                }),
            );

            // 右段のブロック
            for (const block of rightBlocks) {
                twoColumnChildren.push(
                    ...convertBlockToElements(block, halfWidthPx - 20),
                );
            }
        }

        sections.push({
            properties: {
                type: SectionType.CONTINUOUS,
                page: pageSettings,
                column: {
                    count: 2,
                    space: pxToTwip(30), // 段間スペース
                },
            },
            children: twoColumnChildren,
        });
    }

    // C. 下部全幅セクション（存在する場合）
    if (bottomFullBlocks.length > 0) {
        const bottomChildren: (Paragraph | Table)[] = [];
        for (const block of bottomFullBlocks) {
            bottomChildren.push(
                ...convertBlockToElements(block, CANVAS_WIDTH_PX),
            );
        }
        sections.push({
            properties: {
                type: SectionType.CONTINUOUS,
                page: pageSettings,
            },
            children: bottomChildren,
        });
    }

    // セクションが空の場合はデフォルト1セクションを返す
    if (sections.length === 0) {
        sections.push({
            properties: {
                page: pageSettings,
            },
            children: [
                new Paragraph({
                    children: [wordText("解答用紙")],
                }),
            ],
        });
    }

    return sections;
}
