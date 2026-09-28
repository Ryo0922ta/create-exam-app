import { MARGIN_LIMITS } from "@/types/editor";
import type { MarginOptionsProps } from "./types";

export function MarginOptions({ isOpen, onToggle, isMarginGuidesVisible, paperMargins, onPaperMarginsChange }: MarginOptionsProps) {
    return (
        <>
            <button type="button" onClick={onToggle} aria-expanded={isOpen} className={`px-2 py-1 text-xs rounded border font-medium transition ${isOpen ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"}`}>
                余白設定
            </button>
            {isOpen && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <label className="flex items-center gap-1 font-medium whitespace-nowrap">
                        <span>上下</span>
                        <input type="range" min={MARGIN_LIMITS.vertical.min} max={MARGIN_LIMITS.vertical.max} step={1} value={paperMargins.verticalMm} disabled={!isMarginGuidesVisible} onChange={(e) => onPaperMarginsChange({ ...paperMargins, verticalMm: Number(e.target.value) })} className="w-16 accent-amber-600 disabled:opacity-40" />
                        <span className="w-9 text-right tabular-nums">{paperMargins.verticalMm}mm</span>
                    </label>
                    <label className="flex items-center gap-1 font-medium whitespace-nowrap">
                        <span>外側</span>
                        <input type="range" min={MARGIN_LIMITS.outerHorizontal.min} max={MARGIN_LIMITS.outerHorizontal.max} step={1} value={paperMargins.outerHorizontalMm} disabled={!isMarginGuidesVisible} onChange={(e) => onPaperMarginsChange({ ...paperMargins, outerHorizontalMm: Number(e.target.value) })} className="w-16 accent-amber-600 disabled:opacity-40" />
                        <span className="w-9 text-right tabular-nums">{paperMargins.outerHorizontalMm}mm</span>
                    </label>
                    <label className="flex items-center gap-1 font-medium whitespace-nowrap">
                        <span>折り目</span>
                        <input type="range" min={MARGIN_LIMITS.foldHorizontal.min} max={MARGIN_LIMITS.foldHorizontal.max} step={1} value={paperMargins.foldHorizontalMm} disabled={!isMarginGuidesVisible} onChange={(e) => onPaperMarginsChange({ ...paperMargins, foldHorizontalMm: Number(e.target.value) })} className="w-16 accent-amber-600 disabled:opacity-40" />
                        <span className="w-9 text-right tabular-nums">{paperMargins.foldHorizontalMm}mm</span>
                    </label>
                </div>
            )}
        </>
    );
}
