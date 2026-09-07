import {
    ChoiceQuestion,
    EssayQuestion,
    Question,
    WordQuestion,
} from "@/types/question";

export type NumberedQuestion = {
    question: Question;
    displayNumber: number;
};

export type QuestionGroups = {
    choiceQuestions: ChoiceQuestion[];
    wordQuestions: WordQuestion[];
    essayQuestions: EssayQuestion[];
};

export type ExamPreview = QuestionGroups & {
    previewQuestions: NumberedQuestion[];
    displayNumbers: ReadonlyMap<number, number>;
};
