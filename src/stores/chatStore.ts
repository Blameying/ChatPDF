import { create } from 'zustand';

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: { name: string; result: string }[];
  quotedText?: string;
}

interface ChatState {
  messages: ChatMsg[];
  streaming: boolean;
  streamingContent: string;
  addMessage: (msg: ChatMsg) => void;
  setStreaming: (v: boolean) => void;
  appendStreamDelta: (delta: string) => void;
  finalizeStream: (content: string) => void;
  clearMessages: () => void;
  setMessages: (msgs: ChatMsg[]) => void;
}

let msgCounter = 0;
export const genMsgId = () => `msg-${++msgCounter}-${Date.now()}`;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streaming: false,
  streamingContent: '',

  addMessage: (msg) => set(state => ({ messages: [...state.messages, msg] })),

  setStreaming: (v) => set({ streaming: v, streamingContent: v ? '' : '' }),

  appendStreamDelta: (delta) => set(state => ({
    streamingContent: state.streamingContent + delta,
  })),

  finalizeStream: (content) => set(state => ({
    streaming: false,
    streamingContent: '',
    messages: [...state.messages, {
      id: genMsgId(),
      role: 'assistant',
      content: content || state.streamingContent,
    }],
  })),

  clearMessages: () => set({ messages: [], streaming: false, streamingContent: '' }),

  setMessages: (msgs) => set({ messages: msgs }),
}));
