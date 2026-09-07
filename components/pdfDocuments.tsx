import {
    Document,
    Font,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";
import { NumberedQuestion } from "@/types/exam";
import { LayoutSettings } from "@/types/layout";
import { Question } from "@/types/question";

Font.register({
    family: "NotoSansJP",
    src: "/fonts/NotoSansJP-Regular.otf",
});

type QuestionSheetDocumentProps = {
    questions: NumberedQuestion[];
};

type AnswerSheetDocumentProps = {
    choiceQuestions: Question[];
    wordQuestions: Question[];
    essayQuestions: Question[];
    displayNumbers: ReadonlyMap<number, number>;
    layout: LayoutSettings;
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 48,
        paddingRight: 48,
        paddingBottom: 48,
        paddingLeft: 48,
        fontFamily: "NotoSansJP",
        fontSize: 10,
        color: "#000000",
    },
    title: {
        marginBottom: 18,
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: "#000000",
        fontSize: 18,
    },
    question: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#9ca3af",
    },
    questionText: {
        fontSize: 11,
        lineHeight: 1.6,
    },
    options: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    option: {
        width: "50%",
        paddingRight: 12,
        marginBottom: 4,
        lineHeight: 1.5,
    },
    note: {
        marginTop: 8,
        fontSize: 9,
    },
    studentFields: {
        flexDirection: "row",
        marginBottom: 18,
        fontSize: 10,
    },
    studentField: {
        marginRight: 26,
    },
    answerSection: {
        marginTop: 16,
    },
    answerSectionTitle: {
        marginBottom: 8,
        fontSize: 12,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    gridItem: {
        padding: 3,
    },
    wordGridItem: {
        paddingTop: 3,
        paddingBottom: 3,
        paddingLeft: 4,
        paddingRight: 4,
    },
    choiceAnswer: {
        minHeight: 55,
        padding: 4,
    },
    choiceBox: {
        height: 30,
        marginTop: 5,
        borderWidth: 1,
        borderColor: "#000000",
    },
    wordAnswer: {
        minHeight: 28,
        flexDirection: "row",
        alignItems: "flex-end",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        paddingBottom: 4,
    },
    wordLine: {
        flex: 1,
    },
    essayAnswer: {
        position: "relative",
        minHeight: 130,
        borderWidth: 1,
        borderColor: "#6b7280",
        borderStyle: "dashed",
        padding: 7,
    },
    essayLimit: {
        position: "absolute",
        right: 7,
        bottom: 7,
        fontSize: 8,
    },
    footer: {
        position: "absolute",
        left: 48,
        right: 48,
        bottom: 20,
        textAlign: "right",
        fontSize: 8,
    },
});

function PageFooter({ label }: { label: string }) {
    return (
        <Text
            fixed
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
                `${label} ${pageNumber} / ${totalPages}`
            }
        />
    );
}

export function QuestionSheetDocument({
    questions,
}: QuestionSheetDocumentProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>問題用紙</Text>
                {questions.map(({ question, displayNumber }) => (
                    <View
                        key={question.id}
                        style={styles.question}
                        wrap={false}
                    >
                        <Text style={styles.questionText}>
                            問{displayNumber}. {question.questionText}
                        </Text>
                        {question.type === "4択" && (
                            <View style={styles.options}>
                                {[
                                    question.option1,
                                    question.option2,
                                    question.option3,
                                    question.option4,
                                ].map((option, index) => (
                                    <Text key={index} style={styles.option}>
                                        {index + 1}.{" "}
                                        {option || "（選択肢未設定）"}
                                    </Text>
                                ))}
                            </View>
                        )}
                        {question.type === "単語" && (
                            <Text style={styles.note}>
                                適切な単語・語句を解答用紙に記入しなさい。
                            </Text>
                        )}
                        {question.type === "自由記述" && (
                            <Text style={styles.note}>
                                {question.maxChars
                                    ? `${question.maxChars}文字以内で解答用紙に記述しなさい。`
                                    : "解答用紙の記述欄に詳しく記述しなさい。"}
                            </Text>
                        )}
                    </View>
                ))}
                <PageFooter label="問題用紙" />
            </Page>
        </Document>
    );
}

function AnswerGrid({
    questions,
    columns,
    itemStyle,
    children,
}: {
    questions: Question[];
    columns: number;
    itemStyle?:
        | StyleSheet.NamedStyles<object>[string]
        | StyleSheet.NamedStyles<object>[string][];
    children: (question: Question) => React.ReactNode;
}) {
    return (
        <View style={styles.grid}>
            {questions.map((question) => (
                <View
                    key={question.id}
                    style={[
                        styles.gridItem,
                        itemStyle,
                        { width: `${100 / columns}%` },
                    ]}
                    wrap={false}
                >
                    {children(question)}
                </View>
            ))}
        </View>
    );
}

export function AnswerSheetDocument({
    choiceQuestions,
    wordQuestions,
    essayQuestions,
    displayNumbers,
    layout,
}: AnswerSheetDocumentProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>解答用紙</Text>
                <View style={styles.studentFields}>
                    <Text style={styles.studentField}>
                        氏名: ____________________
                    </Text>
                    <Text style={styles.studentField}>組: ______</Text>
                    <Text>番号: ______</Text>
                </View>

                {choiceQuestions.length > 0 && (
                    <View style={styles.answerSection}>
                        <Text style={styles.answerSectionTitle}>選択問題</Text>
                        <AnswerGrid
                            questions={choiceQuestions}
                            columns={layout.choice.columns}
                        >
                            {(question) => (
                                <View style={styles.choiceAnswer}>
                                    <Text>
                                        問{displayNumbers.get(question.id)}
                                    </Text>
                                    <View style={styles.choiceBox} />
                                </View>
                            )}
                        </AnswerGrid>
                    </View>
                )}

                {wordQuestions.length > 0 && (
                    <View style={styles.answerSection}>
                        <Text style={styles.answerSectionTitle}>単語回答</Text>
                        <AnswerGrid
                            questions={wordQuestions}
                            columns={layout.word.columns}
                            itemStyle={styles.wordGridItem}
                        >
                            {(question) => (
                                <View style={styles.wordAnswer}>
                                    <Text>
                                        問{displayNumbers.get(question.id)}
                                    </Text>
                                    <View style={styles.wordLine} />
                                </View>
                            )}
                        </AnswerGrid>
                    </View>
                )}

                {essayQuestions.length > 0 && (
                    <View style={styles.answerSection}>
                        <Text style={styles.answerSectionTitle}>自由記述</Text>
                        <AnswerGrid
                            questions={essayQuestions}
                            columns={layout.essay.columns}
                        >
                            {(question) => (
                                <View style={styles.essayAnswer}>
                                    <Text>
                                        問{displayNumbers.get(question.id)}
                                    </Text>
                                    {question.type === "自由記述" &&
                                        question.maxChars && (
                                            <Text style={styles.essayLimit}>
                                                最大 {question.maxChars} 文字
                                            </Text>
                                        )}
                                </View>
                            )}
                        </AnswerGrid>
                    </View>
                )}
                <PageFooter label="解答用紙" />
            </Page>
        </Document>
    );
}
