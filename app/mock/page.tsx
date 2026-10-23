"use client";

import Link from "next/link";
import { useState } from "react";

type IconName = "plus" | "document";

const iconPaths: Record<IconName, string> = {
    plus: "M12 4v16m8-8H4",
    document:
        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
};

export default function Home() {
    return <TopMenu />;
}

function TopMenu() {
    return (
        <>
            <div className="bg-white border-b border-slate-200 ">
            <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <OpenQuestionModal />
                    <OpenImportModal />
                    <div className="h-5 w-px bg-slate-300 mx-1"></div>
                    <BasicParts />
                </div>
                <BasicButton name="表示設定" />
            </div>
            </div>
        </>
    );
}

function OpenQuestionModal() {
    return (
        <button
            type="button"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded shadow-xs flex items-center gap-1.5 transition"
        >
            <IconPart icon="plus" className="w-4 h-4" />
            <span>大問を作成・追加</span>
        </button>
    );
}

function OpenImportModal() {
    return (
        <button
            type="button"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200  border border-slate-300 text-xs rounded shadow-xs flex items-center gap-1.5 transition"
        >
            <IconPart icon="document" className="w-4 h-4" />
            <span>問題文から自動インポート</span>
        </button>
    );
}

function BasicParts() {
    return (
        <>
            <div className="text-xs">基本パーツ: </div>
            <BasicButton name="考査見出し枠" icon="plus" />
            <BasicButton name="年組氏名欄" icon="plus" />
            <BasicButton name="観点別特典欄" icon="plus" />
            <BasicButton name="プロパティ" icon="plus" />
            <div className="h-5 w-px bg-slate-300 mx-1"></div>
            <BasicButton name="複製" />
            <BasicButton name="削除" />
        </>
    );
}

function BasicButton(buttonProps: { name: string; icon?: IconName }) {
    return (
        <>
            <button
                type="button"
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200  border border-slate-300 text-xs rounded shadow-xs flex items-center gap-1.5 transition"
            >
                <IconPart icon={buttonProps.icon} />
                <span>{buttonProps.name}</span>
            </button>
        </>
    );
}

function IconPart({
    icon,
    className = "w-3 h-3",
}: {
    icon?: IconName;
    className?: string;
}) {
    if (icon) {
        return (
            <>
                <svg
                    className={className}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={iconPaths[icon]}
                    />
                </svg>
            </>
        );
    }

    return null;
}
