import { useState } from 'react';
import { X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { AppConfig } from '../../stores/settingsStore';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const config = useSettingsStore(s => s.config);
  const updateConfig = useSettingsStore(s => s.updateConfig);
  const [activeSection, setActiveSection] = useState('general');

  if (!config) return null;

  const sections = ['general', 'llm', 'translation', 'keyboard', 'export'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-36 border-r py-2 shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            {sections.map(s => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className="w-full text-left px-3 py-1.5 text-xs capitalize"
                style={{
                  backgroundColor: activeSection === s ? 'var(--bg-tertiary)' : 'transparent',
                  color: activeSection === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeSection === 'general' && <GeneralSettings config={config} update={updateConfig} />}
            {activeSection === 'llm' && <LlmSettings config={config} update={updateConfig} />}
            {activeSection === 'translation' && <TranslationSettings config={config} update={updateConfig} />}
            {activeSection === 'keyboard' && <KeyboardSettings config={config} update={updateConfig} />}
            {activeSection === 'export' && <ExportSettings config={config} update={updateConfig} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-xs" style={{ color: 'var(--text-primary)' }}>{label}</label>
      {children}
    </div>
  );
}

function SettingInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs px-2 py-1 rounded w-48 outline-none"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
      }}
    />
  );
}

function SettingSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs px-2 py-1 rounded outline-none"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

type UpdateFn = (section: string, key: string, value: string) => Promise<void>;

function GeneralSettings({ config, update }: { config: AppConfig; update: UpdateFn }) {
  return (
    <div>
      <SettingRow label="Theme">
        <SettingSelect value={config.general.theme} options={['light', 'dark', 'sepia']}
          onChange={v => update('general', 'theme', v)} />
      </SettingRow>
      <SettingRow label="Language">
        <SettingInput value={config.general.language} onChange={v => update('general', 'language', v)} />
      </SettingRow>
      <SettingRow label="Hover delay (ms)">
        <SettingInput value={String(config.general.hover_delay_ms)}
          onChange={v => update('general', 'hover_delay_ms', v)} />
      </SettingRow>
    </div>
  );
}

function LlmSettings({ config, update }: { config: AppConfig; update: UpdateFn }) {
  return (
    <div>
      <SettingRow label="Base URL">
        <SettingInput value={config.llm.base_url} onChange={v => update('llm', 'base_url', v)} />
      </SettingRow>
      <SettingRow label="API Key">
        <input
          type="password"
          value={config.llm.api_key}
          onChange={e => update('llm', 'api_key', e.target.value)}
          className="text-xs px-2 py-1 rounded w-48 outline-none"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
      </SettingRow>
      <SettingRow label="Model">
        <SettingInput value={config.llm.model} onChange={v => update('llm', 'model', v)} />
      </SettingRow>
      <SettingRow label="Max context tokens">
        <SettingInput value={String(config.llm.max_context_tokens)}
          onChange={v => update('llm', 'max_context_tokens', v)} />
      </SettingRow>
    </div>
  );
}

function TranslationSettings({ config, update }: { config: AppConfig; update: UpdateFn }) {
  return (
    <div>
      <SettingRow label="Provider">
        <SettingSelect value={config.translation.provider} options={['llm', 'deepl', 'google']}
          onChange={v => update('translation', 'provider', v)} />
      </SettingRow>
      <SettingRow label="Target language">
        <SettingInput value={config.translation.target_lang}
          onChange={v => update('translation', 'target_lang', v)} />
      </SettingRow>
      <SettingRow label="Source language">
        <SettingInput value={config.translation.source_lang}
          onChange={v => update('translation', 'source_lang', v)} />
      </SettingRow>
      {config.translation.provider === 'deepl' && (
        <>
          <SettingRow label="DeepL API Key">
            <input
              type="password"
              value={config.translation.deepl.api_key}
              onChange={e => update('translation.deepl', 'api_key', e.target.value)}
              className="text-xs px-2 py-1 rounded w-48 outline-none"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </SettingRow>
        </>
      )}
    </div>
  );
}

function KeyboardSettings({ config, update }: { config: AppConfig; update: UpdateFn }) {
  const keys = Object.entries(config.keyboard) as [string, string][];
  return (
    <div>
      {keys.map(([key, value]) => (
        <SettingRow key={key} label={key.replace(/_/g, ' ')}>
          <SettingInput value={value} onChange={v => update('keyboard', key, v)} />
        </SettingRow>
      ))}
    </div>
  );
}

function ExportSettings({ config, update }: { config: AppConfig; update: UpdateFn }) {
  return (
    <div>
      <SettingRow label="Include page numbers (MD)">
        <SettingSelect
          value={String(config.export.markdown_include_page_numbers)}
          options={['true', 'false']}
          onChange={v => update('export', 'markdown_include_page_numbers', v)}
        />
      </SettingRow>
    </div>
  );
}
