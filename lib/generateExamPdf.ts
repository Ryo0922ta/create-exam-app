import { LayoutSettings } from "@/types/layout";
import { Question } from "@/types/question";

type NumberedQuestion = {
    question: Question;
    displayNumber: number;
};

type GenerateExamPdfOptions = {
    fileName: string | null;
    previewQuestions: NumberedQuestion[];
    choiceQuestions: Question[];
    wordQuestions: Question[];
    essayQuestions: Question[];
    displayNumbers: ReadonlyMap<number, number>;
    layout: LayoutSettings;
};

export async function generateExamPdf({
    fileName,
    previewQuestions,
    choiceQuestions,
    wordQuestions,
    essayQuestions,
    displayNumbers,
    layout,
}: GenerateExamPdfOptions) {
    const [
        { pdf },
        { PDFDocument },
        { QuestionSheetDocument, AnswerSheetDocument },
    ] = await Promise.all([
        import("@react-pdf/renderer"),
        import("pdf-lib"),
        import("@/components/pdfDocuments"),
    ]);

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
    const downloadUrl = URL.createObjectURL(mergedBlob);
    const downloadLink = document.createElement("a");
    const baseName = fileName?.replace(/\.csv$/i, "") || "解答用紙";

    downloadLink.href = downloadUrl;
    downloadLink.download = `${baseName}-問題・解答用紙.pdf`;
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
}
