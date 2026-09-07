import { NumberedQuestion } from "@/types/exam";

export function QuestionPaperPreview({
    questions,
}: {
    questions: NumberedQuestion[];
}) {
    return (
        <div className="space-y-6 p-6" role="tabpanel">
            {questions.map(({ question, displayNumber }) => (
                <article
                    key={question.id}
                    className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                    <div className="flex items-start gap-3">
                        <span
                            className={`mt-0.5 shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${question.type === "4択" ? "bg-blue-100 text-blue-800" : question.type === "単語" ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"}`}
                        >
                            {question.type}
                        </span>
                        <div className="flex-1">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">
                                問{displayNumber}. {question.questionText}
                            </h3>
                            {question.type === "4択" && (
                                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {[
                                        question.option1,
                                        question.option2,
                                        question.option3,
                                        question.option4,
                                    ].map((option, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-3 rounded border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"
                                        >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-400 text-xs font-medium">
                                                {index + 1}
                                            </span>
                                            <span>
                                                {option || "（選択肢未設定）"}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                            {question.type === "単語" && (
                                <p className="mt-2 text-xs text-gray-500">
                                    ※ 適切な単語・語句を解答用紙に記入しなさい。
                                </p>
                            )}
                            {question.type === "自由記述" && (
                                <div className="mt-2 text-xs font-medium text-purple-700">
                                    {question.maxChars
                                        ? `※ 【制限】${question.maxChars}文字以内で解答用紙に記述しなさい。`
                                        : "※ 解答用紙の記述欄に詳しく記述しなさい。"}
                                </div>
                            )}
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
