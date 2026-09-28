import type { CreationButtonsProps } from "./types";

export function CreationButtons({ onOpenQuestionModal, onOpenImportModal, onAddHeader, onAddNamebox, onAddScoretable }: CreationButtonsProps) {
    return (
        <>
            <button type="button" onClick={onOpenQuestionModal} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-xs flex items-center gap-1.5 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                <span>大問を作成・追加</span>
            </button>
            <button type="button" onClick={onOpenImportModal} className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center gap-1.5 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                <span>問題文から自動インポート</span>
            </button>
            <div className="h-5 w-px bg-slate-300 mx-1"></div>
            <span className="text-[11px] font-semibold text-slate-500">基本パーツ:</span>
            <button type="button" onClick={onAddHeader} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition flex items-center gap-1"><span>+ 考査見出し枠</span></button>
            <button type="button" onClick={onAddNamebox} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition flex items-center gap-1"><span>+ 年組氏名欄</span></button>
            <button type="button" onClick={onAddScoretable} className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition flex items-center gap-1"><span>+ 観点別得点枠</span></button>
        </>
    );
}
