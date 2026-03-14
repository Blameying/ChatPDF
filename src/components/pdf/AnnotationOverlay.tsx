import type { Annotation } from '../../hooks/useAnnotations';
import { deserializePosition } from '../../lib/positionSerializer';

interface AnnotationOverlayProps {
  annotations: Annotation[];
  pageNumber: number;
}

export function AnnotationOverlay({ annotations, pageNumber }: AnnotationOverlayProps) {
  const pageAnnotations = annotations.filter(a => a.page === pageNumber);

  return (
    <>
      {pageAnnotations.map(ann => {
        const pos = deserializePosition(ann.position_data);
        if (!pos?.rects) return null;

        return pos.rects.map((rect, i) => (
          <div
            key={`${ann.id}-${i}`}
            className="annotation-highlight"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              backgroundColor: ann.color,
              opacity: 0.3,
            }}
            title={ann.content ?? undefined}
          />
        ));
      })}
    </>
  );
}
