import { fabric } from "fabric";
import {
    getFaceRegion,
    MarginRegions,
} from "@/lib/editor/marginGuides";

export const ALIGNMENT_SNAP_THRESHOLD = 8;
export const ALIGNMENT_GUIDE_STROKE = "#f43f5e";

export interface BoundingRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
}

export interface GuideLineSpec {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface AlignmentSnapResult {
    left: number;
    top: number;
    snappedX: boolean;
    snappedY: boolean;
    guides: GuideLineSpec[];
}

interface SnapCandidate {
    delta: number;
    guides: GuideLineSpec[];
}

interface GuideObject extends fabric.Line {
    customType?: string;
}

export function isAlignmentGuide(obj: fabric.Object): boolean {
    return (obj as GuideObject).customType === "alignment-guide";
}

export function getObjectBounds(obj: fabric.Object): BoundingRect {
    const r = obj.getBoundingRect(true);
    return {
        left: r.left,
        top: r.top,
        right: r.left + r.width,
        bottom: r.top + r.height,
        centerX: r.left + r.width / 2,
        centerY: r.top + r.height / 2,
        width: r.width,
        height: r.height,
    };
}

function verticalGuide(x: number, ...rects: BoundingRect[]): GuideLineSpec {
    const minY = Math.min(...rects.map((r) => r.top));
    const maxY = Math.max(...rects.map((r) => r.bottom));
    return { x1: x, y1: minY, x2: x, y2: maxY };
}

function horizontalGuide(y: number, ...rects: BoundingRect[]): GuideLineSpec {
    const minX = Math.min(...rects.map((r) => r.left));
    const maxX = Math.max(...rects.map((r) => r.right));
    return { x1: minX, y1: y, x2: maxX, y2: y };
}

function withOffset(rect: BoundingRect, deltaX: number, deltaY: number): BoundingRect {
    return {
        left: rect.left + deltaX,
        top: rect.top + deltaY,
        right: rect.right + deltaX,
        bottom: rect.bottom + deltaY,
        centerX: rect.centerX + deltaX,
        centerY: rect.centerY + deltaY,
        width: rect.width,
        height: rect.height,
    };
}

function overlapsY(a: BoundingRect, b: BoundingRect): boolean {
    return a.top < b.bottom && a.bottom > b.top;
}

function overlapsX(a: BoundingRect, b: BoundingRect): boolean {
    return a.left < b.right && a.right > b.left;
}

function isOnLeftFace(rect: BoundingRect, regions: MarginRegions): boolean {
    return rect.centerX < regions.foldX;
}

function pickBestCandidate(
    candidates: SnapCandidate[],
    threshold: number,
): SnapCandidate | null {
    let best: SnapCandidate | null = null;
    for (const c of candidates) {
        if (Math.abs(c.delta) > threshold) continue;
        if (!best || Math.abs(c.delta) < Math.abs(best.delta)) {
            best = c;
        }
    }
    return best;
}

function collectEdgeAlignCandidatesX(
    moving: BoundingRect,
    refs: BoundingRect[],
    regions: MarginRegions,
): SnapCandidate[] {
    const candidates: SnapCandidate[] = [];
    const movingEdges = [
        { val: moving.left, kind: "left" as const },
        { val: moving.right, kind: "right" as const },
        { val: moving.centerX, kind: "centerX" as const },
    ];

    const face = getFaceRegion(regions, moving.centerX);
    const paperLines = [face.left, face.right];

    for (const lineX of paperLines) {
        for (const edge of movingEdges) {
            const delta = lineX - edge.val;
            candidates.push({
                delta,
                guides: [verticalGuide(lineX, moving, withOffset(moving, delta, 0))],
            });
        }
    }

    for (const ref of refs) {
        const refEdges = [ref.left, ref.right, ref.centerX];
        for (const refX of refEdges) {
            for (const edge of movingEdges) {
                const delta = refX - edge.val;
                const snapped = withOffset(moving, delta, 0);
                candidates.push({
                    delta,
                    guides: [verticalGuide(refX, ref, snapped)],
                });
            }
        }
    }

    return candidates;
}

function collectEdgeAlignCandidatesY(
    moving: BoundingRect,
    refs: BoundingRect[],
    regions: MarginRegions,
): SnapCandidate[] {
    const candidates: SnapCandidate[] = [];
    const movingEdges = [
        { val: moving.top, kind: "top" as const },
        { val: moving.bottom, kind: "bottom" as const },
        { val: moving.centerY, kind: "centerY" as const },
    ];

    const paperLines = [regions.fullHeight.top, regions.fullHeight.bottom];

    for (const lineY of paperLines) {
        for (const edge of movingEdges) {
            const delta = lineY - edge.val;
            candidates.push({
                delta,
                guides: [
                    horizontalGuide(lineY, moving, withOffset(moving, 0, delta)),
                ],
            });
        }
    }

    for (const ref of refs) {
        const refEdges = [ref.top, ref.bottom, ref.centerY];
        for (const refY of refEdges) {
            for (const edge of movingEdges) {
                const delta = refY - edge.val;
                const snapped = withOffset(moving, 0, delta);
                candidates.push({
                    delta,
                    guides: [horizontalGuide(refY, ref, snapped)],
                });
            }
        }
    }

    return candidates;
}

function collectEqualSpacingCandidatesX(
    moving: BoundingRect,
    refs: BoundingRect[],
): SnapCandidate[] {
    const candidates: SnapCandidate[] = [];
    if (refs.length < 2) return candidates;

    const referenceGaps: { gap: number; b: BoundingRect; c: BoundingRect }[] =
        [];
    for (let i = 0; i < refs.length; i++) {
        for (let j = 0; j < refs.length; j++) {
            if (i === j) continue;
            const b = refs[i];
            const c = refs[j];
            if (c.left > b.right) {
                referenceGaps.push({ gap: c.left - b.right, b, c });
            }
        }
    }

    for (const anchor of refs) {
        for (const { gap, b, c } of referenceGaps) {
            const targetLeft = anchor.right + gap;
            const delta = targetLeft - moving.left;
            const snapped = withOffset(moving, delta, 0);
            candidates.push({
                delta,
                guides: [
                    verticalGuide(anchor.right, anchor, snapped),
                    verticalGuide(targetLeft, anchor, snapped),
                    verticalGuide(b.right, b, c),
                    verticalGuide(c.left, b, c),
                    horizontalGuide(
                        (anchor.centerY + moving.centerY) / 2,
                        anchor,
                        snapped,
                    ),
                ],
            });

            const targetRight = anchor.left - gap;
            const deltaRight = targetRight - moving.right;
            const snappedRight = withOffset(moving, deltaRight, 0);
            candidates.push({
                delta: deltaRight,
                guides: [
                    verticalGuide(anchor.left, anchor, snappedRight),
                    verticalGuide(targetRight, anchor, snappedRight),
                    verticalGuide(b.right, b, c),
                    verticalGuide(c.left, b, c),
                    horizontalGuide(
                        (anchor.centerY + moving.centerY) / 2,
                        anchor,
                        snappedRight,
                    ),
                ],
            });
        }
    }

    return candidates;
}

function collectEqualSpacingCandidatesY(
    moving: BoundingRect,
    refs: BoundingRect[],
): SnapCandidate[] {
    const candidates: SnapCandidate[] = [];
    if (refs.length < 2) return candidates;

    const referenceGaps: { gap: number; b: BoundingRect; c: BoundingRect }[] =
        [];
    for (let i = 0; i < refs.length; i++) {
        for (let j = 0; j < refs.length; j++) {
            if (i === j) continue;
            const b = refs[i];
            const c = refs[j];
            if (c.top > b.bottom) {
                referenceGaps.push({ gap: c.top - b.bottom, b, c });
            }
        }
    }

    for (const anchor of refs) {
        for (const { gap, b, c } of referenceGaps) {
            const targetTop = anchor.bottom + gap;
            const delta = targetTop - moving.top;
            const snapped = withOffset(moving, 0, delta);
            candidates.push({
                delta,
                guides: [
                    horizontalGuide(anchor.bottom, anchor, snapped),
                    horizontalGuide(targetTop, anchor, snapped),
                    horizontalGuide(b.bottom, b, c),
                    horizontalGuide(c.top, b, c),
                    verticalGuide(
                        (anchor.centerX + moving.centerX) / 2,
                        anchor,
                        snapped,
                    ),
                ],
            });

            const targetBottom = anchor.top - gap;
            const deltaBottom = targetBottom - moving.bottom;
            const snappedBottom = withOffset(moving, 0, deltaBottom);
            candidates.push({
                delta: deltaBottom,
                guides: [
                    horizontalGuide(anchor.top, anchor, snappedBottom),
                    horizontalGuide(targetBottom, anchor, snappedBottom),
                    horizontalGuide(b.bottom, b, c),
                    horizontalGuide(c.top, b, c),
                    verticalGuide(
                        (anchor.centerX + moving.centerX) / 2,
                        anchor,
                        snappedBottom,
                    ),
                ],
            });
        }
    }

    return candidates;
}

function buildDistributeXGuides(
    L: number,
    R: number,
    ordered: BoundingRect[],
    gap: number,
): GuideLineSpec[] {
    const extent = ordered;
    const guides: GuideLineSpec[] = [verticalGuide(L, ...extent)];
    let x = L + gap;
    for (const obj of ordered) {
        guides.push(verticalGuide(x, ...extent));
        x += obj.width + gap;
    }
    guides.push(verticalGuide(R, ...extent));
    return guides;
}

function buildDistributeYGuides(
    T: number,
    B: number,
    ordered: BoundingRect[],
    gap: number,
): GuideLineSpec[] {
    const extent = ordered;
    const guides: GuideLineSpec[] = [horizontalGuide(T, ...extent)];
    let y = T + gap;
    for (const obj of ordered) {
        guides.push(horizontalGuide(y, ...extent));
        y += obj.height + gap;
    }
    guides.push(horizontalGuide(B, ...extent));
    return guides;
}

function collectDistributeCandidatesX(
    moving: BoundingRect,
    refs: BoundingRect[],
    regions: MarginRegions,
): SnapCandidate[] {
    const candidates: SnapCandidate[] = [];
    const onLeft = isOnLeftFace(moving, regions);
    const face = onLeft ? regions.leftFace : regions.rightFace;
    const L = face.left;
    const R = face.right;

    const bandRefs = refs.filter(
        (ref) =>
            overlapsY(moving, ref) &&
            (onLeft ? isOnLeftFace(ref, regions) : !isOnLeftFace(ref, regions)),
    );

    const sortedRefs = [...bandRefs].sort((a, b) => a.left - b.left);
    const n = sortedRefs.length + 1;
    if (n < 3) return candidates;

    for (let insertIndex = 0; insertIndex < n; insertIndex++) {
        const ordered = [
            ...sortedRefs.slice(0, insertIndex),
            moving,
            ...sortedRefs.slice(insertIndex),
        ];
        const totalWidth = ordered.reduce((sum, r) => sum + r.width, 0);
        const totalGapSpace = R - L - totalWidth;
        if (totalGapSpace <= 0) continue;

        const gap = totalGapSpace / (n + 1);
        let x = L + gap;
        for (let i = 0; i < insertIndex; i++) {
            x += ordered[i].width + gap;
        }
        const idealLeft = x;
        const delta = idealLeft - moving.left;
        const snapped = withOffset(moving, delta, 0);
        const snappedOrdered = ordered.map((r) =>
            r === moving ? snapped : r,
        );

        candidates.push({
            delta,
            guides: buildDistributeXGuides(L, R, snappedOrdered, gap),
        });
    }

    return candidates;
}

function collectDistributeCandidatesY(
    moving: BoundingRect,
    refs: BoundingRect[],
    regions: MarginRegions,
): SnapCandidate[] {
    const candidates: SnapCandidate[] = [];
    const T = regions.fullHeight.top;
    const B = regions.fullHeight.bottom;

    const bandRefs = refs.filter(
        (ref) => overlapsX(moving, ref),
    );

    const sortedRefs = [...bandRefs].sort((a, b) => a.top - b.top);
    const n = sortedRefs.length + 1;
    if (n < 3) return candidates;

    for (let insertIndex = 0; insertIndex < n; insertIndex++) {
        const ordered = [
            ...sortedRefs.slice(0, insertIndex),
            moving,
            ...sortedRefs.slice(insertIndex),
        ];
        const totalHeight = ordered.reduce((sum, r) => sum + r.height, 0);
        const totalGapSpace = B - T - totalHeight;
        if (totalGapSpace <= 0) continue;

        const gap = totalGapSpace / (n + 1);
        let y = T + gap;
        for (let i = 0; i < insertIndex; i++) {
            y += ordered[i].height + gap;
        }
        const idealTop = y;
        const delta = idealTop - moving.top;
        const snapped = withOffset(moving, 0, delta);
        const snappedOrdered = ordered.map((r) =>
            r === moving ? snapped : r,
        );

        candidates.push({
            delta,
            guides: buildDistributeYGuides(T, B, snappedOrdered, gap),
        });
    }

    return candidates;
}

export function computeAlignmentSnap(
    movingObj: fabric.Object,
    referenceObjects: fabric.Object[],
    paperWidth: number,
    paperHeight: number,
    zoom: number,
    regions: MarginRegions,
): AlignmentSnapResult {
    const threshold = ALIGNMENT_SNAP_THRESHOLD / Math.max(zoom, 0.01);
    const moving = getObjectBounds(movingObj);
    const refs = referenceObjects.map(getObjectBounds);
    const currentLeft = movingObj.left ?? 0;
    const currentTop = movingObj.top ?? 0;

    const xCandidates = [
        ...collectEdgeAlignCandidatesX(moving, refs, regions),
        ...collectEqualSpacingCandidatesX(moving, refs),
        ...collectDistributeCandidatesX(moving, refs, regions),
    ];
    const yCandidates = [
        ...collectEdgeAlignCandidatesY(moving, refs, regions),
        ...collectEqualSpacingCandidatesY(moving, refs),
        ...collectDistributeCandidatesY(moving, refs, regions),
    ];

    const bestX = pickBestCandidate(xCandidates, threshold);
    const bestY = pickBestCandidate(yCandidates, threshold);

    const guides: GuideLineSpec[] = [];
    if (bestX) guides.push(...bestX.guides);
    if (bestY) guides.push(...bestY.guides);

    return {
        left: currentLeft + (bestX?.delta ?? 0),
        top: currentTop + (bestY?.delta ?? 0),
        snappedX: !!bestX,
        snappedY: !!bestY,
        guides,
    };
}

export function clearAlignmentGuides(canvas: fabric.Canvas): void {
    canvas.getObjects().filter(isAlignmentGuide).forEach((g) => canvas.remove(g));
}

export function renderAlignmentGuides(
    canvas: fabric.Canvas,
    guides: GuideLineSpec[],
): void {
    clearAlignmentGuides(canvas);
    for (const g of guides) {
        const line = new fabric.Line([g.x1, g.y1, g.x2, g.y2], {
            stroke: ALIGNMENT_GUIDE_STROKE,
            strokeWidth: 1,
            strokeDashArray: [4, 4],
            selectable: false,
            evented: false,
            excludeFromExport: true,
            opacity: 0.95,
        }) as GuideObject;
        line.customType = "alignment-guide";
        canvas.add(line);
        canvas.sendToBack(line);
    }
}

export function stripAlignmentGuidesForExport(
    canvas: fabric.Canvas,
): fabric.Object[] {
    const guides = canvas.getObjects().filter(isAlignmentGuide);
    guides.forEach((g) => canvas.remove(g));
    return guides;
}

export function restoreAlignmentGuides(
    canvas: fabric.Canvas,
    guides: fabric.Object[],
): void {
    guides.forEach((g) => canvas.add(g));
    guides.forEach((g) => canvas.sendToBack(g));
}
