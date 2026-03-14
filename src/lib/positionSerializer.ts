export interface AnnotationPosition {
  page: number;
  rects: { x: number; y: number; width: number; height: number }[];
  text?: string;
}

export function serializePosition(pos: AnnotationPosition): string {
  return JSON.stringify(pos);
}

export function deserializePosition(data: string): AnnotationPosition | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
