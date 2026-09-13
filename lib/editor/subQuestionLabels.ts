import { SubQuestionLabelType } from "@/types/editor";

const CIRCLED_NUMBERS = Array.from(
    "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳",
);
const KANA_LABELS = Array.from("アイウエオカキクケコサシスセソタチツテト");

export const SUB_QUESTION_LABEL_OPTIONS: {
    value: SubQuestionLabelType;
    label: string;
}[] = [
    { value: "circle", label: "丸数字（①②③）" },
    { value: "kana", label: "カタカナ（ア・イ・ウ）" },
    { value: "alpha", label: "英字（a・b・c）" },
    { value: "number", label: "数字（1・2・3）" },
    { value: "none", label: "ラベルなし" },
    { value: "manual", label: "手動入力" },
];

export function createSubQuestionLabels(
    labelType: SubQuestionLabelType,
    count: number,
): string[] {
    const safeCount = Math.max(1, count);
    if (labelType === "none") return Array(safeCount).fill("");
    if (labelType === "manual") return Array(safeCount).fill("");
    if (labelType === "circle") {
        return Array.from(
            { length: safeCount },
            (_, index) => CIRCLED_NUMBERS[index] || String(index + 1),
        );
    }
    if (labelType === "kana") {
        return Array.from(
            { length: safeCount },
            (_, index) => `(${KANA_LABELS[index] || String(index + 1)})`,
        );
    }
    if (labelType === "alpha") {
        return Array.from({ length: safeCount }, (_, index) => {
            let value = index;
            let result = "";
            do {
                result = String.fromCharCode(97 + (value % 26)) + result;
                value = Math.floor(value / 26) - 1;
            } while (value >= 0);
            return `(${result})`;
        });
    }
    return Array.from({ length: safeCount }, (_, index) => `(${index + 1})`);
}
