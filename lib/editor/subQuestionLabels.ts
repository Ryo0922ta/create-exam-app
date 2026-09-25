import { SubQuestionLabelType } from "@/types/editor";

const CIRCLED_NUMBERS = Array.from(
    "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳",
);
const KANA_LABELS = Array.from("アイウエオカキクケコサシスセソタチツテト");
const HALFWIDTH_KANA_LABELS = Array.from(
    "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ",
);
const HIRAGANA_LABELS = Array.from(
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん",
);
const IROHA_LABELS = Array.from(
    "イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス",
);
const ROMAN_LOWER_LABELS = Array.from("ⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹⅺⅻ");
const ROMAN_UPPER_LABELS = Array.from("ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ");

export const SUB_QUESTION_LABEL_OPTIONS: {
    value: SubQuestionLabelType;
    label: string;
}[] = [
    { value: "circle", label: "丸数字（①②③）" },
    { value: "number", label: "数字（括弧）（1・2・3）" },
    { value: "alpha", label: "英小文字（括弧）（a・b・c）" },
    { value: "alpha_upper", label: "英大文字（括弧）（A・B・C）" },
    { value: "kana", label: "カタカナ（括弧）（ア・イ・ウ）" },
    { value: "halfwidth_kana", label: "半角カタカナ（括弧）（ｱ・ｲ・ｳ）" },
    { value: "hiragana", label: "ひらがな（括弧）（あ・い・う）" },
    { value: "iroha", label: "イロハ（括弧）（イ・ロ・ハ）" },
    { value: "roman_lower", label: "ローマ数字小文字（ⅰ・ⅱ・ⅲ）" },
    { value: "roman_upper", label: "ローマ数字大文字（Ⅰ・Ⅱ・Ⅲ）" },
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
    if (labelType === "halfwidth_kana") {
        return Array.from(
            { length: safeCount },
            (_, index) =>
                `(${HALFWIDTH_KANA_LABELS[index] || String(index + 1)})`,
        );
    }
    if (labelType === "hiragana") {
        return Array.from(
            { length: safeCount },
            (_, index) => `(${HIRAGANA_LABELS[index] || String(index + 1)})`,
        );
    }
    if (labelType === "iroha") {
        return Array.from(
            { length: safeCount },
            (_, index) => `(${IROHA_LABELS[index] || String(index + 1)})`,
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
    if (labelType === "alpha_upper") {
        return Array.from({ length: safeCount }, (_, index) => {
            let value = index;
            let result = "";
            do {
                result =
                    String.fromCharCode(65 + (value % 26)) + result;
                value = Math.floor(value / 26) - 1;
            } while (value >= 0);
            return `(${result})`;
        });
    }
    if (labelType === "roman_lower") {
        return Array.from(
            { length: safeCount },
            (_, index) => ROMAN_LOWER_LABELS[index] || String(index + 1),
        );
    }
    if (labelType === "roman_upper") {
        return Array.from(
            { length: safeCount },
            (_, index) => ROMAN_UPPER_LABELS[index] || String(index + 1),
        );
    }
    return Array.from({ length: safeCount }, (_, index) => `(${index + 1})`);
}
