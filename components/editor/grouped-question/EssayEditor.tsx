"use client";

import type { EssayEditorProps } from "../types";

export const EssayEditor = ({ group, onChange }: EssayEditorProps) => (
    <div className="space-y-1.5 text-[10px] text-slate-600">
        <label className="flex items-center gap-1">
            表示方式
            <select
                aria-label={`小問${group.label}記述欄表示方式`}
                value={group.essayLayout ?? "line"}
                onChange={(e) =>
                    onChange({
                        essayLayout: e.target.value as "line" | "grid",
                    })
                }
                className="px-1.5 py-0.5 border border-slate-300 rounded bg-white"
            >
                <option value="line">通常記述欄</option>
                <option value="grid">マス目方式</option>
            </select>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
            <label className="flex items-center gap-1">
                行数
                <input
                    type="number"
                    min={1}
                    max={50}
                    value={group.essayRows ?? 1}
                    onChange={(e) =>
                        onChange({
                            essayRows: Math.max(
                                1,
                                Number(e.target.value) || 1,
                            ),
                        })
                    }
                    className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center"
                />
            </label>
            {(group.essayLayout ?? "line") === "grid" && (
                <>
                    <label className="flex items-center gap-1">
                        列数
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={group.essayCols ?? 1}
                            onChange={(e) => {
                                const cols = Math.max(
                                    1,
                                    Number(e.target.value) || 1,
                                );
                                onChange({
                                    essayCols: cols,
                                    essayCellCount: Math.min(
                                        group.essayCellCount ?? 1,
                                        (group.essayRows ?? 1) * cols,
                                    ),
                                });
                            }}
                            className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center"
                        />
                    </label>
                    <label className="flex items-center gap-1">
                        マス数
                        <input
                            type="number"
                            min={1}
                            max={2500}
                            value={Math.min(
                                group.essayCellCount ?? 1,
                                (group.essayRows ?? 1) *
                                    (group.essayCols ?? 1),
                            )}
                            onChange={(e) =>
                                onChange({
                                    essayCellCount: Math.min(
                                        (group.essayRows ?? 1) *
                                            (group.essayCols ?? 1),
                                        Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        ),
                                    ),
                                })
                            }
                            className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center"
                        />
                    </label>
                    <label className="flex items-center gap-1">
                        列幅
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            placeholder="自動"
                            value={group.essayColumnWidth ?? ""}
                            onChange={(e) =>
                                onChange({
                                    essayColumnWidth: e.target.value
                                        ? Math.max(
                                              1,
                                              Number(e.target.value) || 1,
                                          )
                                        : undefined,
                                })
                            }
                            className="w-16 px-1 py-0.5 border border-slate-300 rounded text-center"
                        />
                        px
                    </label>
                </>
            )}
        </div>
    </div>
);
