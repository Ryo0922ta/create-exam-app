/**
 * 問題文テキストから (1), (2), ①, ②, (ア), (イ), [1], 【1】 などの小問記号を抽出し、
 * 重複を除外したユニーク配列として返す
 */
export function extractSymbolsFromText(text: string): string[] {
    if (!text) return [];

    const regex =
        /(\([0-9０-９a-zA-Zぁ-んァ-ヶ]+\)|\[[0-9a-zA-Z]+\]|〔[0-9a-zA-Z]+〕|【[0-9a-zA-Z]+】|[①-⑳㉑-㉟])/g;
    const matches = text.match(regex) || [];

    const uniqueList: string[] = [];
    const seen = new Set<string>();

    for (const sym of matches) {
        const normalized = sym.trim();
        if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            uniqueList.push(normalized);
        }
    }

    return uniqueList;
}
