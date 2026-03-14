import { useState, useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

import { TitleBar } from './TitleBar';

import { StatusBar } from './StatusBar';
import { PdfViewer } from '../pdf/PdfViewer';
import { HoverTooltip } from '../pdf/HoverTooltip';
import { SelectionToolbar } from '../pdf/SelectionToolbar';
import { SearchBar } from '../pdf/SearchBar';
import { OutlineSidebar } from '../sidebar/OutlineSidebar';
import { WordListSidebar } from '../sidebar/WordListSidebar';
import { AnnotationList } from '../sidebar/AnnotationList';
import { ChatPanel } from '../chat/ChatPanel';
import { SettingsModal } from '../settings/SettingsModal';
import { CommandPalette } from '../settings/CommandPalette';

import { useTabStore } from '../../stores/tabStore';
import { useUIStore } from '../../stores/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useHoverTranslation } from '../../hooks/useHoverTranslation';
import { useDifficultWords } from '../../hooks/useDifficultWords';
import { useSettingsStore } from '../../stores/settingsStore';
import { openFile } from '../../services/tauriCommands';

export function AppShell() {
  useTheme();
  useKeyboardShortcuts();
  useDifficultWords();
  const { hover, dismiss, onTooltipEnter, onTooltipLeave } = useHoverTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { addTab } = useTabStore();
  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const { sidebarPanel, chatPanelOpen, zenMode, searchOpen } = useUIStore();

  // Initialize settings: load config from Rust, then listen for changes
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const init = async () => {
      await useSettingsStore.getState().loadConfig();
      const unlisten = await useSettingsStore.getState().initListener();
      cleanup = unlisten;
    };
    init();
    return () => { cleanup?.(); };
  }, []);

  const handleOpenFile = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!selected) return;

    const path = selected as string;
    try {
      const info = await openFile(path);
      addTab({
        id: `tab-${Date.now()}`,
        path: info.path,
        hash: info.hash,
        name: info.name,
      });
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, [addTab]);

  const sidebarContent = sidebarPanel === 'outline' ? (
    <OutlineSidebar />
  ) : sidebarPanel === 'wordlist' ? (
    <WordListSidebar />
  ) : sidebarPanel === 'annotations' ? (
    <AnnotationList />
  ) : null;

  return (
    <div className="flex flex-col h-full">
      <TitleBar onOpenFile={handleOpenFile} onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex-1 overflow-hidden relative">
        {searchOpen && <SearchBar />}

        <Allotment>
          {sidebarContent && !zenMode && (
            <Allotment.Pane preferredSize={250} minSize={180} maxSize={400}>
              <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {sidebarContent}
              </div>
            </Allotment.Pane>
          )}

          <Allotment.Pane>
            {activeTab ? (
              <PdfViewer
                filePath={activeTab.path}
                hash={activeTab.hash}
              />
            ) : (
              <WelcomeScreen onOpenFile={handleOpenFile} />
            )}
          </Allotment.Pane>

          {chatPanelOpen && !zenMode && (
            <Allotment.Pane preferredSize={350} minSize={280} maxSize={600}>
              <ChatPanel documentHash={activeTab?.hash ?? null} />
            </Allotment.Pane>
          )}
        </Allotment>

        <HoverTooltip hover={hover} onDismiss={dismiss} onMouseEnter={onTooltipEnter} onMouseLeave={onTooltipLeave} />
        <SelectionToolbar />
      </div>

      <StatusBar />

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <CommandPalette />
    </div>
  );
}

function WelcomeScreen({ onOpenFile }: { onOpenFile: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-4"
      style={{ color: 'var(--text-secondary)' }}
    >
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Welcome to ChatPDF
      </h2>
      <p className="text-sm">Open a PDF to get started</p>
      <button
        onClick={onOpenFile}
        className="px-4 py-2 rounded text-sm font-medium text-white"
        style={{ backgroundColor: 'var(--color-primary, #3b82f6)' }}
      >
        Open PDF
      </button>
      <p className="text-xs mt-4">
        Tip: Use <kbd className="px-1 py-0.5 rounded border text-xs" style={{ borderColor: 'var(--border-color)' }}>Ctrl+P</kbd> for command palette
      </p>
    </div>
  );
}
