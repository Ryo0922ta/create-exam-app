import { fabric } from "fabric";
import {
    ShortAnswerOptions,
    HeaderBlockOptions,
    TitleBlockOptions,
    EssayBlockOptions,
    CharGridBlockOptions,
    LabelType,
} from "@/types/editor";

export interface CustomFabricObject extends fabric.Object {
    customType?: string;
}

export function getLabelChar(index: number, labelType: LabelType): string {
    if (labelType === "none") return "";
    if (labelType === "alpha") return String.fromCharCode(97 + (index % 26)); // a, b, c...
    if (labelType === "num") return String(index + 1);
    if (labelType === "kata") {
        const katas = [
            "ア",
            "イ",
            "ウ",
            "エ",
            "オ",
            "カ",
            "キ",
            "ク",
            "ケ",
            "コ",
            "サ",
            "シ",
            "ス",
            "セ",
            "ソ",
            "タ",
            "チ",
            "ツ",
            "テ",
            "ト",
            "ナ",
            "ニ",
            "ヌ",
            "ネ",
            "ノ",
            "ハ",
            "ヒ",
            "フ",
            "ヘ",
            "ホ",
            "マ",
            "ミ",
            "ム",
            "メ",
            "モ",
            "ヤ",
            "ユ",
            "ヨ",
            "ラ",
            "リ",
            "ル",
            "レ",
            "ロ",
            "ワ",
            "ヲ",
            "ン",
        ];
        return katas[index % katas.length];
    }
    if (labelType === "kanji") {
        const kanjis = [
            "一",
            "二",
            "三",
            "四",
            "五",
            "六",
            "七",
            "八",
            "九",
            "十",
        ];
        return kanjis[index % kanjis.length];
    }
    return "";
}

/**
 * 短答ブロック（大問番号、小問番号、グリッド解答枠）を生成
 */
export function createShortAnswerBlock(
    options: ShortAnswerOptions = {},
): fabric.Group {
    const {
        qNo = "1",
        subNo = "(1)",
        rows = 3,
        cols = 4,
        labelType = "alpha",
        left = 40,
        top = 220,
    } = options;

    const groupItems: fabric.Object[] = [];
    const cellHeight = 28;
    const labelWidth = 32;
    const answerWidth = 90;
    const colWidth = labelWidth + answerWidth;
    const totalGridHeight = cellHeight * rows;

    // 1. 大問番号 [1]
    if (qNo && qNo.trim() !== "") {
        const qBoxWidth = 26;
        const qBox = new fabric.Rect({
            left: 0,
            top: 0,
            width: qBoxWidth,
            height: 28,
            fill: "#ffffff",
            stroke: "#1e293b",
            strokeWidth: 1.5,
            rx: 2,
            ry: 2,
        });
        const qText = new fabric.Text(String(qNo), {
            left: qBoxWidth / 2,
            top: 14,
            fontSize: 14,
            fontFamily: "Noto Sans JP, sans-serif",
            fontWeight: "bold",
            originX: "center",
            originY: "center",
            fill: "#0f172a",
        });
        groupItems.push(qBox, qText);
    }

    const hasQNo = Boolean(qNo && qNo.trim() !== "");
    const gridStartX = hasQNo ? 34 : 0;

    // 2. 小問番号 (1) 枠
    const hasSubNo = Boolean(subNo && subNo.trim() !== "");
    if (hasSubNo) {
        const subBox = new fabric.Rect({
            left: gridStartX,
            top: 0,
            width: 32,
            height: totalGridHeight,
            fill: "#f0fdfa",
            stroke: "#0f172a",
            strokeWidth: 1.5,
        });
        const subText = new fabric.Text(String(subNo), {
            left: gridStartX + 16,
            top: totalGridHeight / 2,
            fontSize: 12,
            fontFamily: "Noto Sans JP, sans-serif",
            originX: "center",
            originY: "center",
            fill: "#0f172a",
        });
        groupItems.push(subBox, subText);
    }

    const cellsStartX = gridStartX + (hasSubNo ? 32 : 0);

    // 3. 各セルの描画
    let itemCounter = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = cellsStartX + c * colWidth;
            const y = r * cellHeight;

            // ラベル枠 (a, b, c ...)
            const lblRect = new fabric.Rect({
                left: x,
                top: y,
                width: labelWidth,
                height: cellHeight,
                fill: "#ffffff",
                stroke: "#0f172a",
                strokeWidth: 1.2,
            });
            const lblText = new fabric.Text(
                getLabelChar(itemCounter, labelType),
                {
                    left: x + labelWidth / 2,
                    top: y + cellHeight / 2,
                    fontSize: 12,
                    fontFamily: "Noto Sans JP, sans-serif",
                    originX: "center",
                    originY: "center",
                    fill: "#334155",
                },
            );

            // 解答欄（薄い水色の塗りつぶし背景）
            const ansRect = new fabric.Rect({
                left: x + labelWidth,
                top: y,
                width: answerWidth,
                height: cellHeight,
                fill: "#f0f9ff",
                stroke: "#0f172a",
                strokeWidth: 1.2,
            });

            groupItems.push(lblRect, lblText, ansRect);
            itemCounter++;
        }
    }

    const group = new fabric.Group(groupItems, {
        left: left,
        top: top,
        subTargetCheck: false,
    }) as CustomFabricObject;
    group.customType = "短答欄";

    return group as fabric.Group;
}

/**
 * 年組氏名・得点欄パーツ生成
 */
export function createHeaderBlock(
    options: HeaderBlockOptions = {},
): fabric.Group {
    const { left = 230, top = 80 } = options;
    const items: fabric.Object[] = [];
    const h = 32;

    // 年
    items.push(
        new fabric.Rect({
            left: 0,
            top: 0,
            width: 40,
            height: h,
            fill: "#ffffff",
            stroke: "#0f172a",
            strokeWidth: 1.2,
        }),
    );
    items.push(
        new fabric.Text("年", {
            left: 20,
            top: h / 2,
            fontSize: 13,
            originX: "center",
            originY: "center",
            fontFamily: "Noto Sans JP, sans-serif",
        }),
    );
    items.push(
        new fabric.Rect({
            left: 40,
            top: 0,
            width: 45,
            height: h,
            fill: "#ffffff",
            stroke: "#0f172a",
            strokeWidth: 1.2,
        }),
    );

    // 組
    items.push(
        new fabric.Rect({
            left: 85,
            top: 0,
            width: 40,
            height: h,
            fill: "#ffffff",
            stroke: "#0f172a",
            strokeWidth: 1.2,
        }),
    );
    items.push(
        new fabric.Text("組", {
            left: 105,
            top: h / 2,
            fontSize: 13,
            originX: "center",
            originY: "center",
            fontFamily: "Noto Sans JP, sans-serif",
        }),
    );

    // 名前
    items.push(
        new fabric.Rect({
            left: 125,
            top: 0,
            width: 55,
            height: h,
            fill: "#ffffff",
            stroke: "#0f172a",
            strokeWidth: 1.2,
        }),
    );
    items.push(
        new fabric.Text("名前", {
            left: 152,
            top: h / 2,
            fontSize: 13,
            originX: "center",
            originY: "center",
            fontFamily: "Noto Sans JP, sans-serif",
        }),
    );
    items.push(
        new fabric.Rect({
            left: 180,
            top: 0,
            width: 140,
            height: h,
            fill: "#ffffff",
            stroke: "#0f172a",
            strokeWidth: 1.2,
        }),
    );

    // 得点枠
    items.push(
        new fabric.Rect({
            left: 335,
            top: -4,
            width: 68,
            height: h + 12,
            rx: 2,
            ry: 2,
            fill: "#ffffff",
            stroke: "#0f172a",
            strokeWidth: 1.5,
        }),
    );
    items.push(
        new fabric.Text("点", {
            left: 390,
            top: h,
            fontSize: 11,
            fill: "#64748b",
            originX: "right",
            originY: "bottom",
            fontFamily: "Noto Sans JP, sans-serif",
        }),
    );

    const headerGroup = new fabric.Group(items, {
        left: left,
        top: top,
    }) as CustomFabricObject;
    headerGroup.customType = "年組氏名・得点欄";

    return headerGroup as fabric.Group;
}

/**
 * タイトルテキスト作成
 */
export function createTitleBlock(
    options: TitleBlockOptions = {},
): fabric.IText {
    const { text = "社会科の復習", left = 60, top = 70 } = options;
    const title = new fabric.IText(text, {
        left: left,
        top: top,
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "Noto Sans JP, sans-serif",
        fill: "#0f172a",
    }) as CustomFabricObject;
    title.customType = "タイトル";

    return title as fabric.IText;
}

/**
 * 記述式解答枠生成
 */
export function createEssayBlock(
    options: EssayBlockOptions = {},
): fabric.Group {
    const { lines = 2, left = 60, top = 380 } = options;
    const items: fabric.Object[] = [];
    const totalWidth = 560;
    const lineH = 26;
    const totalHeight = lines * lineH;

    // 外枠
    items.push(
        new fabric.Rect({
            left: 0,
            top: 0,
            width: totalWidth,
            height: totalHeight,
            fill: "#f0f9ff",
            stroke: "#0f172a",
            strokeWidth: 1.2,
        }),
    );

    // 罫線（点線）
    for (let i = 1; i < lines; i++) {
        items.push(
            new fabric.Line([0, i * lineH, totalWidth, i * lineH], {
                stroke: "#94a3b8",
                strokeWidth: 1,
                strokeDashArray: [4, 4],
            }),
        );
    }

    const essayGroup = new fabric.Group(items, {
        left: left,
        top: top,
    }) as CustomFabricObject;
    essayGroup.customType = `記述欄(${lines}行)`;

    return essayGroup as fabric.Group;
}

/**
 * 字数マス目ブロック（作文・要約等）
 */
export function createCharGridBlock(
    options: CharGridBlockOptions = {},
): fabric.Group {
    const { chars = 20, left = 60, top = 480 } = options;
    const items: fabric.Object[] = [];
    const cellSize = 22;
    const perRow = Math.min(chars, 20);
    const rows = Math.ceil(chars / perRow);

    let count = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < perRow; c++) {
            if (count >= chars) break;
            const x = c * cellSize;
            const y = r * cellSize;
            items.push(
                new fabric.Rect({
                    left: x,
                    top: y,
                    width: cellSize,
                    height: cellSize,
                    fill: "#ffffff",
                    stroke: "#64748b",
                    strokeWidth: 1,
                }),
            );
            count++;
        }
    }

    const gridGroup = new fabric.Group(items, {
        left: left,
        top: top,
    }) as CustomFabricObject;
    gridGroup.customType = `マス目(${chars}字)`;

    return gridGroup as fabric.Group;
}

/**
 * 見本サンプルレイアウトの復元
 */
export function loadSampleLayout(canvas: fabric.Canvas): void {
    canvas.clear();
    canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));

    // 1. タイトル
    const title = createTitleBlock({ text: "社会科の復習", left: 60, top: 65 });
    canvas.add(title);

    // 2. 年組氏名欄
    const header = createHeaderBlock({ left: 230, top: 80 });
    canvas.add(header);

    // 3. 短答解答欄 (大問1, (1), 2行4列 a〜h)
    const shortBlock = createShortAnswerBlock({
        qNo: "1",
        subNo: "(1)",
        rows: 2,
        cols: 4,
        labelType: "alpha",
        left: 45,
        top: 170,
    });
    canvas.add(shortBlock);

    // 3行目の端数 (i のみ)
    const extraItems: fabric.Object[] = [];
    const h = 28;
    extraItems.push(
        new fabric.Rect({
            left: 0,
            top: 0,
            width: 32,
            height: h,
            fill: "#ffffff",
            stroke: "#0f172a",
            strokeWidth: 1.2,
        }),
    );
    extraItems.push(
        new fabric.Text("i", {
            left: 16,
            top: h / 2,
            fontSize: 12,
            originX: "center",
            originY: "center",
            fontFamily: "Noto Sans JP, sans-serif",
            fill: "#334155",
        }),
    );
    extraItems.push(
        new fabric.Rect({
            left: 32,
            top: 0,
            width: 90,
            height: h,
            fill: "#f0f9ff",
            stroke: "#0f172a",
            strokeWidth: 1.2,
        }),
    );

    const extraGroup = new fabric.Group(extraItems, {
        left: 45 + 34 + 32,
        top: 170 + 56,
    }) as CustomFabricObject;
    extraGroup.customType = "端数セル";
    canvas.add(extraGroup);

    // 4. 記述欄
    const essay = createEssayBlock({ lines: 3, left: 45, top: 300 });
    canvas.add(essay);

    // 5. マス目欄
    const charGrid = createCharGridBlock({ chars: 40, left: 45, top: 410 });
    canvas.add(charGrid);

    canvas.renderAll();
}
