import { ExamPreview, QuestionGroups } from "@/types/exam";
import { LayoutSettings } from "@/types/layout";
import { Question } from "@/types/question";

export function createLayoutSettings(
    parsedQuestions: Question[],
): LayoutSettings {
    return {
        choice: {
            count: parsedQuestions.filter((question) => question.type === "4択")
                .length,
            columns: 5,
            rows: 2,
        },
        word: {
            count: parsedQuestions.filter(
                (question) => question.type === "単語",
            ).length,
            columns: 5,
            rows: 7,
        },
        essay: {
            count: parsedQuestions.filter(
                (question) => question.type === "自由記述",
            ).length,
            columns: 1,
            rows: 5,
        },
    };
}

export function groupQuestions(questions: Question[]): QuestionGroups {
    return {
        choiceQuestions: questions.filter(
            (question): question is Extract<Question, { type: "4択" }> =>
                question.type === "4択",
        ),
        wordQuestions: questions.filter(
            (question): question is Extract<Question, { type: "単語" }> =>
                question.type === "単語",
        ),
        essayQuestions: questions.filter(
            (question): question is Extract<Question, { type: "自由記述" }> =>
                question.type === "自由記述",
        ),
    };
}

export function createExamPreview(
    questions: Question[],
    settings: LayoutSettings | null,
): ExamPreview {
    const allQuestions = groupQuestions(questions);
    const choiceQuestions = allQuestions.choiceQuestions.slice(
        0,
        settings?.choice.count,
    );
    const wordQuestions = allQuestions.wordQuestions.slice(
        0,
        settings?.word.count,
    );
    const essayQuestions = allQuestions.essayQuestions.slice(
        0,
        settings?.essay.count,
    );
    const previewQuestions = [
        ...choiceQuestions,
        ...wordQuestions,
        ...essayQuestions,
    ]
        .sort((first, second) => first.id - second.id)
        .map((question, index) => ({
            question,
            displayNumber: index + 1,
        }));

    return {
        choiceQuestions,
        wordQuestions,
        essayQuestions,
        previewQuestions,
        displayNumbers: new Map(
            previewQuestions.map(({ question, displayNumber }) => [
                question.id,
                displayNumber,
            ]),
        ),
    };
}

export function validateLayoutSettings(
    settings: LayoutSettings,
    availableQuestions: QuestionGroups,
): string | null {
    const labels = {
        choice: "選択問題",
        word: "単語回答",
        essay: "自由記述",
    };

    for (const type of ["choice", "word", "essay"] as const) {
        const layout = settings[type];
        const availableCount = availableQuestions[`${type}Questions`].length;

        if (layout.count > availableCount) {
            return `${labels[type]}の表示件数は、CSV内の${availableCount}問以下にしてください。`;
        }
        if (layout.columns * layout.rows < layout.count) {
            return `${labels[type]}は、横×縦が表示件数以上になるように指定してください。`;
        }
    }

    return null;
}
