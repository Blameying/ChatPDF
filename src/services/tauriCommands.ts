import { invoke } from '@tauri-apps/api/core';

export interface FileInfo {
  path: string;
  hash: string;
  name: string;
}

export interface RecentFile {
  path: string;
  hash: string;
  title: string | null;
  last_page: number;
  last_opened: string;
}

export interface DocumentInfo {
  id: number;
  path: string;
  hash: string;
  title: string | null;
  total_pages: number | null;
  last_page: number;
  scroll_y: number;
  zoom_level: number;
  last_opened: string;
}

export interface TranslationResult {
  word: string;
  translation: string;
}

export const openFile = (path: string) => invoke<FileInfo>('open_file', { path });
export const getRecentFiles = () => invoke<RecentFile[]>('get_recent_files');
export const exportAnnotationsMarkdown = (documentHash: string) => invoke<string>('export_annotations_markdown', { documentHash });
export const exportWordsAnki = () => invoke<string>('export_words_anki');

export const trackDocument = (path: string, hash: string, title?: string, totalPages?: number) =>
  invoke('track_document', { path, hash, title: title ?? null, totalPages: totalPages ?? null });
export const updateProgress = (hash: string, lastPage: number, scrollY: number, zoomLevel: number) =>
  invoke('update_progress', { hash, lastPage, scrollY, zoomLevel });
export const getDocument = (hash: string) => invoke<DocumentInfo | null>('get_document', { hash });

export const translateWord = (word: string, context?: string) =>
  invoke<TranslationResult>('translate_word', { word, context: context ?? null });
export const translateBatch = (words: string[]) =>
  invoke<TranslationResult[]>('translate_batch', { words });

export const sendMessage = (messages: { role: string; content: string }[], documentContext?: string) =>
  invoke('send_message', { messages, documentContext: documentContext ?? null });

export const getChatHistory = (documentHash: string) => invoke<string | null>('get_chat_history', { documentHash });
export const saveChatHistory = (documentHash: string, messages: string) =>
  invoke('save_chat_history', { documentHash, messages });

export const getConfig = () => invoke<string>('get_config');
export const getConfigSchema = () => invoke<string>('get_config_schema');
export const updateConfig = (section: string, key: string, value: string) =>
  invoke('update_config', { section, key, value });
export const resetConfig = (section?: string, key?: string) =>
  invoke('reset_config', { section: section ?? null, key: key ?? null });
