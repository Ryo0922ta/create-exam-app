export type QuestionLayout = {
    count: number;
    columns: number;
    rows: number;
};

export type LayoutSettings = {
    choice: QuestionLayout;
    word: QuestionLayout;
    essay: QuestionLayout;
};
