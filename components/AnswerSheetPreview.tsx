import { QuestionGroups } from "@/types/exam";
import { LayoutSettings } from "@/types/layout";

type AnswerSheetPreviewProps = QuestionGroups & {
    displayNumbers: ReadonlyMap<number, number>;
    layout: LayoutSettings;
};

export function AnswerSheetPreview({
    choiceQuestions,
    wordQuestions,
    essayQuestions,
    displayNumbers,
    layout,
}: AnswerSheetPreviewProps) {
    return (
        <div className="p-6" role="tabpanel">
            <div className="mb-5 border-b-2 border-gray-800 pb-3">
                <h3 className="text-xl font-bold text-gray-900">解答用紙</h3>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-700 sm:max-w-xl sm:grid-cols-3">
                    <p>氏名: ____________________</p>
                    <p>組: ______</p>
                    <p>番号: ______</p>
                </div>
            </div>
            <div className="space-y-8">
                {choiceQuestions.length > 0 && (
                    <section>
                        <h4 className="mb-3 text-sm font-semibold text-gray-800">
                            選択問題
                        </h4>
                        <div
                            className="grid gap-3"
                            style={{
                                gridTemplateColumns: `repeat(${layout.choice.columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {choiceQuestions.map((question) => (
                                <article
                                    key={question.id}
                                    className="break-inside-avoid p-1"
                                >
                                    <h5 className="text-sm font-semibold text-gray-900">
                                        問{displayNumbers.get(question.id)}
                                    </h5>
                                    <div className="mt-2 h-12 border-2 border-gray-500" />
                                </article>
                            ))}
                        </div>
                    </section>
                )}
                {wordQuestions.length > 0 && (
                    <section>
                        <h4 className="mb-3 text-sm font-semibold text-gray-800">
                            単語回答
                        </h4>
                        <div
                            className="grid gap-x-[18px] gap-y-3"
                            style={{
                                gridTemplateColumns: `repeat(${layout.word.columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {wordQuestions.map((question) => (
                                <article
                                    key={question.id}
                                    className="break-inside-avoid flex items-center gap-2 border-b-2 border-gray-400 pb-2"
                                >
                                    <h5 className="shrink-0 text-sm font-semibold text-gray-900">
                                        問{displayNumbers.get(question.id)}
                                    </h5>
                                    <div className="h-6 flex-1" />
                                </article>
                            ))}
                        </div>
                    </section>
                )}
                {essayQuestions.length > 0 && (
                    <section>
                        <h4 className="mb-3 text-sm font-semibold text-gray-800">
                            自由記述
                        </h4>
                        <div
                            className="grid gap-6"
                            style={{
                                gridTemplateColumns: `repeat(${layout.essay.columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {essayQuestions.map((question) => (
                                <article
                                    key={question.id}
                                    className="break-inside-avoid border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                                >
                                    <h5 className="text-base font-semibold leading-7 text-gray-900">
                                        問{displayNumbers.get(question.id)}
                                    </h5>
                                    <div className="mt-4 flex min-h-[130px] flex-col justify-end rounded border border-dashed border-gray-300 bg-gray-50/30 p-3 text-xs text-gray-400">
                                        {question.maxChars && (
                                            <span className="text-right font-medium text-gray-500">
                                                最大 {question.maxChars} 文字
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
