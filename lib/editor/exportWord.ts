import { fabric } from "fabric";
import { Document, Packer, Paragraph, ImageRun, PageOrientation } from "docx";
import { getCleanCanvasDataUrl } from "@/lib/editor/exportPdf";

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
 * B4横レイアウトのWord (.docx) ファイルを出力する
 */
export async function exportB4WordDocx(canvas: fabric.Canvas): Promise<void> {
    const dataUrl = getCleanCanvasDataUrl(canvas, "full");
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            // JIS B4 landscape (364mm x 257mm) ≒ 20639 x 14572 dxa
                            width: 20639,
                            height: 14572,
                            orientation: PageOrientation.LANDSCAPE,
                        },
                        margin: {
                            top: 280,
                            bottom: 280,
                            left: 280,
                            right: 280,
                        },
                    },
                },
                children: [
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: bytes,
                                type: "png",
                                transformation: {
                                    width: 980,
                                    height: 692,
                                },
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    triggerDownload(
        blob,
        `解答用紙_B4横_${new Date().toISOString().slice(0, 10)}.docx`,
    );
}
