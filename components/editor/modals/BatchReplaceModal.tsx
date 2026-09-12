"use client";

import React, { useState } from "react";

interface BatchReplaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (target: string, newText: string) => void;
}

export const BatchReplaceModal: React.FC<BatchReplaceModalProps> = ({
    isOpen,
    onClose,
    onApply,
}) => {
    const [target, setTarget] = useState("○・△・×");
    const [newText, setNewText] = useState("知識・技能");

    if (!isOpen) return null;

    const handleApply = () => {
        if (!target) {
            alert("置換対象の文字列を入力してください");
            return;
        }
        onApply(target.trim(), newText.trim());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                {/* ヘッダー */}
                <div className="px-5 py-3.5 bg-amber-600 text-white flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                        観点記号の一括置換
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-amber-100 hover:text-white p-1 rounded transition text-base leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* ボディ */}
                <div className="p-5 space-y-3.5 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                        現在用紙上に配置されている大問の観点区分記号を一括で置き換えます。
                    </p>

                    <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                            置換対象の文字列
                        </label>
                        <input
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder="例: ○・△・×"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                            新しい観点記号
                        </label>
                        <input
                            type="text"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="例: 知識・技能, 思考・判断・表現"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-indigo-700 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* フッター */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded border border-slate-300 transition"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded shadow transition"
                    >
                        一括置換を実行
                    </button>
                </div>
            </div>
        </div>
    );
};
