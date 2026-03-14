import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useLlmChat } from '../../hooks/useLlmChat';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import { useTabStore } from '../../stores/tabStore';
import { extractContextPages } from '../../services/pdfTextExtractor';
import { saveChatHistory, getChatHistory } from '../../services/tauriCommands';
import Markdown from 'react-markdown';

interface ChatPanelProps {
  documentHash: string | null;
}

export function ChatPanel({ documentHash }: ChatPanelProps) {
  const { messages, streaming, streamingContent, send } = useLlmChat();
  const { setChatPanelOpen } = useUIStore();
  const { clearMessages, setMessages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [quotedText, setQuotedText] = useState<string | undefined>();

  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const { doc } = usePdfDocument(activeTab?.path ?? null);

  // Load chat history
  useEffect(() => {
    if (!documentHash) return;
    getChatHistory(documentHash).then(saved => {
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch {}
      }
    });
  }, [documentHash]);

  // Save chat history when messages change
  useEffect(() => {
    if (!documentHash || messages.length === 0) return;
    saveChatHistory(documentHash, JSON.stringify(messages)).catch(() => {});
  }, [messages, documentHash]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Listen for text selection to quote
  useEffect(() => {
    const handler = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0) {
        setQuotedText(text);
      }
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, []);

  const handleSend = useCallback(async (content: string, quoted?: string) => {
    let context: string | undefined;
    if (doc) {
      try {
        const { currentPage } = (await import('../../stores/pdfStore')).usePdfStore.getState()
          .getView(activeTab?.hash ?? '');
        context = await extractContextPages(doc, currentPage);
      } catch {}
    }
    send(content, context, quoted);
  }, [doc, send, activeTab]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="flex items-center h-8 px-3 shrink-0 border-b"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          AI Chat
        </span>
        <div className="flex-1" />
        <button
          onClick={() => clearMessages()}
          className="p-1 rounded hover:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
          title="Clear chat"
        >
          <Trash2 size={12} />
        </button>
        <button
          onClick={() => setChatPanelOpen(false)}
          className="p-1 rounded hover:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {streaming && streamingContent && (
          <div className="flex justify-start mb-3">
            <div
              className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <div className="prose prose-sm max-w-none [&_p]:m-0">
                <Markdown>{streamingContent}</Markdown>
              </div>
              <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: 'var(--text-secondary)' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={streaming}
        quotedText={quotedText}
        onClearQuote={() => setQuotedText(undefined)}
      />
    </div>
  );
}
