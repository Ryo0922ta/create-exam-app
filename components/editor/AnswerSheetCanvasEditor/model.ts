import { fabric } from "fabric";
import type {
    ExamHeaderConfig,
    NameboxConfig,
    QuestionBlockConfig,
    ScoreTableConfig,
} from "@/types/editor";
import {
    createQuestionBlock,
    type CustomQuestionBlockGroup,
} from "@/lib/editor/questionBlockBuilder";
import {
    createExamHeaderBlock,
    DEFAULT_EXAM_HEADER_CONFIG,
} from "@/lib/editor/basicPartBuilder";
import type { CustomFabricBlock } from "../question-property-panel/types";

export type EditableBlockType =
    | "question-block"
    | "exam-header"
    | "namebox"
    | "score-table";

type CustomFabricBlockMetadata = CustomFabricBlock & {
    customType?: EditableBlockType;
    questionConfig?: QuestionBlockConfig;
    examHeaderConfig?: ExamHeaderConfig;
    nameboxConfig?: NameboxConfig;
    scoreTableConfig?: ScoreTableConfig;
};

export function isEditableBlock(
    obj: fabric.Object | null | undefined,
): obj is CustomFabricBlock & { customType: EditableBlockType } {
    if (!obj) return false;
    const block = obj as CustomFabricBlock;
    return (
        block.customType === "question-block" ||
        block.customType === "exam-header" ||
        block.customType === "namebox" ||
        block.customType === "score-table"
    );
}

export function isQuestionBlock(
    obj: fabric.Object | null | undefined,
): obj is CustomQuestionBlockGroup & { customType: "question-block" } {
    return isEditableBlock(obj) && obj.customType === "question-block";
}

export function setupInitialSampleLayout(canvas: fabric.Canvas): void {
    const headerGroup = createExamHeaderBlock(
        DEFAULT_EXAM_HEADER_CONFIG,
        40,
        40,
    );
    canvas.add(headerGroup);

    canvas.getObjects().forEach((obj) => {
        obj.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        });
        obj.setCoords();
    });
    canvas.requestRenderAll();
}

export function countQuestionBlocks(canvas: fabric.Canvas): number {
    return canvas.getObjects().filter(isQuestionBlock).length;
}

export function removeObjectsFromCanvas(
    canvas: fabric.Canvas,
    objects: fabric.Object[],
): number {
    canvas.discardActiveObject();
    objects.forEach((object) => canvas.remove(object));
    canvas.requestRenderAll();
    return countQuestionBlocks(canvas);
}

export function cloneBlockObject(
    source: CustomFabricBlock,
    left: number,
    top: number,
    onClone: (cloned: CustomFabricBlock) => void,
): void {
    source.clone((clonedObject: fabric.Object) => {
        clonedObject.set({ left, top, evented: true });
        const sourceWithMetadata = source as CustomFabricBlockMetadata;
        const cloned = clonedObject as CustomFabricBlockMetadata;

        if (sourceWithMetadata.customType) {
            cloned.customType = sourceWithMetadata.customType;
        }
        if (sourceWithMetadata.questionConfig) {
            cloned.questionConfig = JSON.parse(
                JSON.stringify(sourceWithMetadata.questionConfig),
            );
        }
        if (sourceWithMetadata.examHeaderConfig) {
            cloned.examHeaderConfig = JSON.parse(
                JSON.stringify(sourceWithMetadata.examHeaderConfig),
            );
        }
        if (sourceWithMetadata.nameboxConfig) {
            cloned.nameboxConfig = JSON.parse(
                JSON.stringify(sourceWithMetadata.nameboxConfig),
            );
        }
        if (sourceWithMetadata.scoreTableConfig) {
            cloned.scoreTableConfig = JSON.parse(
                JSON.stringify(sourceWithMetadata.scoreTableConfig),
            );
        }

        onClone(cloned);
    });
}

export function replaceQuestionRubric(
    canvas: fabric.Canvas,
    target: string,
    replacement: string,
): number {
    if (!target) return 0;

    let replaceCount = 0;
    const objects = canvas.getObjects().filter(isQuestionBlock);

    objects.forEach((object) => {
        const config = object.questionConfig;
        if (!config || !config.rubric.includes(target)) return;

        config.rubric = config.rubric.replaceAll(target, replacement);
        replaceCount++;

        const left = object.left || 40;
        const top = object.top || 40;
        canvas.remove(object);
        canvas.add(createQuestionBlock(config, left, top));
    });

    return replaceCount;
}
