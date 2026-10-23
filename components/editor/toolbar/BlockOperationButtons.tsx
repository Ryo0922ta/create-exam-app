import type { BlockOperationButtonsProps } from "./types";

export function BlockOperationButtons({ onClone, onDelete, hasEditableSelection, isPropertyPanelOpen, onTogglePropertyPanel }: BlockOperationButtonsProps) {
    return (
        <>
            <button type="button" onClick={onTogglePropertyPanel} disabled={!hasEditableSelection} className={`px-2.5 py-1 text-xs rounded border font-medium transition flex items-center gap-1 ${isPropertyPanelOpen ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"}`} title="選択中の枠のプロパティを編集">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span>プロパティ</span>
            </button>
            <button type="button" onClick={onClone} className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition font-medium" title="選択中の枠を複製">複製</button>
            <button type="button" onClick={onDelete} className="px-2 py-1 text-xs bg-slate-100 hover:bg-red-50 text-red-600 hover:border-red-300 rounded border border-slate-300 transition font-medium" title="選択中の枠を削除 (Deleteキー)">削除</button>
        </>
    );
}
