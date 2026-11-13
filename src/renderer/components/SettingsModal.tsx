import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { AIProviderId, BYOKSettings, PROVIDER_PRESETS, TestKeyResult } from '@shared/types';
import { DEFAULT_SYSTEM_PROMPT, DIRECTOR_GUIDE_MARKDOWN } from '@shared/systemPrompt';

interface SettingsModalProps {
  initialTab: 'providers' | 'prompt' | 'guide';
  settings: BYOKSettings;
  onSave: (updated: BYOKSettings) => Promise<void>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  initialTab,
  settings,
  onSave,
  onClose,
}) => {
  const [tab, setTab] = useState<'providers' | 'prompt' | 'guide'>(initialTab);
  const [draft, setDraft] = useState<BYOKSettings>(() => JSON.parse(JSON.stringify(settings)));
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestKeyResult | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedProvider = draft.activeProvider;
  const preset = PROVIDER_PRESETS.find((p) => p.id === selectedProvider)!;
  const entry = draft.providers[selectedProvider];

  const updateProviderField = (
    providerId: AIProviderId,
    field: 'apiKey' | 'model' | 'baseUrl',
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: {
          ...prev.providers[providerId],
          [field]: value,
        },
      },
    }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await window.cliphub.settings.testKey(draft, selectedProvider);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(3, 6, 14, 0.72)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        className="glass-panel-strong"
        style={{
          width: 'min(920px, 100%)',
          maxHeight: '88vh',
          borderRadius: 22,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.09)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={18} color="#38BDF8" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>ClipHub BYOK & Director Settings</span>
          </div>
          <button
            className="glass-btn"
            onClick={onClose}
            style={{ padding: 6, border: 'none', background: 'transparent' }}
          >
            <X size={17} color="#94A3B8" />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: '10px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            gap: 8,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {[
            { id: 'providers', label: 'BYOK Providers & Keys', icon: KeyRound },
            { id: 'prompt', label: 'System Prompt & Rules', icon: Sparkles },
            { id: 'guide', label: 'Instructions & Guide', icon: BookOpen },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as 'providers' | 'prompt' | 'guide')}
                className="glass-btn"
                style={{
                  borderColor: active ? 'rgba(56, 189, 248, 0.45)' : 'transparent',
                  background: active ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                  color: active ? '#BAE6FD' : '#94A3B8',
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          {tab === 'providers' && (
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 20 }}>
              {/* Provider List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>
                  ACTIVE AI PROVIDER
                </div>
                {PROVIDER_PRESETS.map((p) => {
                  const isActive = draft.activeProvider === p.id;
                  const configured = Boolean(draft.providers[p.id]?.apiKey?.trim());
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, activeProvider: p.id }));
                        setTestResult(null);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '11px 13px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        border: isActive
                          ? '1px solid rgba(56, 189, 248, 0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)',
                        color: '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</span>
                        {configured && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: '#34D399',
                            }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                        {draft.providers[p.id]?.model || p.defaultModel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Provider Detail Form */}
              <div
                className="glass-panel"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{preset.label}</div>
                  <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>{preset.description}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#CBD5E1' }}>
                    API Key {selectedProvider === 'custom' ? '(optional for local Ollama/vLLM)' : ''}
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="glass-input"
                      type={showKey ? 'text' : 'password'}
                      value={entry.apiKey}
                      onChange={(e) => updateProviderField(selectedProvider, 'apiKey', e.target.value)}
                      placeholder={preset.keyPlaceholder}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                    <button
                      className="glass-btn"
                      onClick={() => setShowKey((s) => !s)}
                      title={showKey ? 'Hide key' : 'Reveal key'}
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11.5,
                      color: '#64748B',
                    }}
                  >
                    <ShieldCheck size={13} color="#34D399" />
                    <span>Stored locally on your machine using Electron OS-level encryption (`safeStorage`).</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#CBD5E1' }}>
                    Model ID
                  </label>
                  <input
                    className="glass-input"
                    value={entry.model}
                    onChange={(e) => updateProviderField(selectedProvider, 'model', e.target.value)}
                    placeholder={preset.defaultModel}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {preset.suggestedModels.map((m) => (
                      <button
                        key={m}
                        onClick={() => updateProviderField(selectedProvider, 'model', m)}
                        style={{
                          padding: '3px 9px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          border:
                            entry.model === m
                              ? '1px solid rgba(56, 189, 248, 0.45)'
                              : '1px solid rgba(255,255,255,0.09)',
                          background: entry.model === m ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255,255,255,0.04)',
                          color: entry.model === m ? '#BAE6FD' : '#94A3B8',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#CBD5E1' }}>
                    Base URL
                  </label>
                  <input
                    className="glass-input"
                    value={entry.baseUrl ?? ''}
                    onChange={(e) => updateProviderField(selectedProvider, 'baseUrl', e.target.value)}
                    placeholder={preset.baseUrl}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <button className="glass-btn" onClick={handleTest} disabled={testing}>
                    {testing ? <Loader2 size={14} className="animate-spin-slow" /> : <Sparkles size={14} />}
                    <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  {testResult && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: testResult.ok ? '#6EE7B7' : '#FDA4AF',
                      }}
                    >
                      {testResult.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'prompt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Automatic TSX Compile Repair</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>
                    If the model outputs a syntax or import error, automatically ask it to fix the TSX up to 2 times.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.autoRepairOnError}
                  onChange={(e) => setDraft((prev) => ({ ...prev, autoRepairOnError: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#38BDF8', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                  Custom Brand & Style Instructions (Appended to System Prompt)
                </label>
                <textarea
                  className="glass-textarea"
                  rows={4}
                  value={draft.customInstructions}
                  onChange={(e) => setDraft((prev) => ({ ...prev, customInstructions: e.target.value }))}
                  placeholder="Optional: e.g., Always use our brand palette (#0F172A, #22D3EE), bold geometric sans-serif, and include 'acme.ai' on the endcard."
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600 }}>
                    Core Motion Director System Prompt
                  </label>
                  <button
                    className="glass-btn"
                    onClick={() => setDraft((prev) => ({ ...prev, systemPromptOverride: '' }))}
                    style={{ padding: '4px 10px', fontSize: 11.5 }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset to Built-in Default</span>
                  </button>
                </div>
                <textarea
                  className="glass-textarea"
                  rows={14}
                  value={draft.systemPromptOverride || DEFAULT_SYSTEM_PROMPT}
                  onChange={(e) => setDraft((prev) => ({ ...prev, systemPromptOverride: e.target.value }))}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.5 }}
                />
              </div>
            </div>
          )}

          {tab === 'guide' && (
            <div
              className="selectable"
              style={{
                padding: 18,
                borderRadius: 14,
                background: 'rgba(6, 10, 20, 0.65)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 13,
                lineHeight: 1.65,
                color: '#CBD5E1',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {DIRECTOR_GUIDE_MARKDOWN}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button className="glass-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="glass-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
