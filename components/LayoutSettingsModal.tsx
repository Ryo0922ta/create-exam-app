import { QuestionGroups } from "@/types/exam";
import { LayoutSettings, QuestionLayout } from "@/types/layout";

type LayoutSettingsModalProps = {
    settings: LayoutSettings;
    availableQuestions: QuestionGroups;
    error: string | null;
    onUpdate: (
        type: keyof LayoutSettings,
        field: keyof QuestionLayout,
        value: number,
    ) => void;
    onCancel: () => void;
    onPreview: () => void;
};

export function LayoutSettingsModal({
    settings,
    availableQuestions,
    error,
    onUpdate,
    onCancel,
    onPreview,
}: LayoutSettingsModalProps) {
    const sections = [
        ["choice", "選択問題", availableQuestions.choiceQuestions.length],
        ["word", "単語回答", availableQuestions.wordQuestions.length],
        ["essay", "自由記述", availableQuestions.essayQuestions.length],
    ] as const;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="layout-settings-title"
        >
            <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2
                        id="layout-settings-title"
                        className="text-lg font-semibold text-gray-900"
                    >
                        レイアウト設定
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        表示する問題数と、解答用紙での横・縦の配置を指定してください。
                    </p>
                </div>
                <div className="space-y-5 px-6 py-5">
                    {sections.map(([type, label, available]) => {
                        const layout = settings[type];
                        return (
                            <section
                                key={type}
                                className="border-b border-gray-200 pb-5 last:border-b-0 last:pb-0"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-800">
                                        {label}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        CSV内: {available}問
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        ["count", "表示件数"],
                                        ["columns", "横"],
                                        ["rows", "縦"],
                                    ].map(([field, fieldLabel]) => (
                                        <label
                                            key={field}
                                            className="text-xs font-medium text-gray-700"
                                        >
                                            {fieldLabel}
                                            <input
                                                type="number"
                                                min="1"
                                                max={
                                                    field === "count"
                                                        ? available
                                                        : undefined
                                                }
                                                value={
                                                    layout[
                                                        field as keyof QuestionLayout
                                                    ]
                                                }
                                                onChange={(event) =>
                                                    onUpdate(
                                                        type,
                                                        field as keyof QuestionLayout,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                    {error && (
                        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </p>
                    )}
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={onPreview}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        プレビューを表示
                    </button>
                </div>
            </div>
        </div>
    );
}
