import { NumberedQuestion } from "@/types/exam";
import { LayoutSettings } from "@/types/layout";
import { Question } from "@/types/question";

export type PdfDownloadTarget = "all" | "question" | "answer";

type GenerateExamPdfOptions = {
    fileName: string | null;
    target?: PdfDownloadTarget;
    previewQuestions: NumberedQuestion[];
    choiceQuestions: Question[];
    wordQuestions: Question[];
    essayQuestions: Question[];
    displayNumbers: ReadonlyMap<number, number>;
    layout: LayoutSettings;
};

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

export async function generateExamPdf({
    fileName,
    target = "all",
    previewQuestions,
    choiceQuestions,
    wordQuestions,
    essayQuestions,
    displayNumbers,
    layout,
}: GenerateExamPdfOptions) {
    const [{ pdf }, { QuestionSheetDocument, AnswerSheetDocument }] =
        await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/pdfDocuments"),
        ]);

    const baseName = fileName?.replace(/\.csv$/i, "") || "試験";

    // 問題用紙のみ
    if (target === "question") {
        const questionBlob = await pdf(
            QuestionSheetDocument({ questions: previewQuestions }),
        ).toBlob();
        triggerDownload(questionBlob, `${baseName}-問題用紙.pdf`);
        return;
    }

    // 解答用紙のみ
    if (target === "answer") {
        const answerBlob = await pdf(
            AnswerSheetDocument({
                choiceQuestions,
                wordQuestions,
                essayQuestions,
                displayNumbers,
                layout,
            }),
        ).toBlob();
        triggerDownload(answerBlob, `${baseName}-解答用紙.pdf`);
        return;
    }

    // 全部（問題用紙 + 解答用紙）
    const [{ PDFDocument }] = await Promise.all([import("pdf-lib")]);

    const [questionBlob, answerBlob] = await Promise.all([
        pdf(QuestionSheetDocument({ questions: previewQuestions })).toBlob(),
        pdf(
            AnswerSheetDocument({
                choiceQuestions,
                wordQuestions,
                essayQuestions,
                displayNumbers,
                layout,
            }),
        ).toBlob(),
    ]);

    const mergedDocument = await PDFDocument.create();
    for (const documentBlob of [questionBlob, answerBlob]) {
        const sourceDocument = await PDFDocument.load(
            await documentBlob.arrayBuffer(),
        );
        const copiedPages = await mergedDocument.copyPages(
            sourceDocument,
            sourceDocument.getPageIndices(),
        );
        copiedPages.forEach((page) => mergedDocument.addPage(page));
    }

    const mergedBytes = await mergedDocument.save();
    const mergedBuffer = new ArrayBuffer(mergedBytes.byteLength);
    new Uint8Array(mergedBuffer).set(mergedBytes);
    const mergedBlob = new Blob([mergedBuffer], {
        type: "application/pdf",
    });

    triggerDownload(mergedBlob, `${baseName}-問題・解答用紙.pdf`);
}
