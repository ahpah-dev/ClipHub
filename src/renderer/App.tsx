import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BYOKSettings,
  ChatTurn,
  GenerateVideoRequest,
  PROVIDER_PRESETS,
  PromptAttachment,
  RenderProgressEvent,
  VideoProject,
} from '@shared/types';
import { STARTER_PROJECTS } from '@shared/starterTemplates';
import { evaluateCompiledComposition } from './lib/evalComposition';
import { TitleBar } from './components/TitleBar';
import { PromptSidebar } from './components/PromptSidebar';
import { PreviewStage } from './components/PreviewStage';
import { CodeDrawer } from './components/CodeDrawer';
import { SettingsModal } from './components/SettingsModal';
import { RenderModal } from './components/RenderModal';

function makeDefaultSettings(): BYOKSettings {
  const providers = {} as BYOKSettings['providers'];
  for (const p of PROVIDER_PRESETS) {
    providers[p.id] = { apiKey: '', model: p.defaultModel, baseUrl: p.baseUrl };
  }
  return {
    activeProvider: 'openai',
    providers,
    customInstructions: '',
    systemPromptOverride: '',
    autoRepairOnError: true,
  };
}

export const App: React.FC = () => {
  const [settings, setSettings] = useState<BYOKSettings>(makeDefaultSettings);
  const [projects, setProjects] = useState<VideoProject[]>(STARTER_PROJECTS);
  const [activeId, setActiveId] = useState<string>(STARTER_PROJECTS[0].id);

  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);
  const [mode, setMode] = useState<GenerateVideoRequest['mode']>('create');
  const [aspectRatio, setAspectRatio] = useState<GenerateVideoRequest['aspectRatio']>('16:9');
  const [durationSec, setDurationSec] = useState<number>(9);
  const [fps, setFps] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);

  const [compiledComponent, setCompiledComponent] = useState<React.FC<{ assets?: Record<string, string> }> | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [codeHash, setCodeHash] = useState<string>('init');

  const [showCode, setShowCode] = useState(false);
  const [settingsModal, setSettingsModal] = useState<{ open: boolean; tab: 'providers' | 'prompt' | 'guide' }>({
    open: false,
    tab: 'providers',
  });
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [renderState, setRenderState] = useState<RenderProgressEvent | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeId) ?? projects[0],
    [projects, activeId]
  );

  const compileAndLoad = useCallback(async (code: string, hashSeed: string) => {
    const res = await window.cliphub.compiler.compile(code);
    if (!res.ok || !res.compiledCode) {
      setCompileError(res.error || 'Failed to compile TSX.');
      setCompiledComponent(null);
      return false;
    }
    try {
      const evaluated = evaluateCompiledComposition(res.compiledCode);
      setCompiledComponent(() => evaluated.Component);
      setCompileError(null);
      setCodeHash(`${hashSeed}-${Date.now()}`);
      return true;
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : String(err));
      setCompiledComponent(null);
      return false;
    }
  }, []);

  // Bootstrap settings, projects, and render progress listener
  useEffect(() => {
    window.cliphub.settings.get().then(setSettings);
    window.cliphub.projects.list().then((loaded) => {
      if (loaded.length > 0) {
        setProjects(loaded);
        setActiveId(loaded[0].id);
      }
    });
    const unsub = window.cliphub.render.onProgress((ev) => {
      setRenderState(ev);
      if (ev.stage === 'done' || ev.stage === 'error' || ev.stage === 'cancelled') {
        setIsRendering(false);
      } else {
        setIsRendering(true);
      }
    });
    return unsub;
  }, []);

  // Recompile whenever active project changes
  useEffect(() => {
    if (activeProject) {
      compileAndLoad(activeProject.code, activeProject.id);
    }
  }, [activeProject?.id, compileAndLoad]);

  const persistProjects = useCallback(async (updated: VideoProject[]) => {
    setProjects(updated);
    await window.cliphub.projects.saveAll(updated);
  }, []);

  const handleSaveSettings = async (updated: BYOKSettings) => {
    const saved = await window.cliphub.settings.save(updated);
    setSettings(saved);
  };

  const handleNewProject = () => {
    setMode('create');
    setPrompt('');
    setAttachments([]);
    setChatHistory([]);
  };

  const handleAddFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const existingKeys = new Set<string>([
        ...(mode === 'refine' ? Object.keys(activeProject.assets ?? {}) : []),
        ...attachments.map((a) => a.id),
      ]);

      let nextIndex = 1;
      const allocId = () => {
        while (existingKeys.has(`asset-${nextIndex}`)) {
          nextIndex++;
        }
        const id = `asset-${nextIndex}`;
        existingKeys.add(id);
        return id;
      };

      const readAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

      const readAsText = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });

      const created: PromptAttachment[] = [];
      for (const file of files) {
        const mime = file.type || '';
        const isSvg = mime === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
        const isRasterImage = mime.startsWith('image/') && !isSvg;

        if (isRasterImage) {
          const dataUrl = await readAsDataUrl(file);
          created.push({
            id: allocId(),
            name: file.name || `pasted-image-${Date.now()}.png`,
            mimeType: mime || 'image/png',
            kind: 'image',
            size: file.size,
            dataUrl,
          });
        } else {
          const textContent = await readAsText(file);
          created.push({
            id: allocId(),
            name: file.name || 'attached-file.txt',
            mimeType: mime || 'text/plain',
            kind: 'text',
            size: file.size,
            textContent,
          });
        }
      }

      setAttachments((prev) => [...prev, ...created]);
    },
    [attachments, activeProject.assets, mode]
  );

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const runGeneration = async (customPrompt?: string, overrideMode?: GenerateVideoRequest['mode']) => {
    const effectiveMode = overrideMode ?? mode;
    const activeAttachments = customPrompt ? [] : attachments;
    const effectivePrompt =
      (customPrompt ?? prompt).trim() ||
      (activeAttachments.length > 0 ? 'Create a video incorporating the attached files and images.' : '');
    if (!effectivePrompt || isGenerating) return;

    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: effectivePrompt,
      attachments: activeAttachments.map((a) => ({
        id: a.id,
        name: a.name,
        kind: a.kind,
        dataUrl: a.dataUrl,
      })),
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, userTurn]);
    if (!customPrompt) {
      setPrompt('');
      setAttachments([]);
    }
    setIsGenerating(true);

    try {
      const result = await window.cliphub.ai.generateVideo({
        prompt: effectivePrompt,
        aspectRatio,
        targetDurationSec: durationSec,
        fps,
        mode: effectiveMode,
        currentCode: effectiveMode === 'refine' ? activeProject.code : undefined,
        currentMeta: effectiveMode === 'refine' ? activeProject.meta : undefined,
        currentAssets: effectiveMode === 'refine' ? activeProject.assets : undefined,
        attachments: activeAttachments,
      });

      if (!result.ok || !result.code || !result.meta) {
        setChatHistory((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: '',
            error: result.error || 'Video generation failed.',
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const compiledOk = await compileAndLoad(result.code, `gen-${Date.now()}`);

      if (effectiveMode === 'refine') {
        const updated = projects.map((p) =>
          p.id === activeProject.id
            ? {
                ...p,
                meta: result.meta!,
                code: result.code!,
                assets: result.assets ?? p.assets,
                updatedAt: Date.now(),
                lastPrompt: effectivePrompt,
              }
            : p
        );
        await persistProjects(updated);
      } else {
        const newProj: VideoProject = {
          id: `clip-${Date.now()}`,
          meta: result.meta,
          code: result.code,
          assets: result.assets,
          updatedAt: Date.now(),
          lastPrompt: effectivePrompt,
        };
        const updated = [newProj, ...projects];
        await persistProjects(updated);
        setActiveId(newProj.id);
        setMode('refine');
      }

      const repairNote =
        result.repairAttempts && result.repairAttempts > 0
          ? ` (auto-repaired ${result.repairAttempts}×)`
          : '';

      setChatHistory((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: `${result.assistantMessage || result.meta!.title}${repairNote}${
            compiledOk ? '' : ' — Note: preview reported an evaluation warning.'
          }`,
          meta: result.meta,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyManualCode = async (newCode: string) => {
    const ok = await compileAndLoad(newCode, `manual-${activeProject.id}`);
    // Parse updated videoConfig metadata if present
    const titleM = newCode.match(/title\s*:\s*['"`]([^'"`]+)['"`]/);
    const durM = newCode.match(/durationInFrames\s*:\s*(\d+)/);
    const fpsM = newCode.match(/fps\s*:\s*(\d+)/);
    const widthM = newCode.match(/width\s*:\s*(\d+)/);
    const heightM = newCode.match(/height\s*:\s*(\d+)/);

    const updatedMeta = {
      ...activeProject.meta,
      title: titleM?.[1] ?? activeProject.meta.title,
      durationInFrames: durM ? Number(durM[1]) : activeProject.meta.durationInFrames,
      fps: fpsM ? Number(fpsM[1]) : activeProject.meta.fps,
      width: widthM ? Number(widthM[1]) : activeProject.meta.width,
      height: heightM ? Number(heightM[1]) : activeProject.meta.height,
    };

    const updated = projects.map((p) =>
      p.id === activeProject.id ? { ...p, code: newCode, meta: updatedMeta, updatedAt: Date.now() } : p
    );
    await persistProjects(updated);
    if (!ok) {
      setShowCode(true);
    }
  };

  const handleAutoFixRuntimeError = (errMsg: string) => {
    setMode('refine');
    runGeneration(`Fix this error in the composition without changing the overall visual design:\n${errMsg}`, 'refine');
  };

  const handleStartRender = async (opts: { outputPath: string; codec: 'h264' | 'h265'; crf: number }) => {
    setIsRendering(true);
    setRenderState({
      jobId: 'starting',
      stage: 'preparing',
      progress: 1,
      message: 'Starting native Remotion render...',
    });
    const res = await window.cliphub.render.start({
      projectId: activeProject.id,
      title: activeProject.meta.title,
      code: activeProject.code,
      meta: activeProject.meta,
      assets: activeProject.assets,
      outputPath: opts.outputPath,
      codec: opts.codec,
      crf: opts.crf,
    });
    if (!res.ok) {
      setIsRendering(false);
    }
  };

  const handleCancelRender = async () => {
    await window.cliphub.render.cancel();
    setIsRendering(false);
  };

  const hasApiKey =
    Boolean(settings.providers[settings.activeProvider]?.apiKey?.trim()) ||
    settings.activeProvider === 'custom';

  return (
    <div className="studio-canvas">
      <TitleBar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(id) => {
          setActiveId(id);
          setMode('refine');
        }}
        onNewProject={handleNewProject}
        settings={settings}
        showCode={showCode}
        onToggleCode={() => setShowCode((v) => !v)}
        onOpenSettings={(tab = 'providers') => setSettingsModal({ open: true, tab })}
        onOpenRender={() => setShowRenderModal(true)}
        isRendering={isRendering}
        renderProgress={renderState?.progress ?? 0}
      />

      <main
        style={{
          flex: 1,
          padding: 14,
          display: 'flex',
          gap: 14,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <PromptSidebar
          prompt={prompt}
          onPromptChange={setPrompt}
          attachments={attachments}
          onAddFiles={handleAddFiles}
          onRemoveAttachment={handleRemoveAttachment}
          mode={mode}
          onModeChange={setMode}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          durationSec={durationSec}
          onDurationSecChange={setDurationSec}
          fps={fps}
          onFpsChange={setFps}
          isGenerating={isGenerating}
          hasApiKey={hasApiKey}
          chatHistory={chatHistory}
          onGenerate={() => runGeneration()}
          onOpenSettings={() => setSettingsModal({ open: true, tab: 'providers' })}
        />

        <PreviewStage
          component={compiledComponent}
          meta={activeProject.meta}
          assets={activeProject.assets}
          compileError={compileError}
          isGenerating={isGenerating}
          codeHash={codeHash}
          onAutoFixRuntimeError={handleAutoFixRuntimeError}
        />

        {showCode && (
          <CodeDrawer
            code={activeProject.code}
            onApplyCode={handleApplyManualCode}
            onClose={() => setShowCode(false)}
          />
        )}
      </main>

      {settingsModal.open && (
        <SettingsModal
          initialTab={settingsModal.tab}
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsModal((prev) => ({ ...prev, open: false }))}
        />
      )}

      {showRenderModal && (
        <RenderModal
          project={activeProject}
          renderState={renderState}
          isRendering={isRendering}
          onStartRender={handleStartRender}
          onCancelRender={handleCancelRender}
          onClose={() => setShowRenderModal(false)}
        />
      )}
    </div>
  );
};
