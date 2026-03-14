// Word highlight overlay for difficult words
// This does NOT modify the pdfjs text layer - it creates a separate overlay

export function createWordHighlightOverlay(
  textLayerDiv: HTMLElement,
  wordSet: Set<string>,
): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = 'word-highlight-container';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';

  if (wordSet.size === 0) return overlay;

  const spans = textLayerDiv.querySelectorAll('span');
  spans.forEach(span => {
    const text = span.textContent ?? '';
    if (!text.trim()) return;

    // Find difficult words within this span's text
    const words = text.split(/(\s+)/);
    let charOffset = 0;

    for (const part of words) {
      if (/^\s*$/.test(part)) {
        charOffset += part.length;
        continue;
      }

      const clean = part.replace(/[^\w'-]/g, '').toLowerCase();
      if (clean && wordSet.has(clean)) {
        // Create a highlight rect based on the span's position
        // Use Range to get precise bounding rect
        const textNode = span.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          try {
            const range = document.createRange();
            const start = Math.min(charOffset, textNode.textContent!.length);
            const end = Math.min(charOffset + part.length, textNode.textContent!.length);
            range.setStart(textNode, start);
            range.setEnd(textNode, end);

            const rects = range.getClientRects();
            const containerRect = textLayerDiv.getBoundingClientRect();

            for (const rect of rects) {
              const highlight = document.createElement('div');
              highlight.className = 'word-highlight-overlay';
              highlight.style.left = `${rect.left - containerRect.left}px`;
              highlight.style.top = `${rect.top - containerRect.top}px`;
              highlight.style.width = `${rect.width}px`;
              highlight.style.height = `${rect.height}px`;
              overlay.appendChild(highlight);
            }

            range.detach();
          } catch {
            // Offset out of bounds, skip
          }
        }
      }
      charOffset += part.length;
    }
  });

  return overlay;
}

export function updateWordHighlights(
  container: HTMLElement,
  textLayerDiv: HTMLElement | null,
  wordSet: Set<string>,
): void {
  // Remove old overlay
  const old = container.querySelector('.word-highlight-container');
  if (old) old.remove();

  if (!textLayerDiv || wordSet.size === 0) return;

  const overlay = createWordHighlightOverlay(textLayerDiv, wordSet);
  container.appendChild(overlay);
}
