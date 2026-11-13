import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Film,
  FolderOpen,
  Loader2,
  Play,
  X,
  XCircle,
} from 'lucide-react';
import { RenderProgressEvent, VideoProject } from '@shared/types';

interface RenderModalProps {
  project: VideoProject;
  renderState: RenderProgressEvent | null;
  isRendering: boolean;
  onStartRender: (opts: { outputPath: string; codec: 'h264' | 'h265'; crf: number }) => Promise<void>;
  onCancelRender: () => Promise<void>;
  onClose: () => void;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  project,
  renderState,
  isRendering,
  onStartRender,
  onCancelRender,
  onClose,
}) => {
  const [codec, setCodec] = useState<'h264' | 'h265'>('h264');
  const [crf, setCrf] = useState<number>(18);
  const [outputPath, setOutputPath] = useState<string>('');

  useEffect(() => {
    window.cliphub.render.getDefaultOutputPath(project.meta.title).then(setOutputPath);
  }, [project.meta.title]);

  const handleBrowse = async () => {
    const chosen = await window.cliphub.render.chooseOutputPath(project.meta.title);
    if (chosen) setOutputPath(chosen);
  };

  const handleStart = async () => {
    await onStartRender({ outputPath, codec, crf });
  };

  const donePath = renderState?.stage === 'done' ? renderState.outputPath || outputPath : null;

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
          width: 'min(580px, 100%)',
          borderRadius: 22,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
            <Film size={18} color="#38BDF8" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Native Remotion MP4 Render</span>
          </div>
          <button
            className="glass-btn"
            onClick={onClose}
            style={{ padding: 6, border: 'none', background: 'transparent' }}
          >
            <X size={17} color="#94A3B8" />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{project.meta.title}</div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                {project.meta.width}×{project.meta.height} · {project.meta.fps} fps · {project.meta.durationInFrames} frames
              </div>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                color: '#7DD3FC',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(56, 189, 248, 0.14)',
              }}
            >
              MP4 ({codec.toUpperCase()})
            </span>
          </div>

          {/* Output Path */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#CBD5E1' }}>
              Output File
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="glass-input"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                disabled={isRendering}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              />
              <button className="glass-btn" onClick={handleBrowse} disabled={isRendering}>
                Browse
              </button>
            </div>
          </div>

          {/* Codec & Quality */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#CBD5E1' }}>
                Video Codec
              </label>
              <select
                className="glass-select"
                value={codec}
                onChange={(e) => setCodec(e.target.value as 'h264' | 'h265')}
                disabled={isRendering}
              >
                <option value="h264" style={{ background: '#0B1120' }}>
                  H.264 (Universal MP4)
                </option>
                <option value="h265" style={{ background: '#0B1120' }}>
                  H.265 / HEVC (Compact)
                </option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#CBD5E1' }}>
                Quality (CRF {crf} — {crf <= 16 ? 'Master' : crf <= 20 ? 'High' : 'Balanced'})
              </label>
              <input
                type="range"
                min={12}
                max={28}
                value={crf}
                onChange={(e) => setCrf(Number(e.target.value))}
                disabled={isRendering}
                style={{ width: '100%', accentColor: '#38BDF8', marginTop: 8 }}
              />
            </div>
          </div>

          {/* Progress Area */}
          {renderState && (
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: 'rgba(6, 10, 20, 0.72)',
                border:
                  renderState.stage === 'error'
                    ? '1px solid rgba(251, 113, 133, 0.35)'
                    : renderState.stage === 'done'
                    ? '1px solid rgba(52, 211, 153, 0.35)'
                    : '1px solid rgba(56, 189, 248, 0.28)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {renderState.stage === 'done' ? (
                    <CheckCircle2 size={16} color="#34D399" />
                  ) : renderState.stage === 'error' || renderState.stage === 'cancelled' ? (
                    <XCircle size={16} color="#FB7185" />
                  ) : (
                    <Loader2 size={16} color="#38BDF8" className="animate-spin-slow" />
                  )}
                  <span style={{ fontWeight: 600 }}>{renderState.message}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#7DD3FC' }}>{renderState.progress}%</span>
              </div>

              <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${renderState.progress}%`,
                    borderRadius: 999,
                    background:
                      renderState.stage === 'error'
                        ? '#FB7185'
                        : renderState.stage === 'done'
                        ? '#34D399'
                        : 'linear-gradient(90deg, #38BDF8, #818CF8)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>

              {donePath && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    className="glass-btn-primary"
                    onClick={() => window.cliphub.render.openFile(donePath)}
                    style={{ fontSize: 12 }}
                  >
                    <Play size={13} />
                    <span>Open MP4</span>
                  </button>
                  <button
                    className="glass-btn"
                    onClick={() => window.cliphub.render.revealInFolder(donePath)}
                    style={{ fontSize: 12 }}
                  >
                    <FolderOpen size={13} />
                    <span>Show in Explorer</span>
                  </button>
                </div>
              )}
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
          {isRendering ? (
            <button className="glass-btn" onClick={onCancelRender} style={{ color: '#FDA4AF' }}>
              Cancel Render
            </button>
          ) : (
            <>
              <button className="glass-btn" onClick={onClose}>
                Close
              </button>
              <button className="glass-btn-primary" onClick={handleStart} disabled={!outputPath.trim()}>
                <Film size={14} />
                <span>Start Native MP4 Render</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
