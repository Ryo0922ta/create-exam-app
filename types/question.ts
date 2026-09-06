/**
 * 問題形式の種別
 */
export type QuestionType = "4択" | "単語" | "自由記述";

/**
 * 共通の問題プロパティ
 */
export interface BaseQuestion {
    id: number;
    type: QuestionType;
    questionText: string;
}

/**
 * 4択問題
 */
export interface ChoiceQuestion extends BaseQuestion {
    type: "4択";
    option1: string;
    option2: string;
    option3: string;
    option4: string;
}

/**
 * 単語回答型（一問一答・用語記述）
 */
export interface WordQuestion extends BaseQuestion {
    type: "単語";
}

/**
 * 自由記述回答型（文字数制限あり/なし）
 */
export interface EssayQuestion extends BaseQuestion {
    type: "自由記述";
    maxChars?: number;
}

/**
 * 問題全体のユニオン型
 */
export type Question = ChoiceQuestion | WordQuestion | EssayQuestion;

/**
 * CSVパース時の生の行データ型定義（日本語ヘッダー対応）
 */
export interface RawCsvRow {
    問題番号?: string;
    問題形式?: string;
    問題文?: string;
    選択肢1?: string;
    選択肢2?: string;
    選択肢3?: string;
    選択肢4?: string;
    文字数制限?: string;
    [key: string]: string | undefined;
}

/**
 * CSVパース結果のレスポンス型
 */
export interface ParseCsvResult {
    questions: Question[];
    errors: string[];
}
