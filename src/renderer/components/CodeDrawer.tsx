import React, { useEffect, useState } from 'react';
import { Check, Code2, Copy, Play, X } from 'lucide-react';

interface CodeDrawerProps {
  code: string;
  onApplyCode: (newCode: string) => Promise<void>;
  onClose: () => void;
}

export const CodeDrawer: React.FC<CodeDrawerProps> = ({ code, onApplyCode, onClose }) => {
  const [draft, setDraft] = useState(code);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setDraft(code);
  }, [code]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApplyCode(draft);
    } finally {
      setApplying(false);
    }
  };

  const isDirty = draft !== code;

  return (
    <aside
      className="glass-panel"
      style={{
        width: 440,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '13px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 size={16} color="#38BDF8" />
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>Composition.tsx</span>
          {isDirty && (
            <span
              style={{
                fontSize: 10.5,
                fontFamily: 'var(--font-mono)',
                color: '#FBBF24',
                padding: '1px 7px',
                borderRadius: 999,
                background: 'rgba(251, 191, 36, 0.14)',
              }}
            >
              MODIFIED
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="glass-btn" onClick={handleCopy} style={{ padding: '5px 9px', fontSize: 11.5 }}>
            {copied ? <Check size={13} color="#34D399" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            className="glass-btn-primary"
            onClick={handleApply}
            disabled={applying || !isDirty}
            style={{ padding: '5px 10px', fontSize: 11.5 }}
          >
            <Play size={12} />
            <span>{applying ? 'Compiling...' : 'Apply'}</span>
          </button>
          <button
            className="glass-btn"
            onClick={onClose}
            style={{ padding: 5, border: 'none', background: 'transparent' }}
          >
            <X size={15} color="#94A3B8" />
          </button>
        </div>
      </div>

      <textarea
        className="selectable"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          outline: 'none',
          padding: 14,
          background: 'rgba(4, 7, 15, 0.72)',
          color: '#E2E8F0',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.55,
          resize: 'none',
        }}
      />
    </aside>
  );
};
