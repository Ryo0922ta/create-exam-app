import type { ZoomControlsProps } from "./types";

export function ZoomControls({ zoomLevel, onZoomIn, onZoomOut, onZoomFit }: ZoomControlsProps) {
    return (
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-300">
            <button type="button" onClick={onZoomOut} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded transition text-xs font-bold" title="縮小">-</button>
            <span className="text-[11px] font-semibold text-slate-700 px-1 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button type="button" onClick={onZoomIn} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded transition text-xs font-bold" title="拡大">+</button>
            <button type="button" onClick={onZoomFit} className="px-2 h-6 flex items-center justify-center text-[11px] font-medium text-slate-700 hover:bg-white rounded transition" title="全体を表示">画面に合わせる</button>
        </div>
    );
}
