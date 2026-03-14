import type { DifficultWord } from '../stores/wordListStore';

export function exportToAnkiTsv(words: DifficultWord[], separator: string = '\t'): string {
  return words
    .map(w => {
      const fields = [w.word, w.translation];
      if (w.context) fields.push(w.context);
      return fields.join(separator);
    })
    .join('\n');
}
