import type { PDFDocumentProxy } from 'pdfjs-dist';

export async function extractPageText(doc: PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await doc.getPage(pageNum);
  // Use streamTextContent + reader to avoid getTextContent's for-await
  // which WKWebView doesn't support
  const stream = page.streamTextContent();
  const reader = stream.getReader();
  const texts: string[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value?.items) {
      for (const item of value.items) {
        if ('str' in item) texts.push(item.str);
      }
    }
  }
  return texts.join(' ');
}

export async function extractContextPages(
  doc: PDFDocumentProxy,
  currentPage: number,
  range: number = 2,
): Promise<string> {
  const start = Math.max(1, currentPage - range);
  const end = Math.min(doc.numPages, currentPage + range);
  const pages: string[] = [];

  for (let i = start; i <= end; i++) {
    const text = await extractPageText(doc, i);
    pages.push(`--- Page ${i} ---\n${text}`);
  }

  return pages.join('\n\n');
}
