import React from 'react';
import {
  BookOpen,
  Code2,
  Film,
  KeyRound,
  Minus,
  Plus,
  Square,
  X,
} from 'lucide-react';
import { BYOKSettings, PROVIDER_PRESETS, VideoProject } from '@shared/types';
import { ClipHubLogo } from './Logo';

interface TitleBarProps {
  projects: VideoProject[];
  activeProject: VideoProject;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  settings: BYOKSettings;
  showCode: boolean;
  onToggleCode: () => void;
  onOpenSettings: (tab?: 'providers' | 'prompt' | 'guide') => void;
  onOpenRender: () => void;
  isRendering: boolean;
  renderProgress: number;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  settings,
  showCode,
  onToggleCode,
  onOpenSettings,
  onOpenRender,
  isRendering,
  renderProgress,
}) => {
  const activePreset = PROVIDER_PRESETS.find((p) => p.id === settings.activeProvider);
  const activeEntry = settings.providers[settings.activeProvider];
  const hasKey = Boolean(activeEntry?.apiKey?.trim()) || settings.activeProvider === 'custom';

  return (
    <header
      className="drag-region"
      style={{
        height: 54,
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(8, 12, 24, 0.72)',
        backdropFilter: 'blur(24px)',
        flexShrink: 0,
      }}
    >
      {/* Left: Brand + Project Switcher */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <ClipHubLogo size={28} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>ClipHub</span>
            <span
              style={{
                fontSize: 10.5,
                fontFamily: 'var(--font-mono)',
                color: '#7DD3FC',
                padding: '1px 6px',
                borderRadius: 999,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              STUDIO
            </span>
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            className="glass-select"
            value={activeProject.id}
            onChange={(e) => onSelectProject(e.target.value)}
            style={{
              width: 210,
              padding: '5px 10px',
              fontSize: 12.5,
              fontWeight: 500,
              background: 'rgba(255,255,255,0.045)',
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#0B1120', color: '#F8FAFC' }}>
                {p.meta.title}
              </option>
            ))}
          </select>

          <button className="glass-btn" onClick={onNewProject} title="Create blank / new project" style={{ padding: '6px 9px' }}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Center/Right: Actions + Window Controls */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="glass-btn"
          onClick={() => onOpenSettings('providers')}
          title="Configure BYOK API Keys & Model"
          style={{
            borderColor: hasKey ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.35)',
            background: hasKey ? 'rgba(52, 211, 153, 0.08)' : 'rgba(251, 191, 36, 0.09)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: hasKey ? '#34D399' : '#FBBF24',
              boxShadow: hasKey ? '0 0 10px #34D399' : '0 0 10px #FBBF24',
            }}
          />
          <KeyRound size={13} />
          <span>
            {activePreset?.label}: {activeEntry?.model || activePreset?.defaultModel}
          </span>
        </button>

        <button
          className="glass-btn"
          onClick={() => onOpenSettings('prompt')}
          title="System Prompt & Director Guide"
        >
          <BookOpen size={14} color="#BAE6FD" />
          <span>System Prompt</span>
        </button>

        <button
          className="glass-btn"
          onClick={onToggleCode}
          style={{
            borderColor: showCode ? 'rgba(56, 189, 248, 0.45)' : undefined,
            background: showCode ? 'rgba(56, 189, 248, 0.14)' : undefined,
          }}
        >
          <Code2 size={14} color={showCode ? '#38BDF8' : '#CBD5E1'} />
          <span>TSX Code</span>
        </button>

        <button className="glass-btn-primary" onClick={onOpenRender}>
          <Film size={14} />
          <span>{isRendering ? `Rendering ${renderProgress}%` : 'Render MP4'}</span>
        </button>

        {/* Native Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8, gap: 2 }}>
          <button
            className="glass-btn"
            onClick={() => window.cliphub.windowControls.minimize()}
            style={{ padding: 6, border: 'none', background: 'transparent' }}
            title="Minimize"
          >
            <Minus size={14} color="#94A3B8" />
          </button>
          <button
            className="glass-btn"
            onClick={() => window.cliphub.windowControls.maximize()}
            style={{ padding: 6, border: 'none', background: 'transparent' }}
            title="Maximize / Restore"
          >
            <Square size={12} color="#94A3B8" />
          </button>
          <button
            className="glass-btn"
            onClick={() => window.cliphub.windowControls.close()}
            style={{ padding: 6, border: 'none', background: 'transparent' }}
            title="Close"
          >
            <X size={14} color="#94A3B8" />
          </button>
        </div>
      </div>
    </header>
  );
};
