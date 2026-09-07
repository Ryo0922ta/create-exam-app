import { useState, useRef, useEffect } from "react";
import { NumberedQuestion } from "@/types/exam";
import { ChoiceQuestion, EssayQuestion, Question } from "@/types/question";

type QuestionPaperPreviewProps = {
    questions: NumberedQuestion[];
    onUpdateQuestion?: (id: number, updatedFields: Partial<Question>) => void;
};

export function QuestionPaperPreview({
    questions,
    onUpdateQuestion,
}: QuestionPaperPreviewProps) {
    return (
        <div className="space-y-6 p-6" role="tabpanel">
            {questions.map(({ question, displayNumber }) => (
                <QuestionItem
                    key={question.id}
                    question={question}
                    displayNumber={displayNumber}
                    onUpdate={onUpdateQuestion}
                />
            ))}
        </div>
    );
}

function QuestionItem({
    question,
    displayNumber,
    onUpdate,
}: {
    question: Question;
    displayNumber: number;
    onUpdate?: (id: number, updatedFields: Partial<Question>) => void;
}) {
    const isEditable = !!onUpdate;

    return (
        <article className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-3">
                <span
                    className={`mt-0.5 shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${
                        question.type === "4択"
                            ? "bg-blue-100 text-blue-800"
                            : question.type === "単語"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                    }`}
                >
                    {question.type}
                </span>
                <div className="flex-1 min-w-0">
                    <EditableQuestionText
                        displayNumber={displayNumber}
                        text={question.questionText}
                        isEditable={isEditable}
                        onSave={(newText) =>
                            onUpdate?.(question.id, { questionText: newText })
                        }
                    />

                    {question.type === "4択" && (
                        <ChoiceOptionsEditor
                            question={question}
                            isEditable={isEditable}
                            onUpdateOption={(field, val) =>
                                onUpdate?.(question.id, { [field]: val })
                            }
                        />
                    )}

                    {question.type === "単語" && (
                        <p className="mt-2 text-xs text-gray-500">
                            ※ 適切な単語・語句を解答用紙に記入しなさい。
                        </p>
                    )}

                    {question.type === "自由記述" && (
                        <EditableEssayMaxChars
                            question={question}
                            isEditable={isEditable}
                            onSave={(maxChars) =>
                                onUpdate?.(question.id, { maxChars })
                            }
                        />
                    )}
                </div>
            </div>
        </article>
    );
}

/**
 * 問題文のインライン編集コンポーネント
 */
function EditableQuestionText({
    displayNumber,
    text,
    isEditable,
    onSave,
}: {
    displayNumber: number;
    text: string;
    isEditable: boolean;
    onSave: (newText: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(text);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setValue(text);
    }, [text]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length,
            );
        }
    }, [isEditing]);

    const handleSave = () => {
        const trimmed = value.trim();
        if (trimmed) {
            onSave(trimmed);
        } else {
            setValue(text);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setValue(text);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    問{displayNumber}. 問題文を編集
                </div>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-blue-400 p-2.5 text-base font-semibold leading-relaxed text-gray-900 outline-none ring-2 ring-blue-100"
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                            e.preventDefault();
                            handleSave();
                        } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancel();
                        }
                    }}
                />
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                        保存
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        キャンセル
                    </button>
                    <span className="text-[11px] text-gray-400">
                        (Ctrl/Cmd + Enter で保存, Esc でキャンセル)
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => isEditable && setIsEditing(true)}
            className={`group flex items-start justify-between gap-2 rounded p-1 -m-1 transition-colors ${
                isEditable ? "cursor-pointer hover:bg-blue-50/70" : ""
            }`}
            title={isEditable ? "クリックして問題文を編集" : undefined}
        >
            <h3 className="text-base font-semibold leading-7 text-gray-900">
                問{displayNumber}. {text}
            </h3>
            {isEditable && (
                <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-xs text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 bg-blue-100/80">
                    編集
                </span>
            )}
        </div>
    );
}

/**
 * 4択の各選択肢の編集コンポーネント
 */
function ChoiceOptionsEditor({
    question,
    isEditable,
    onUpdateOption,
}: {
    question: ChoiceQuestion;
    isEditable: boolean;
    onUpdateOption: (
        field: "option1" | "option2" | "option3" | "option4",
        val: string,
    ) => void;
}) {
    const options = [
        { field: "option1" as const, value: question.option1, index: 1 },
        { field: "option2" as const, value: question.option2, index: 2 },
        { field: "option3" as const, value: question.option3, index: 3 },
        { field: "option4" as const, value: question.option4, index: 4 },
    ];

    return (
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {options.map(({ field, value, index }) => (
                <SingleOptionItem
                    key={field}
                    index={index}
                    value={value}
                    isEditable={isEditable}
                    onSave={(val) => onUpdateOption(field, val)}
                />
            ))}
        </ol>
    );
}

function SingleOptionItem({
    index,
    value,
    isEditable,
    onSave,
}: {
    index: number;
    value: string;
    isEditable: boolean;
    onSave: (val: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        onSave(draft);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setDraft(value);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <li className="flex items-center gap-2 rounded border border-blue-400 bg-blue-50/40 px-3 py-2 text-sm text-gray-700 shadow-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-500 bg-blue-100 text-xs font-bold text-blue-700">
                    {index}
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSave();
                        } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancel();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={handleSave}
                    className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                >
                    保存
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                    取消
                </button>
            </li>
        );
    }

    return (
        <li
            onClick={() => isEditable && setIsEditing(true)}
            className={`group flex items-start justify-between gap-3 rounded border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition-colors ${
                isEditable
                    ? "cursor-pointer hover:border-blue-300 hover:bg-blue-50/30"
                    : ""
            }`}
            title={isEditable ? "クリックして選択肢を編集" : undefined}
        >
            <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-400 text-xs font-medium">
                    {index}
                </span>
                <span className="break-words">
                    {value || (
                        <span className="text-gray-400 italic">
                            （選択肢未設定）
                        </span>
                    )}
                </span>
            </div>
            {isEditable && (
                <span className="shrink-0 text-xs text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                    編集
                </span>
            )}
        </li>
    );
}

/**
 * 自由記述の文字数制限の編集コンポーネント
 */
function EditableEssayMaxChars({
    question,
    isEditable,
    onSave,
}: {
    question: EssayQuestion;
    isEditable: boolean;
    onSave: (maxChars?: number) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [charsStr, setCharsStr] = useState(
        question.maxChars ? String(question.maxChars) : "",
    );
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCharsStr(question.maxChars ? String(question.maxChars) : "");
    }, [question.maxChars]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const parsed = parseInt(charsStr.trim(), 10);
        if (!isNaN(parsed) && parsed > 0) {
            onSave(parsed);
        } else {
            onSave(undefined);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setCharsStr(question.maxChars ? String(question.maxChars) : "");
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="mt-2 flex items-center gap-2 rounded border border-purple-300 bg-purple-50 p-2 text-xs">
                <span className="font-medium text-purple-900">制限文字数:</span>
                <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    placeholder="制限なし"
                    value={charsStr}
                    onChange={(e) => setCharsStr(e.target.value)}
                    className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSave();
                        } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancel();
                        }
                    }}
                />
                <span className="text-gray-500">文字（空欄で制限なし）</span>
                <button
                    type="button"
                    onClick={handleSave}
                    className="rounded bg-purple-700 px-2 py-1 font-medium text-white hover:bg-purple-800"
                >
                    保存
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-700 hover:bg-gray-100"
                >
                    取消
                </button>
            </div>
        );
    }

    return (
        <div
            onClick={() => isEditable && setIsEditing(true)}
            className={`group mt-2 inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-medium text-purple-700 transition-colors ${
                isEditable ? "cursor-pointer hover:bg-purple-50" : ""
            }`}
            title={isEditable ? "クリックして文字数制限を編集" : undefined}
        >
            <span>
                {question.maxChars
                    ? `※ 【制限】${question.maxChars}文字以内で解答用紙に記述しなさい。`
                    : "※ 解答用紙の記述欄に詳しく記述しなさい。"}
            </span>
            {isEditable && (
                <span className="text-[11px] text-purple-600 underline opacity-0 transition-opacity group-hover:opacity-100">
                    文字数を変更
                </span>
            )}
        </div>
    );
}
