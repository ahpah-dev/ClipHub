import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { ChatTurn, GenerateVideoRequest, PromptAttachment } from '@shared/types';

interface PromptSidebarProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  attachments: PromptAttachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
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
  attachments,
  onAddFiles,
  onRemoveAttachment,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isGenerating && (prompt.trim() || attachments.length > 0)) {
      e.preventDefault();
      onGenerate();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.files;
    if (items && items.length > 0) {
      e.preventDefault();
      onAddFiles(items);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  return (
    <aside
      className="glass-panel"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
      style={{
        width: 372,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        borderColor: isDragging ? 'rgba(56, 189, 248, 0.55)' : undefined,
      }}
    >
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            background: 'rgba(8, 14, 30, 0.84)',
            backdropFilter: 'blur(8px)',
            border: '2px dashed rgba(56, 189, 248, 0.65)',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          <Paperclip size={26} color="#38BDF8" />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#BAE6FD' }}>Drop images or files</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>PNG, JPG, WebP, SVG, JSON, CSV, Markdown, TXT</div>
        </div>
      )}

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

              {turn.attachments && turn.attachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {turn.attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 7px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: 11,
                        color: '#CBD5E1',
                      }}
                    >
                      {att.kind === 'image' && att.dataUrl ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }}
                        />
                      ) : (
                        <FileText size={12} color="#7DD3FC" />
                      )}
                      <span>{att.name}</span>
                    </div>
                  ))}
                </div>
              )}

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
          gap: 9,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.svg,.txt,.md,.json,.csv,.ts,.tsx,.js,.css,.html,.xml"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {attachments.map((att) => (
              <div
                key={att.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 9,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  fontSize: 11.5,
                  color: '#E2E8F0',
                  maxWidth: '100%',
                }}
              >
                {att.kind === 'image' && att.dataUrl ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <FileText size={13} color="#7DD3FC" style={{ flexShrink: 0 }} />
                )}
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 150,
                  }}
                  title={`${att.name} (${att.id})`}
                >
                  {att.name}
                </span>
                <button
                  onClick={() => onRemoveAttachment(att.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          className="glass-textarea"
          rows={4}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            mode === 'create'
              ? 'Describe your video, or drop/paste images, logos, screenshots, or data files...'
              : 'Describe refinements, or attach new images/files to include...'
          }
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="glass-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              style={{ padding: '6px 10px', fontSize: 12 }}
              title="Attach images (PNG/JPG/WebP/SVG) or text/JSON/CSV files (or drag & paste)"
            >
              <Paperclip size={13} color="#7DD3FC" />
              <span>Attach</span>
            </button>
            <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>Ctrl+Enter</span>
          </div>

          <button
            className="glass-btn-primary"
            disabled={isGenerating || (!prompt.trim() && attachments.length === 0)}
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
