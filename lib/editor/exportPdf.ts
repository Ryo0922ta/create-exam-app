import { fabric } from "fabric";
import { PaperSize } from "@/types/editor";
import { PAPER_SIZES } from "@/lib/editor/paperSizes";

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

export async function exportCanvasToPdf(
    canvas: fabric.Canvas,
    paperSize: PaperSize = "A4",
    customFileName?: string,
): Promise<void> {
    const { PDFDocument } = await import("pdf-lib");

    // 選択状態を解除して再描画
    canvas.discardActiveObject();
    canvas.renderAll();

    // 高解像度（2倍スケール）でPNGデータを取得
    const dataUrl = canvas.toDataURL({
        format: "png",
        multiplier: 2,
    });

    const sizeConfig = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
    const { pdfWidthPt, pdfHeightPt } = sizeConfig;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pdfWidthPt, pdfHeightPt]);

    // DataURLのbase64部分をUint8Arrayへ変換、またはembedPngに直接渡す
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
