import { Wrench } from 'lucide-react';

interface ToolCallResultProps {
  name: string;
  result: string;
}

export function ToolCallResult({ name, result }: ToolCallResultProps) {
  return (
    <div
      className="flex items-start gap-1.5 text-xs rounded px-2 py-1.5 mb-1"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
    >
      <Wrench size={12} className="shrink-0 mt-0.5" />
      <div>
        <span className="font-medium">{name}</span>
        <div className="mt-0.5 opacity-80">{result}</div>
      </div>
    </div>
  );
}
