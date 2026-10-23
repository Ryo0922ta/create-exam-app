"use client";

import dynamic from "next/dynamic";
//動的import　next.jsは通常サーバー側でもページを準備するが、
// fabric.jsやcanvasはブラウザに依存する
//コンポーネントの呼び出し処理をブラウザ側で実行させるために必要
const AnswerSheetCanvasEditor = dynamic(
    () =>
        import("@/components/editor/AnswerSheetCanvasEditor/AnswerSheetCanvasEditor").then(
            (mod) => mod.AnswerSheetCanvasEditor,
        ),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3"></div>
                <p className="text-sm font-medium text-slate-700">
                    解答用紙エディタを読み込み中...
                </p>
            </div>
        ),
    },
);

export default function EditorPage() {
    return <AnswerSheetCanvasEditor />;
}
