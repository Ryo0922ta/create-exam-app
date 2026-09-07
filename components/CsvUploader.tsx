import { ChangeEvent, DragEvent, RefObject } from "react";

type CsvUploaderProps = {
    fileInputRef: RefObject<HTMLInputElement | null>;
    fileName: string | null;
    isDragging: boolean;
    canReset: boolean;
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
    onReset: () => void;
};

export function CsvUploader({
    fileInputRef,
    fileName,
    isDragging,
    canReset,
    onFileChange,
    onDragOver,
    onDragLeave,
    onDrop,
    onReset,
}: CsvUploaderProps) {
    return (
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
                1. CSVファイルをアップロード
            </h2>
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ${
                    isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400"
                }`}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept=".csv,text/csv"
                    className="hidden"
                />
                <p className="text-sm font-medium text-gray-700">
                    クリックしてCSVを選択、またはここにドラッグ＆ドロップ
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    Shift-JIS（Excel標準出力）および UTF-8 に対応
                </p>
                {fileName && (
                    <p className="mt-3 text-xs font-semibold text-blue-600">
                        選択中のファイル: {fileName}
                    </p>
                )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                    ※ 想定フォーマット: [問題番号, 問題形式(4択/単語/自由記述),
                    問題文, 選択肢1〜4, 文字数制限]
                </div>
                {canReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
                    >
                        クリアして再選択
                    </button>
                )}
            </div>
        </section>
    );
}
