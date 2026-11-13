import { VideoProject } from './types';

export const STARTER_PROJECTS: VideoProject[] = [
  {
    id: 'starter-launch',
    updatedAt: Date.now(),
    lastPrompt: 'Create a sleek 10-second glassmorphic product launch showcase for ClipHub AI Motion Studio with metrics and a finale.',
    meta: {
      title: 'ClipHub Studio Launch',
      summary: '3-scene glassmorphic product reveal with kinetic typography, live telemetry chart, and crisp finale.',
      durationInFrames: 270,
      fps: 30,
      width: 1920,
      height: 1080,
    },
    code: `import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { Cpu, Film, Sparkles, TrendingUp, Zap } from 'lucide-react';

export const videoConfig = {
  title: 'ClipHub Studio Launch',
  summary: '3-scene glassmorphic product reveal with kinetic typography, live telemetry chart, and crisp finale.',
  durationInFrames: 270,
  fps: 30,
  width: 1920,
  height: 1080,
};

const FONT_SANS = "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

const AmbientBackdrop: React.FC<{ accent?: string }> = ({ accent = '#38BDF8' }) => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 42) * 55;
  const driftY = Math.cos(frame / 54) * 35;
  const gridOffset = (frame * 0.45) % 64;

  const particles = React.useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: random(\`px-\${i}\`) * 100,
        y: random(\`py-\${i}\`) * 100,
        size: 2 + random(\`ps-\${i}\`) * 3.5,
        speed: 0.35 + random(\`pv-\${i}\`) * 0.7,
        alpha: 0.14 + random(\`pa-\${i}\`) * 0.3,
      })),
    []
  );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(120% 100% at 50% 0%, #101A33 0%, #070B14 55%, #04060C 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Subtle drifting architectural grid */}
      <div
        style={{
          position: 'absolute',
          inset: -64,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          transform: \`translate(\${gridOffset * 0.5}px, \${gridOffset}px)\`,
          maskImage: 'radial-gradient(ellipse 78% 72% at 50% 50%, black 20%, transparent 100%)',
        }}
      />

      {/* Ambient gradient orbs */}
      <div
        style={{
          position: 'absolute',
          width: 820,
          height: 820,
          borderRadius: '50%',
          left: 160 + driftX,
          top: -220 + driftY,
          background: \`radial-gradient(circle, \${accent}33 0%, transparent 68%)\`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 740,
          height: 740,
          borderRadius: '50%',
          right: 80 - driftX * 0.7,
          bottom: -240 - driftY * 0.7,
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.28) 0%, transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* Deterministic floating particles */}
      {particles.map((p, idx) => {
        const yPos = (p.y - frame * p.speed * 0.08 + 120) % 110;
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: \`\${p.x}%\`,
              top: \`\${yPos}%\`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: idx % 3 === 0 ? '#7DD3FC' : '#E2E8F0',
              opacity: p.alpha,
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.45)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const SceneHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const words = ['Prompt', 'to', 'Cinema.'];
  const subOpacity = interpolate(frame, [26, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subY = interpolate(frame, [26, 44], [22, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cameraScale = interpolate(frame, [0, 100], [1, 1.035], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ringRotate = frame * 0.6;

  return (
    <AbsoluteFill style={{ fontFamily: FONT_SANS, color: '#F8FAFC' }}>
      <AmbientBackdrop accent="#38BDF8" />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 96,
          transform: \`scale(\${cameraScale})\`,
        }}
      >
        {/* Subtle orbital halo behind hero */}
        <div
          style={{
            position: 'absolute',
            width: 620,
            height: 620,
            borderRadius: '50%',
            border: '1px solid rgba(56, 189, 248, 0.16)',
            transform: \`rotate(\${ringRotate}deg)\`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -5,
              left: '50%',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#38BDF8',
              boxShadow: '0 0 24px #38BDF8',
            }}
          />
        </div>

        {/* Glass Pill Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 22px',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(20px)',
            marginBottom: 34,
            opacity: badgeSpring,
            transform: \`translateY(\${(1 - badgeSpring) * 18}px) scale(\${0.92 + badgeSpring * 0.08})\`,
          }}
        >
          <Sparkles size={18} color="#38BDF8" />
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 16,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#BAE6FD',
              fontWeight: 600,
            }}
          >
            BYOK Remotion Studio
          </span>
        </div>

        {/* Staggered Kinetic Headline */}
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
          {words.map((word, idx) => {
            const wordSpring = spring({
              frame: Math.max(0, frame - (6 + idx * 7)),
              fps,
              config: { damping: 14, stiffness: 130, mass: 0.85 },
            });
            const isAccent = idx === 2;
            return (
              <div key={word} style={{ overflow: 'hidden', paddingBottom: 8 }}>
                <div
                  style={{
                    fontSize: 124,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.02,
                    transform: \`translateY(\${(1 - wordSpring) * 120}px)\`,
                    opacity: wordSpring,
                    background: isAccent
                      ? 'linear-gradient(135deg, #38BDF8 0%, #818CF8 55%, #C084FC 100%)'
                      : 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {word}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtitle */}
        <p
          style={{
            marginTop: 26,
            fontSize: 30,
            fontWeight: 400,
            color: '#94A3B8',
            maxWidth: 880,
            textAlign: 'center',
            lineHeight: 1.45,
            opacity: subOpacity,
            transform: \`translateY(\${subY}px)\`,
          }}
        >
          Generate deterministic React motion graphics with your own AI key and render crisp MP4s natively.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SceneTelemetry: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const chartProgress = interpolate(frame, [14, 68], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fpsCounter = Math.round(interpolate(chartProgress, [0, 1], [12, 60]));
  const speedCounter = interpolate(chartProgress, [0, 1], [1.0, 14.8]).toFixed(1);

  const pathLength = 760;
  const dashOffset = pathLength * (1 - chartProgress);

  const features = [
    { icon: Cpu, label: 'Multi-Provider BYOK', value: 'OpenAI · Claude · Gemini' },
    { icon: Zap, label: 'Instant Preview', value: 'Live esbuild TSX Engine' },
    { icon: Film, label: 'Native Export', value: 'H.264 / H.265 MP4' },
  ];

  return (
    <AbsoluteFill style={{ fontFamily: FONT_SANS, color: '#F8FAFC' }}>
      <AmbientBackdrop accent="#818CF8" />
      <AbsoluteFill
        style={{
          padding: '88px 104px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 54,
        }}
      >
        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 16,
              color: '#38BDF8',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              opacity: cardSpring,
            }}
          >
            Engineered Motion Pipeline
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              opacity: cardSpring,
              transform: \`translateY(\${(1 - cardSpring) * 24}px)\`,
            }}
          >
            Real React code.
            <br />
            Zero guesswork.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            {features.map((item, idx) => {
              const Icon = item.icon;
              const s = spring({
                frame: Math.max(0, frame - (10 + idx * 7)),
                fps,
                config: { damping: 14, stiffness: 130 },
              });
              return (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: '18px 22px',
                    borderRadius: 20,
                    background: 'rgba(255, 255, 255, 0.045)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    opacity: s,
                    transform: \`translateX(\${(1 - s) * -32}px)\`,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(129,140,248,0.22))',
                      border: '1px solid rgba(125,211,252,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} color="#7DD3FC" />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 16, color: '#94A3B8', marginTop: 2 }}>{item.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Glass Telemetry Card */}
        <div
          style={{
            flex: 1.15,
            padding: 40,
            borderRadius: 32,
            background: 'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 32px 90px rgba(0, 0, 0, 0.55)',
            transform: \`translateY(\${(1 - cardSpring) * 40}px) scale(\${0.95 + cardSpring * 0.05})\`,
            opacity: cardSpring,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TrendingUp size={24} color="#34D399" />
              <span style={{ fontSize: 22, fontWeight: 700 }}>Render Throughput</span>
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 15,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(52, 211, 153, 0.14)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#6EE7B7',
              }}
            >
              ACTIVE · 1080P
            </div>
          </div>

          <div style={{ display: 'flex', gap: 36, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 15, color: '#94A3B8' }}>Iteration Speed</div>
              <div
                style={{
                  fontSize: 54,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.03em',
                }}
              >
                {speedCounter}x
              </div>
            </div>
            <div>
              <div style={{ fontSize: 15, color: '#94A3B8' }}>Preview Frame Rate</div>
              <div
                style={{
                  fontSize: 54,
                  fontWeight: 800,
                  color: '#38BDF8',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.03em',
                }}
              >
                {fpsCounter} fps
              </div>
            </div>
          </div>

          {/* Animated SVG Curve */}
          <svg width="100%" height="220" viewBox="0 0 640 220" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 10 185 C 120 175, 170 120, 260 128 C 350 136, 410 58, 510 50 C 560 46, 600 26, 630 18 L 630 210 L 10 210 Z"
              fill="url(#areaGrad)"
              opacity={chartProgress}
            />
            <path
              d="M 10 185 C 120 175, 170 120, 260 128 C 350 136, 410 58, 510 50 C 560 46, 600 26, 630 18"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
            />
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SceneFinale: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const textOpacity = interpolate(frame, [14, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweep = interpolate(frame, [20, 75], [-300, 1100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT_SANS, color: '#F8FAFC' }}>
      <AmbientBackdrop accent="#6366F1" />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '56px 86px',
            borderRadius: 40,
            background: 'rgba(255, 255, 255, 0.055)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            transform: \`scale(\${0.9 + logoScale * 0.1})\`,
            opacity: logoScale,
          }}
        >
          {/* Specular light sweep */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              left: sweep,
              width: 180,
              height: 440,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
              transform: 'rotate(22deg)',
            }}
          />

          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #BAE6FD 50%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ClipHub
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#CBD5E1',
              opacity: textOpacity,
              letterSpacing: '-0.01em',
            }}
          >
            Describe it. Preview it. Render native MP4.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const GeneratedVideo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={100}>
        <SceneHero />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={linearTiming({ durationInFrames: 18 })}
      />
      <TransitionSeries.Sequence durationInFrames={112}>
        <SceneTelemetry />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 18 })}
      />
      <TransitionSeries.Sequence durationInFrames={94}>
        <SceneFinale />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
`,
  },
  {
    id: 'starter-vertical-reel',
    updatedAt: Date.now(),
    lastPrompt: 'Make a 9:16 vertical reel showcasing 3 AI workflow milestones with bold kinetic numbers.',
    meta: {
      title: 'Vertical Pulse Metrics',
      summary: '9:16 portrait motion reel with stacked kinetic milestone cards and glowing progress bar.',
      durationInFrames: 180,
      fps: 30,
      width: 1080,
      height: 1920,
    },
    code: `import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CheckCircle2, Layers, Sparkles } from 'lucide-react';

export const videoConfig = {
  title: 'Vertical Pulse Metrics',
  summary: '9:16 portrait motion reel with stacked kinetic milestone cards and glowing progress bar.',
  durationInFrames: 180,
  fps: 30,
  width: 1080,
  height: 1920,
};

const FONT = "'Inter', 'SF Pro Display', system-ui, sans-serif";

export const GeneratedVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const headerSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const progress = interpolate(frame, [10, durationInFrames - 20], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cards = [
    { stat: '4.2s', label: 'Concept to TSX Composition', accent: '#38BDF8', delay: 16 },
    { stat: '60fps', label: 'Deterministic Frame Scrubbing', accent: '#818CF8', delay: 32 },
    { stat: 'H.264', label: 'Native Studio MP4 Export', accent: '#34D399', delay: 48 },
  ];

  const glowShift = Math.sin(frame / 28) * 40;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        color: '#F8FAFC',
        background: 'linear-gradient(170deg, #091022 0%, #050811 55%, #090D1C 100%)',
        padding: '130px 72px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 720,
          height: 720,
          borderRadius: '50%',
          top: -120 + glowShift,
          left: -140,
          background: 'radial-gradient(circle, rgba(56,189,248,0.28), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            opacity: headerSpring,
            transform: \`translateY(\${(1 - headerSpring) * 20}px)\`,
          }}
        >
          <Sparkles size={22} color="#38BDF8" />
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.06em', color: '#BAE6FD' }}>
            CLIPHUB SHORTS
          </span>
        </div>

        <h1
          style={{
            marginTop: 36,
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.03,
            letterSpacing: '-0.04em',
            opacity: headerSpring,
            transform: \`translateY(\${(1 - headerSpring) * 32}px)\`,
          }}
        >
          Ship motion
          <br />
          <span style={{ color: '#38BDF8' }}>at thought speed.</span>
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {cards.map((c) => {
          const s = spring({
            frame: Math.max(0, frame - c.delay),
            fps,
            config: { damping: 14, stiffness: 125 },
          });
          return (
            <div
              key={c.label}
              style={{
                padding: '38px 40px',
                borderRadius: 32,
                background: 'rgba(255,255,255,0.055)',
                border: '1px solid rgba(255,255,255,0.13)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: s,
                transform: \`translateY(\${(1 - s) * 44}px) scale(\${0.94 + s * 0.06})\`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: c.accent,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.stat}
                </div>
                <div style={{ fontSize: 28, color: '#CBD5E1', marginTop: 6 }}>{c.label}</div>
              </div>
              <CheckCircle2 size={44} color={c.accent} />
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: 30,
          borderRadius: 26,
          background: 'rgba(255,255,255,0.045)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 24 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#E2E8F0', fontWeight: 600 }}>
            <Layers size={24} color="#818CF8" /> Native Pipeline Progress
          </span>
          <span style={{ fontWeight: 700, color: '#38BDF8', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div style={{ height: 14, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: \`\${progress * 100}%\`,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #38BDF8, #818CF8, #34D399)',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
`,
  },
];
