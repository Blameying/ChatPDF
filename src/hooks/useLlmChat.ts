import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { sendMessage } from '../services/tauriCommands';
import { useChatStore, genMsgId } from '../stores/chatStore';
import type { ChatMsg } from '../stores/chatStore';

export function useLlmChat() {
  const { messages, streaming, streamingContent, addMessage, setStreaming, appendStreamDelta, finalizeStream } = useChatStore();

  useEffect(() => {
    const unlisteners: (() => void)[] = [];

    const setup = async () => {
      unlisteners.push(await listen<string>('chat:delta', (e) => {
        appendStreamDelta(e.payload);
      }));

      unlisteners.push(await listen<string>('chat:done', (e) => {
        finalizeStream(e.payload);
      }));

      unlisteners.push(await listen<string>('chat:error', (e) => {
        finalizeStream(`Error: ${e.payload}`);
      }));

      unlisteners.push(await listen<{ name: string; arguments: string }>('chat:tool_call', (_e) => {
        // Tool calls are shown as part of the stream
      }));

      unlisteners.push(await listen<{ name: string; result: string }>('chat:tool_result', (e) => {
        appendStreamDelta(`\n[Tool: ${e.payload.name}] ${e.payload.result}\n`);
      }));
    };

    setup();
    return () => { unlisteners.forEach(u => u()); };
  }, [appendStreamDelta, finalizeStream]);

  const send = useCallback(async (content: string, documentContext?: string, quotedText?: string) => {
    const userMsg: ChatMsg = {
      id: genMsgId(),
      role: 'user',
      content: quotedText ? `> ${quotedText}\n\n${content}` : content,
      quotedText,
    };
    addMessage(userMsg);
    setStreaming(true);

    const chatMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await sendMessage(chatMessages, documentContext);
    } catch (err) {
      finalizeStream(`Error: ${String(err)}`);
    }
  }, [messages, addMessage, setStreaming, finalizeStream]);

  return { messages, streaming, streamingContent, send };
}
