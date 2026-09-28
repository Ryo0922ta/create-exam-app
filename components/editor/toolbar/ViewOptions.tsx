import { MarginOptions } from "./MarginOptions";
import { ZoomControls } from "./ZoomControls";
import type { ViewOptionsProps } from "./types";

export function ViewOptions({ children, isOpen, onToggle, isGridVisible, onToggleGrid, isSnapEnabled, onToggleSnap, isAlignmentGuidesEnabled, onToggleAlignmentGuides, isMarginGuidesVisible, onToggleMarginGuides, isMarginOptionsOpen, onToggleMarginOptions, paperMargins, onPaperMarginsChange, zoomLevel, onZoomIn, onZoomOut, onZoomFit }: ViewOptionsProps) {
    return (
        <>
            <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center flex-wrap gap-2">
                    {children}
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    className={`shrink-0 px-2.5 py-1.5 text-xs rounded border font-medium transition ${isOpen ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"}`}
                >
                    表示設定
                </button>
            </div>

            {isOpen && (
                <div className="px-4 py-2 border-t border-slate-200 flex flex-wrap items-center gap-3">
                    <CheckboxOption
                        checked={isGridVisible}
                        onCheckedChange={onToggleGrid}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        label="方眼グリッド"
                    />
                    <CheckboxOption
                        checked={isSnapEnabled}
                        onCheckedChange={onToggleSnap}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        label="吸着"
                    />
                    <CheckboxOption
                        checked={isAlignmentGuidesEnabled}
                        onCheckedChange={onToggleAlignmentGuides}
                        className="rounded text-rose-600 focus:ring-rose-500"
                        label="配置ガイド"
                    />
                    <CheckboxOption
                        checked={isMarginGuidesVisible}
                        onCheckedChange={onToggleMarginGuides}
                        className="rounded text-amber-600 focus:ring-amber-500"
                        label="余白ガイド"
                    />
                    <MarginOptions
                        isOpen={isMarginOptionsOpen}
                        onToggle={onToggleMarginOptions}
                        isMarginGuidesVisible={isMarginGuidesVisible}
                        paperMargins={paperMargins}
                        onPaperMarginsChange={onPaperMarginsChange}
                    />
                    <div className="h-5 w-px bg-slate-300"></div>
                    <ZoomControls
                        zoomLevel={zoomLevel}
                        onZoomIn={onZoomIn}
                        onZoomOut={onZoomOut}
                        onZoomFit={onZoomFit}
                    />
                </div>
            )}
        </>
    );
}

interface CheckboxOptionProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
    label: string;
}

function CheckboxOption({
    checked,
    onCheckedChange,
    className,
    label,
}: CheckboxOptionProps) {
    return (
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onCheckedChange(e.target.checked)}
                className={className}
            />
            <span>{label}</span>
        </label>
    );
}
