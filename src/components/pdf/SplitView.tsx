import { Allotment } from 'allotment';
import { PdfViewer } from './PdfViewer';

interface SplitViewProps {
  files: { path: string; hash: string }[];
  direction?: 'horizontal' | 'vertical';
}

export function SplitView({ files, direction = 'horizontal' }: SplitViewProps) {
  if (files.length === 0) return null;
  if (files.length === 1) {
    return <PdfViewer filePath={files[0].path} hash={files[0].hash} />;
  }

  return (
    <Allotment vertical={direction === 'vertical'}>
      {files.map((file, i) => (
        <Allotment.Pane key={file.hash + i}>
          <PdfViewer filePath={file.path} hash={file.hash} />
        </Allotment.Pane>
      ))}
    </Allotment>
  );
}
