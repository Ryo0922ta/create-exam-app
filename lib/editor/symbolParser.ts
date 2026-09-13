import { SubQuestionGroup } from "@/types/editor";

/**
 * 問題文テキストから (1), (2), ①, ②, [1], 【1】 などの小問記号を抽出し、
 * 重複を除外したユニーク配列として返す。
 * (ア) / (ｱ) などカタカナのみの括弧記号は除外する。
 */
export function extractSymbolsFromText(text: string): string[] {
    if (!text) return [];

    const regex =
        /([（(][0-9０-９a-zA-ZＡ-Ｚａ-ｚぁ-んァ-ヶｦ-ﾟ]+[）)]|\[[0-9０-９a-zA-ZＡ-Ｚａ-ｚ]+\]|〔[0-9０-９a-zA-ZＡ-Ｚａ-ｚ]+〕|【[0-9０-９a-zA-ZＡ-Ｚａ-ｚ]+】|[①-⑳㉑-㉟])/g;
    const matches = text.match(regex) || [];

    const uniqueList: string[] = [];
    const seen = new Set<string>();

    for (const sym of matches) {
        const normalized = sym.trim();
        if (
            normalized &&
            !seen.has(normalized) &&
            !isExcludedKanaParenSymbol(normalized)
        ) {
            seen.add(normalized);
            uniqueList.push(normalized);
        }
    }

    return uniqueList;
}

export type ParsedQuestionGroup = {
    label: string;
    sourceText: string;
    labels: string[];
    unclassifiedLabels: string[];
    suggestedPattern: "sub_parens" | "grid" | "circle_comma" | "split_2" | "essay";
};

const QUESTION_LABEL_CHARS =
    "0-9０-９a-zA-ZＡ-Ｚａ-ｚぁ-んァ-ヶｦ-ﾟ";
const QUESTION_MARKER_REGEX = `[（(]([${QUESTION_LABEL_CHARS}]+)[）)]`;
const TOP_LEVEL_QUESTION_REGEX = new RegExp(
    `^[ \\t　]*${QUESTION_MARKER_REGEX}`,
    "gm",
);
const QUESTION_MARKER_ONLY_REGEX = new RegExp(
    `^${QUESTION_MARKER_REGEX}$`,
);
function normalizeQuestionLabel(label: string): string {
    return label.normalize("NFKC");
}

/** 括弧内がカタカナのみか（(ア), (ｱ), （イ）など） */
function isKatakanaOnlyLabel(label: string): boolean {
    const normalized = normalizeQuestionLabel(label);
    return /^[ァ-ヶー]+$/.test(normalized);
}

/** (ア) / (ｱ) / （ア）など、カタカナのみの括弧記号を除外する */
function isExcludedKanaParenSymbol(symbol: string): boolean {
    const match = symbol.match(QUESTION_MARKER_ONLY_REGEX);
    if (!match) return false;
    return isKatakanaOnlyLabel(match[1]);
}

function normalizeQuestionMarker(marker: string): string {
    const match = marker.match(QUESTION_MARKER_ONLY_REGEX);
    if (!match) return marker;
    return `(${normalizeQuestionLabel(match[1])})`;
}

function uniqueLabels(labels: string[]): string[] {
    return Array.from(new Set(labels.map((label) => label.trim()).filter(Boolean)));
}

/**
 * 問題文をトップレベルの数字小問と、その範囲内のラベル候補へ分解する。
 * 自動判定は候補生成に限定し、最終的なパターンは編集UIで変更できる。
 */
export function parseQuestionGroups(text: string): ParsedQuestionGroup[] {
    if (!text.trim()) return [];

    const markers = Array.from(text.matchAll(TOP_LEVEL_QUESTION_REGEX)).filter(
        (marker) => !isKatakanaOnlyLabel(marker[1]),
    );
    if (markers.length === 0) return [];

    return markers.map((marker, index) => {
        const markerStart =
            (marker.index ?? 0) + marker[0].search(/[（(]/);
        const nextMarker = markers[index + 1];
        const end =
            nextMarker
                ? (nextMarker.index ?? text.length) +
                  nextMarker[0].search(/[（(]/)
                : text.length;
        const sourceText = text.slice(markerStart, end).trim();
        const ownMarker = normalizeQuestionMarker(marker[0].trim());
        const symbols = extractSymbolsFromText(sourceText).filter(
            (symbol) => normalizeQuestionMarker(symbol) !== ownMarker,
        );
        const labels = uniqueLabels(symbols);
        const suggestedPattern =
            labels.length > 0 ? "sub_parens" : "essay";

        return {
            label: normalizeQuestionLabel(marker[1]),
            sourceText,
            labels,
            unclassifiedLabels: [],
            suggestedPattern,
        };
    });
}

export function convertParsedGroupsToSubQuestionGroups(
    parsedGroups: ParsedQuestionGroup[],
): SubQuestionGroup[] {
    return parsedGroups.map((parsed) => {
        const labels = uniqueLabels([
            ...parsed.labels,
            ...parsed.unclassifiedLabels,
        ]);
        if (parsed.suggestedPattern === "circle_comma") {
            return {
                label: parsed.label,
                height: 42,
                pattern: "circle_comma",
                circleRows: 1,
                circleCols: Math.max(1, labels.length),
                circleCommaEnabled: false,
                circleCommaPaddingAuto: true,
                circleCommaPaddingRatio: 0.45,
                unclassifiedLabels: parsed.unclassifiedLabels,
            };
        }
        if (parsed.suggestedPattern === "essay") {
            return {
                label: parsed.label,
                height: 42,
                pattern: "essay",
                unclassifiedLabels: parsed.unclassifiedLabels,
            };
        }
        return {
            label: parsed.label,
            height: 42,
            pattern: "sub_parens",
            subRows: 1,
            subCols: Math.max(1, labels.length),
            subLabels: labels,
            unclassifiedLabels: parsed.unclassifiedLabels,
        };
    });
}
