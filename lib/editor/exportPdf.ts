import { fabric } from "fabric";
import { PaperSize } from "@/types/editor";
import { PAPER_SIZES } from "@/lib/editor/paperSizes";
import {
    restoreAlignmentGuides,
    stripAlignmentGuidesForExport,
} from "@/lib/editor/alignmentGuides";

function triggerDownload(blob: Blob, fileName: string) {
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);
}

/**
 * グリッドや選択枠、ズームを一時的に解除して高品質なPNG画像データを取得する
 */
export function getCleanCanvasDataUrl(
    canvas: fabric.Canvas,
    area: "full" | "left" | "right" = "full",
): string {
    canvas.discardActiveObject();
    const removedGuides = stripAlignmentGuidesForExport(canvas);
    const gridHost = canvas
        .getElement()
        ?.closest(".fabric-canvas-host") as HTMLElement | null;
    const wasGridVisible =
        gridHost?.classList.contains("grid-active") ?? false;
    gridHost?.classList.remove("grid-active");

    const savedBg = canvas.backgroundColor;
    canvas.setBackgroundColor("#ffffff", () => {});

    const savedZoom = canvas.getZoom();
    const b4Config = PAPER_SIZES.B4_LANDSCAPE;
    const originalWidth = b4Config.widthPx;
    const originalHeight = b4Config.heightPx;

    canvas.setZoom(1);
    canvas.setDimensions({ width: originalWidth, height: originalHeight });

    let dataUrl = "";
    if (area === "full") {
        dataUrl = canvas.toDataURL({
            format: "png",
            multiplier: 2.0,
        });
    } else if (area === "left") {
        dataUrl = canvas.toDataURL({
            format: "png",
            multiplier: 2.0,
            left: 0,
            top: 0,
            width: originalWidth / 2,
            height: originalHeight,
        });
    } else if (area === "right") {
        dataUrl = canvas.toDataURL({
            format: "png",
            multiplier: 2.0,
            left: originalWidth / 2,
            top: 0,
            width: originalWidth / 2,
            height: originalHeight,
        });
    }

    canvas.setZoom(savedZoom);
    canvas.setDimensions({
        width: originalWidth * savedZoom,
        height: originalHeight * savedZoom,
    });
    canvas.setBackgroundColor(savedBg ?? "transparent", () => {});
    if (wasGridVisible) gridHost?.classList.add("grid-active");
    restoreAlignmentGuides(canvas, removedGuides);
    canvas.requestRenderAll();

    return dataUrl;
}

/**
 * B4横 (364mm x 257mm) 1ページのPDFを出力する
 */
export async function exportB4LandscapePdf(
    canvas: fabric.Canvas,
): Promise<void> {
    const { PDFDocument } = await import("pdf-lib");
    const dataUrl = getCleanCanvasDataUrl(canvas, "full");

    const b4Config = PAPER_SIZES.B4_LANDSCAPE;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([b4Config.pdfWidthPt, b4Config.pdfHeightPt]);

    const pngImage = await pdfDoc.embedPng(dataUrl);
    page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: b4Config.pdfWidthPt,
        height: b4Config.pdfHeightPt,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfBuffer).set(pdfBytes);
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });

    triggerDownload(
        blob,
        `解答用紙_B4横_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
}

/**
 * A4縦2ページ（左面・右面）に分割したPDFを出力する
 */
export async function exportA4SplitPdf(canvas: fabric.Canvas): Promise<void> {
    const { PDFDocument } = await import("pdf-lib");
    const leftDataUrl = getCleanCanvasDataUrl(canvas, "left");
    const rightDataUrl = getCleanCanvasDataUrl(canvas, "right");

    const a4Config = PAPER_SIZES.A4;
    const pdfDoc = await PDFDocument.create();

    // 1ページ目 (左面)
    const page1 = pdfDoc.addPage([a4Config.pdfWidthPt, a4Config.pdfHeightPt]);
    const pngImage1 = await pdfDoc.embedPng(leftDataUrl);
    page1.drawImage(pngImage1, {
        x: 0,
        y: 0,
        width: a4Config.pdfWidthPt,
        height: a4Config.pdfHeightPt,
    });

    // 2ページ目 (右面)
    const page2 = pdfDoc.addPage([a4Config.pdfWidthPt, a4Config.pdfHeightPt]);
    const pngImage2 = await pdfDoc.embedPng(rightDataUrl);
    page2.drawImage(pngImage2, {
        x: 0,
        y: 0,
        width: a4Config.pdfWidthPt,
        height: a4Config.pdfHeightPt,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfBuffer).set(pdfBytes);
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });

    triggerDownload(
        blob,
        `解答用紙_A4分割2ページ_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
}

export async function exportCanvasToPdf(
    canvas: fabric.Canvas,
    paperSize: PaperSize = "B4_LANDSCAPE",
    customFileName?: string,
): Promise<void> {
    if (paperSize === "B4_LANDSCAPE") {
        return exportB4LandscapePdf(canvas);
    }

    const { PDFDocument } = await import("pdf-lib");

    canvas.discardActiveObject();
    canvas.renderAll();

    const dataUrl = canvas.toDataURL({
        format: "png",
        multiplier: 2,
    });

    const sizeConfig = PAPER_SIZES[paperSize] || PAPER_SIZES.B4_LANDSCAPE;
    const { pdfWidthPt, pdfHeightPt } = sizeConfig;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pdfWidthPt, pdfHeightPt]);

    const pngImage = await pdfDoc.embedPng(dataUrl);
    page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pdfWidthPt,
        height: pdfHeightPt,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfBuffer).set(pdfBytes);
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });

    const fileName =
        customFileName ||
        `解答用紙_${paperSize}_${new Date().toISOString().slice(0, 10)}.pdf`;

    triggerDownload(blob, fileName);
}
