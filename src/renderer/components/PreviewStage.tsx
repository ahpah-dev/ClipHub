import React, { useEffect, useRef, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Grid,
  Loader2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { VideoCompositionMeta } from '@shared/types';

interface ErrorBoundaryProps {
  resetKey: string;
  onAutoFix?: (errorMsg: string) => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class PreviewErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="glass-panel"
          style={{
            maxWidth: 520,
            padding: 24,
            borderRadius: 18,
            borderColor: 'rgba(251, 113, 133, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#FDA4AF', fontWeight: 700 }}>
            <AlertOctagon size={18} />
            <span>Runtime Render Error in Composition</span>
          </div>
          <pre
            className="selectable"
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 10,
              background: 'rgba(0,0,0,0.4)',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: '#FECDD3',
              whiteSpace: 'pre-wrap',
              maxHeight: 160,
              overflowY: 'auto',
            }}
          >
            {this.state.error.message}
          </pre>
          {this.props.onAutoFix && (
            <button
              className="glass-btn-primary"
              onClick={() => this.props.onAutoFix?.(this.state.error?.message ?? 'Runtime error')}
              style={{ alignSelf: 'flex-start' }}
            >
              <Wrench size={14} />
              <span>Ask AI to Fix Error</span>
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

interface PreviewStageProps {
  component: React.FC | null;
  meta: VideoCompositionMeta;
  compileError: string | null;
  isGenerating: boolean;
  codeHash: string;
  onAutoFixRuntimeError: (errMsg: string) => void;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  component,
  meta,
  compileError,
  isGenerating,
  codeHash,
  onAutoFixRuntimeError,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loop, setLoop] = useState(true);
  const [showSafeGrid, setShowSafeGrid] = useState(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('ended', onEnded);

    return () => {
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('ended', onEnded);
    };
  }, [component, codeHash]);

  useEffect(() => {
    setCurrentFrame(0);
    setIsPlaying(false);
  }, [codeHash]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.pause();
    else player.play();
  };

  const seekTo = (frame: number) => {
    const clamped = Math.max(0, Math.min(meta.durationInFrames - 1, frame));
    playerRef.current?.seekTo(clamped);
    setCurrentFrame(clamped);
  };

  const formatTime = (frame: number) => {
    const totalSec = frame / meta.fps;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const remFrames = frame % meta.fps;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(remFrames).padStart(2, '0')}`;
  };

  const isPortrait = meta.height > meta.width;
  const isSquare = meta.width === meta.height;

  return (
    <section
      className="glass-panel"
      style={{
        flex: 1,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* Stage Top Info Strip */}
      <div
        style={{
          padding: '11px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {meta.title}
          </div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {meta.summary}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              color: '#CBD5E1',
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.045)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {meta.width}×{meta.height} · {meta.fps}fps · {(meta.durationInFrames / meta.fps).toFixed(1)}s
          </span>

          <button
            className="glass-btn"
            onClick={() => setShowSafeGrid((v) => !v)}
            style={{
              padding: '5px 10px',
              borderColor: showSafeGrid ? 'rgba(56, 189, 248, 0.45)' : undefined,
              background: showSafeGrid ? 'rgba(56, 189, 248, 0.14)' : undefined,
            }}
            title="Toggle Safe Margin & Rule-of-Thirds Overlay"
          >
            <Grid size={13} />
            <span>Guides</span>
          </button>
        </div>
      </div>

      {/* Center Viewport */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.06), transparent 65%), rgba(3, 6, 14, 0.55)',
        }}
      >
        {isGenerating && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              background: 'rgba(6, 9, 19, 0.72)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(129,140,248,0.22))',
                border: '1px solid rgba(125,211,252,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={26} color="#38BDF8" className="animate-spin-slow" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Composing Remotion React Scene...</div>
            <div style={{ fontSize: 12.5, color: '#94A3B8' }}>
              Generating deterministic keyframes, springs, and verifying TSX build
            </div>
          </div>
        )}

        {compileError ? (
          <div
            className="glass-panel"
            style={{
              maxWidth: 560,
              padding: 24,
              borderRadius: 16,
              borderColor: 'rgba(251, 113, 133, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FDA4AF', fontWeight: 700 }}>
              <AlertOctagon size={18} />
              <span>TSX Compilation Error</span>
            </div>
            <pre
              className="selectable"
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 10,
                background: 'rgba(0,0,0,0.45)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: '#FECDD3',
                whiteSpace: 'pre-wrap',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {compileError}
            </pre>
            <button
              className="glass-btn-primary"
              onClick={() => onAutoFixRuntimeError(compileError)}
              style={{ alignSelf: 'flex-start' }}
            >
              <Sparkles size={14} />
              <span>Auto-Fix with AI</span>
            </button>
          </div>
        ) : component ? (
          <div
            style={{
              position: 'relative',
              width: isPortrait ? 'auto' : isSquare ? 'min(100%, 540px)' : '100%',
              height: isPortrait ? '100%' : 'auto',
              maxWidth: isPortrait ? '420px' : '960px',
              maxHeight: '100%',
              aspectRatio: `${meta.width} / ${meta.height}`,
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 28px 90px rgba(0, 0, 0, 0.65)',
              background: '#000',
            }}
          >
            <PreviewErrorBoundary resetKey={codeHash} onAutoFix={onAutoFixRuntimeError}>
              <Player
                ref={playerRef}
                key={codeHash}
                component={component}
                durationInFrames={meta.durationInFrames}
                fps={meta.fps}
                compositionWidth={meta.width}
                compositionHeight={meta.height}
                loop={loop}
                controls={false}
                clickToPlay
                acknowledgeRemotionLicense
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            </PreviewErrorBoundary>

            {showSafeGrid && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  border: '24px solid rgba(56, 189, 248, 0.08)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    border: '1px dashed rgba(56, 189, 248, 0.4)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gridTemplateRows: '1fr 1fr 1fr',
                  }}
                >
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Studio Transport & Scrub Bar */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(8, 12, 24, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <input
          type="range"
          min={0}
          max={Math.max(1, meta.durationInFrames - 1)}
          value={currentFrame}
          onChange={(e) => seekTo(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#38BDF8',
            cursor: 'pointer',
            height: 4,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="glass-btn" onClick={() => seekTo(0)} style={{ padding: '6px 8px' }} title="Jump to Start">
              <RotateCcw size={13} />
            </button>
            <button
              className="glass-btn"
              onClick={() => seekTo(currentFrame - 1)}
              style={{ padding: '6px 8px' }}
              title="Previous Frame"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="glass-btn-primary"
              onClick={togglePlay}
              style={{ padding: '6px 14px', minWidth: 88 }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              className="glass-btn"
              onClick={() => seekTo(currentFrame + 1)}
              style={{ padding: '6px 8px' }}
              title="Next Frame"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span>{formatTime(currentFrame)}</span>
            <span style={{ color: '#64748B' }}>|</span>
            <span>
              Frame {currentFrame} / {meta.durationInFrames}
            </span>
          </div>

          <button
            className="glass-btn"
            onClick={() => setLoop((v) => !v)}
            style={{
              padding: '6px 10px',
              borderColor: loop ? 'rgba(56, 189, 248, 0.4)' : undefined,
              color: loop ? '#7DD3FC' : '#94A3B8',
            }}
            title="Toggle Loop Playback"
          >
            <Repeat size={13} />
            <span>Loop</span>
          </button>
        </div>
      </div>
    </section>
  );
};
