import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import type { ChatMsg } from '../../stores/chatStore';

interface ChatMessageProps {
  message: ChatMsg;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
        style={{
          backgroundColor: isUser ? 'var(--color-primary, #3b82f6)' : 'var(--bg-secondary)',
          color: isUser ? 'white' : 'var(--text-primary)',
        }}
      >
        {message.quotedText && (
          <div
            className="text-xs mb-1 px-2 py-1 rounded border-l-2 opacity-75"
            style={{ borderColor: isUser ? 'rgba(255,255,255,0.5)' : 'var(--border-color)' }}
          >
            {message.quotedText}
          </div>
        )}
        <div className="chat-markdown">
          <Markdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
          >
            {message.content}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
