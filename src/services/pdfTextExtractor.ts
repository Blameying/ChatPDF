import type { PDFDocumentProxy } from 'pdfjs-dist';

export async function extractPageText(doc: PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await doc.getPage(pageNum);
  const content = await page.getTextContent();
  return content.items
    .filter((item): item is { str: string } & typeof item => 'str' in item)
    .map(item => item.str)
    .join(' ');
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
