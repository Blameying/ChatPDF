export function splitTextIntoWords(textLayerDiv: HTMLElement, wordSet: Set<string>): void {
  const spans = Array.from(textLayerDiv.querySelectorAll('span:not(.word-span)'));

  for (const span of spans) {
    const text = span.textContent ?? '';
    if (!text.trim()) continue;

    // Split by word boundaries (spaces, punctuation)
    const parts = text.split(/(\s+)/);
    if (parts.length <= 1 && !/\s/.test(text)) {
      // Single word, just mark the span
      span.classList.add('word-span');
      const lower = text.replace(/[^\w'-]/g, '').toLowerCase();
      if (lower && wordSet.has(lower)) {
        span.classList.add('word-difficult');
      }
      continue;
    }

    const fragment = document.createDocumentFragment();
    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        continue;
      }
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word-span';
      wordSpan.textContent = part;

      const cleanWord = part.replace(/[^\w'-]/g, '').toLowerCase();
      if (cleanWord && wordSet.has(cleanWord)) {
        wordSpan.classList.add('word-difficult');
      }

      fragment.appendChild(wordSpan);
    }

    span.textContent = '';
    span.appendChild(fragment);
  }
}

export function updateWordHighlights(textLayerDiv: HTMLElement, wordSet: Set<string>): void {
  const wordSpans = textLayerDiv.querySelectorAll('.word-span');
  for (const span of wordSpans) {
    const text = (span.textContent ?? '').replace(/[^\w'-]/g, '').toLowerCase();
    if (text && wordSet.has(text)) {
      span.classList.add('word-difficult');
    } else {
      span.classList.remove('word-difficult');
    }
  }
}
