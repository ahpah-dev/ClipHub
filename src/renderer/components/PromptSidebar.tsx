import React from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { ChatTurn, GenerateVideoRequest } from '@shared/types';

interface PromptSidebarProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  mode: GenerateVideoRequest['mode'];
  onModeChange: (m: GenerateVideoRequest['mode']) => void;
  aspectRatio: GenerateVideoRequest['aspectRatio'];
  onAspectRatioChange: (a: GenerateVideoRequest['aspectRatio']) => void;
  durationSec: number;
  onDurationSecChange: (d: number) => void;
  fps: number;
  onFpsChange: (f: number) => void;
  isGenerating: boolean;
  hasApiKey: boolean;
  chatHistory: ChatTurn[];
  onGenerate: () => void;
  onOpenSettings: () => void;
}

const SAMPLE_PROMPTS = [
  'Launch film for a quantum cloud database: dark glass UI cards, animated latency drop from 340ms to 9ms, and crisp CTA finale.',
  'Minimalist kinetic typography reel explaining "Why Local-First AI Matters" with 3 bold stats and emerald accents.',
  'Vertical 9:16 tech recap showcasing 3 product updates with animated progress rings and glowing feature badges.',
];

export const PromptSidebar: React.FC<PromptSidebarProps> = ({
  prompt,
  onPromptChange,
  mode,
  onModeChange,
  aspectRatio,
  onAspectRatioChange,
  durationSec,
  onDurationSecChange,
  fps,
  onFpsChange,
  isGenerating,
  hasApiKey,
  chatHistory,
  onGenerate,
  onOpenSettings,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isGenerating && prompt.trim()) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <aside
      className="glass-panel"
      style={{
        width: 372,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#38BDF8" />
          <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' }}>AI Motion Director</span>
        </div>

        {/* Create vs Refine Switch */}
        <div
          style={{
            display: 'flex',
            padding: 3,
            borderRadius: 9,
            background: 'rgba(6, 10, 20, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {(['create', 'refine'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              style={{
                border: 'none',
                borderRadius: 7,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                background: mode === m ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: mode === m ? '#7DD3FC' : '#94A3B8',
              }}
            >
              {m === 'create' ? 'New Video' : 'Refine'}
            </button>
          ))}
        </div>
      </div>

      {/* Video Specs Bar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>Canvas</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {(['16:9', '9:16', '1:1'] as const).map((ar) => (
              <button
                key={ar}
                onClick={() => onAspectRatioChange(ar)}
                style={{
                  padding: '4px 9px',
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border:
                    aspectRatio === ar
                      ? '1px solid rgba(56, 189, 248, 0.45)'
                      : '1px solid rgba(255,255,255,0.08)',
                  background: aspectRatio === ar ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255,255,255,0.03)',
                  color: aspectRatio === ar ? '#BAE6FD' : '#94A3B8',
                }}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>Duration & FPS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[6, 9, 12, 15].map((sec) => (
              <button
                key={sec}
                onClick={() => onDurationSecChange(sec)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border:
                    durationSec === sec
                      ? '1px solid rgba(129, 140, 248, 0.45)'
                      : '1px solid rgba(255,255,255,0.08)',
                  background: durationSec === sec ? 'rgba(129, 140, 248, 0.16)' : 'rgba(255,255,255,0.03)',
                  color: durationSec === sec ? '#C7D2FE' : '#94A3B8',
                }}
              >
                {sec}s
              </button>
            ))}
            <button
              onClick={() => onFpsChange(fps === 30 ? 60 : 30)}
              style={{
                padding: '4px 8px',
                borderRadius: 7,
                fontSize: 11.5,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: '#CBD5E1',
              }}
              title="Toggle 30 / 60 FPS"
            >
              {fps}fps
            </button>
          </div>
        </div>
      </div>

      {/* Conversation / Generation Log */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {!hasApiKey && (
          <div
            style={{
              padding: '11px 13px',
              borderRadius: 12,
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.28)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#FDE68A' }}>
              <AlertTriangle size={14} />
              <span>Add a BYOK key to generate with AI</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1', lineHeight: 1.45 }}>
              You can preview and natively render the built-in templates right now, or add an OpenAI, Anthropic, Gemini, or OpenRouter key.
            </p>
            <button className="glass-btn" onClick={onOpenSettings} style={{ alignSelf: 'flex-start', fontSize: 12 }}>
              Open BYOK Settings
            </button>
          </div>
        )}

        {chatHistory.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick Director Prompts
            </div>
            {SAMPLE_PROMPTS.map((sample, i) => (
              <button
                key={i}
                onClick={() => onPromptChange(sample)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 11,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#CBD5E1',
                  fontSize: 12,
                  lineHeight: 1.45,
                  cursor: 'pointer',
                }}
              >
                <Wand2 size={12} color="#38BDF8" style={{ marginRight: 6, verticalAlign: '-1px' }} />
                {sample}
              </button>
            ))}
          </div>
        ) : (
          chatHistory.map((turn) => (
            <div
              key={turn.id}
              className="selectable"
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: turn.error
                  ? '1px solid rgba(251, 113, 133, 0.35)'
                  : turn.role === 'user'
                  ? '1px solid rgba(56, 189, 248, 0.24)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                background: turn.error
                  ? 'rgba(251, 113, 133, 0.08)'
                  : turn.role === 'user'
                  ? 'rgba(56, 189, 248, 0.09)'
                  : 'rgba(255, 255, 255, 0.035)',
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, color: '#94A3B8' }}>
                {turn.role === 'user' ? (
                  <span style={{ color: '#7DD3FC', fontWeight: 600 }}>You</span>
                ) : turn.error ? (
                  <span style={{ color: '#FDA4AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} /> Error
                  </span>
                ) : (
                  <span style={{ color: '#6EE7B7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Bot size={12} /> ClipHub Director
                  </span>
                )}
              </div>
              <div style={{ color: turn.error ? '#FECDD3' : '#E2E8F0', whiteSpace: 'pre-wrap' }}>
                {turn.error || turn.content}
              </div>
              {turn.meta && (
                <div
                  style={{
                    marginTop: 7,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: '#6EE7B7',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(52, 211, 153, 0.12)',
                  }}
                >
                  <CheckCircle2 size={11} />
                  {turn.meta.width}×{turn.meta.height} · {(turn.meta.durationInFrames / turn.meta.fps).toFixed(1)}s
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Prompt Input Footer */}
      <div
        style={{
          padding: 14,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(6, 10, 20, 0.48)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <textarea
          className="glass-textarea"
          rows={4}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'create'
              ? 'Describe the video you want (scenes, style, copy, numbers, colors)...'
              : 'Describe how to refine the current video (e.g. "Add a kinetic pricing card scene, change accent to emerald")...'
          }
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>Ctrl+Enter to run</span>
          <button
            className="glass-btn-primary"
            disabled={isGenerating || !prompt.trim()}
            onClick={onGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin-slow" />
                <span>Directing Video...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>{mode === 'create' ? 'Generate Video' : 'Apply Refinement'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
