import Papa from "papaparse";
import {
    Question,
    RawCsvRow,
    ParseCsvResult,
    QuestionType,
} from "@/types/question";

/**
 * File オブジェクトから文字コード（UTF-8 または Shift-JIS）を自動判別して文字列に変換する
 */
export async function decodeCsvFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();

    try {
        // まず UTF-8 としてデコード（fatal: true で不正バイトがあればエラーを投げる）
        const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
        return utf8Decoder.decode(buffer);
    } catch {
        // UTF-8 デコードに失敗した場合、Shift-JIS (CP932 / Windows-31J) としてデコード
        const sjisDecoder = new TextDecoder("shift_jis");
        return sjisDecoder.decode(buffer);
    }
}

/**
 * 文字列から問題形式を正規化する
 */
function normalizeQuestionType(typeStr?: string): QuestionType {
    if (!typeStr) return "4択";
    const trimmed = typeStr.trim();
    if (trimmed === "単語" || trimmed === "語句" || trimmed === "一問一答") {
        return "単語";
    }
    if (trimmed === "自由記述" || trimmed === "記述" || trimmed === "論述") {
        return "自由記述";
    }
    return "4択";
}

/**
 * CSV文字列をパースして Question 型の配列に変換する
 */
export function parseQuestionsCsv(csvText: string): ParseCsvResult {
    const errors: string[] = [];
    const questions: Question[] = [];

    const parsed = Papa.parse<RawCsvRow>(csvText, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (header) => header.trim(),
    });

    // PapaParseのエラーのうち、「TooFewFields / TooManyFields」など空セル由来の軽微な警告は除外
    if (parsed.errors.length > 0) {
        parsed.errors.forEach((err) => {
            // 末尾の空列や文字数制限などの省略時に発生する TooFewFields はスキップ
            if (err.code === "TooFewFields" || err.code === "TooManyFields") {
                return;
            }
            errors.push(
                `行 ${err.row !== undefined ? err.row + 1 : "?"}: ${err.message}`,
            );
        });
    }

    // 必須ヘッダーの存在確認（問題番号と問題文は必須）
    const requiredHeaders = ["問題番号", "問題文"];
    const headers = parsed.meta.fields || [];
    const missingHeaders = requiredHeaders.filter(
        (req) => !headers.includes(req),
    );

    if (missingHeaders.length > 0) {
        errors.push(
            `必要なヘッダーが見つかりません: ${missingHeaders.join(", ")} (現在のヘッダー: ${headers.join(", ") || "なし"})`,
        );
        return { questions: [], errors };
    }

    // 各行のデータを Question 型にマッピング
    parsed.data.forEach((row, index) => {
        const rowNum = index + 2; // ヘッダー行 + 1-indexed

        const idStr = row["問題番号"]?.trim();
        const questionText = row["問題文"]?.trim() || "";
        const rawType = row["問題形式"]?.trim();
        const questionType = normalizeQuestionType(rawType);

        const id = idStr ? parseInt(idStr, 10) : index + 1;

        if (isNaN(id)) {
            errors.push(
                `行 ${rowNum}: 問題番号 "${idStr}" は有効な数値ではありません。`,
            );
            return;
        }

        if (!questionText) {
            errors.push(`行 ${rowNum}: 問題文が空です。`);
            return;
        }

        if (questionType === "単語") {
            questions.push({
                id,
                type: "単語",
                questionText,
            });
        } else if (questionType === "自由記述") {
            const maxCharsStr = row["文字数制限"]?.trim();
            let maxChars: number | undefined = undefined;
            if (maxCharsStr) {
                const parsedNum = parseInt(maxCharsStr, 10);
                if (!isNaN(parsedNum) && parsedNum > 0) {
                    maxChars = parsedNum;
                }
            }

            questions.push({
                id,
                type: "自由記述",
                questionText,
                ...(maxChars ? { maxChars } : {}),
            });
        } else {
            // 4択問題
            const option1 = row["選択肢1"]?.trim() || "";
            const option2 = row["選択肢2"]?.trim() || "";
            const option3 = row["選択肢3"]?.trim() || "";
            const option4 = row["選択肢4"]?.trim() || "";

            questions.push({
                id,
                type: "4択",
                questionText,
                option1,
                option2,
                option3,
                option4,
            });
        }
    });

    return { questions, errors };
}

/**
 * Question 配列を CSV 文字列に変換し、ブラウザ上でダウンロードさせる
 */
export function exportQuestionsToCsv(
    questions: Question[],
    originalFileName?: string | null,
): void {
    const rows = questions.map((q) => {
        const isChoice = q.type === "4択";
        const isEssay = q.type === "自由記述";

        return {
            問題番号: q.id,
            問題形式: q.type,
            問題文: q.questionText,
            選択肢1: isChoice ? q.option1 : "",
            選択肢2: isChoice ? q.option2 : "",
            選択肢3: isChoice ? q.option3 : "",
            選択肢4: isChoice ? q.option4 : "",
            文字数制限: isEssay ? (q.maxChars ?? "") : "",
        };
    });

    const csvContent = Papa.unparse(rows, {
        header: true,
    });

    // 日本語のExcel・エディタでの文字化け防止のため BOM を付加
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
        type: "text/csv;charset=utf-8;",
    });

    let downloadName = "questions_edited.csv";
    if (originalFileName) {
        if (/\.csv$/i.test(originalFileName)) {
            downloadName = originalFileName.replace(/\.csv$/i, "_edited.csv");
        } else {
            downloadName = `${originalFileName}_edited.csv`;
        }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
