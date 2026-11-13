import { app, BrowserWindow } from 'electron';
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { RenderProgressEvent, RenderRequest } from '../shared/types';

let activeRenderChild: ChildProcessWithoutNullStreams | null = null;
let activeJobId: string | null = null;

function resolveAppNodeModules(): string {
  const appPath = app.getAppPath();
  const candidates = [
    path.join(appPath, 'node_modules'),
    path.join(process.cwd(), 'node_modules'),
    path.join(path.dirname(appPath), 'app.asar.unpacked', 'node_modules'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'remotion'))) {
      return candidate;
    }
  }
  return candidates[0];
}

function resolveWorkerScript(): string {
  const appPath = app.getAppPath();
  const unpacked = path.join(path.dirname(appPath), 'app.asar.unpacked', 'dist-electron', 'main', 'renderWorker.cjs');
  if (fs.existsSync(unpacked)) {
    return unpacked;
  }
  return path.join(__dirname, 'renderWorker.cjs');
}

function sendProgress(win: BrowserWindow | null, event: RenderProgressEvent) {
  if (win && !win.isDestroyed()) {
    win.webContents.send('render:progress', event);
  }
}

export function getDefaultExportPath(title: string): string {
  const safeName =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cliphub-video';
  const videosDir = app.getPath('videos') || app.getPath('downloads');
  const exportDir = path.join(videosDir, 'ClipHub Exports');
  fs.mkdirSync(exportDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return path.join(exportDir, `${safeName}-${stamp}.mp4`);
}

export async function startNativeRender(
  win: BrowserWindow | null,
  req: RenderRequest
): Promise<{ ok: boolean; jobId: string; outputPath?: string; error?: string }> {
  if (activeRenderChild) {
    return {
      ok: false,
      jobId: activeJobId ?? 'busy',
      error: 'A native render job is already running. Wait or cancel it first.',
    };
  }

  const jobId = `job-${Date.now()}`;
  activeJobId = jobId;

  const outputPath = req.outputPath?.trim() || getDefaultExportPath(req.title);
  const workDir = path.join(app.getPath('temp'), `cliphub-render-${jobId}`);
  const srcDir = path.join(workDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  const appNodeModules = resolveAppNodeModules();

  // Junction node_modules into temp workspace so Remotion/Rspack resolves all packages seamlessly
  const nmTarget = path.join(workDir, 'node_modules');
  try {
    if (!fs.existsSync(nmTarget)) {
      fs.symlinkSync(appNodeModules, nmTarget, 'junction');
    }
  } catch {
    // Fallback handled by webpackOverride in renderWorker
  }

  fs.writeFileSync(path.join(srcDir, 'Composition.tsx'), req.code, 'utf-8');

  fs.writeFileSync(
    path.join(srcDir, 'Root.tsx'),
    `import React from 'react';
import { Composition } from 'remotion';
import { GeneratedVideo } from './Composition';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ClipHubVideo"
      component={GeneratedVideo}
      durationInFrames={${Math.max(1, Math.round(req.meta.durationInFrames))}}
      fps={${Math.max(1, Math.round(req.meta.fps))}}
      width={${Math.max(100, Math.round(req.meta.width))}}
      height={${Math.max(100, Math.round(req.meta.height))}}
    />
  );
};
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(srcDir, 'index.ts'),
    `import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
`,
    'utf-8'
  );

  const jobFilePath = path.join(workDir, 'job.json');
  fs.writeFileSync(
    jobFilePath,
    JSON.stringify({
      jobId,
      workDir,
      appNodeModules,
      outputPath,
      meta: req.meta,
      codec: req.codec,
      crf: req.crf,
    }),
    'utf-8'
  );

  sendProgress(win, {
    jobId,
    stage: 'preparing',
    progress: 2,
    message: 'Preparing native Remotion render workspace...',
  });

  const workerScript = resolveWorkerScript();

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [workerScript, jobFilePath], {
      cwd: workDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    activeRenderChild = child;

    let stderrTail = '';
    let finished = false;

    const cleanup = () => {
      activeRenderChild = null;
      activeJobId = null;
      try {
        // Remove junction safely before recursive delete
        if (fs.existsSync(nmTarget)) {
          fs.rmSync(nmTarget, { recursive: false, force: true });
        }
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup
      }
    };

    const rl = readline.createInterface({ input: child.stdout });
    rl.on('line', (line) => {
      if (!line.trim().startsWith('{')) return;
      try {
        const msg = JSON.parse(line) as {
          type: string;
          stage?: RenderProgressEvent['stage'];
          progress?: number;
          message?: string;
          renderedFrames?: number;
          totalFrames?: number;
          outputPath?: string;
          error?: string;
        };

        if (msg.type === 'progress') {
          sendProgress(win, {
            jobId,
            stage: msg.stage ?? 'rendering',
            progress: msg.progress ?? 0,
            message: msg.message ?? 'Rendering...',
            renderedFrames: msg.renderedFrames,
            totalFrames: msg.totalFrames,
          });
        } else if (msg.type === 'done') {
          finished = true;
          sendProgress(win, {
            jobId,
            stage: 'done',
            progress: 100,
            message: 'MP4 rendered natively!',
            outputPath: msg.outputPath ?? outputPath,
          });
          cleanup();
          resolve({ ok: true, jobId, outputPath: msg.outputPath ?? outputPath });
        } else if (msg.type === 'error') {
          finished = true;
          const errMsg = msg.error || 'Native render failed.';
          sendProgress(win, {
            jobId,
            stage: 'error',
            progress: 0,
            message: errMsg,
            error: errMsg,
          });
          cleanup();
          resolve({ ok: false, jobId, error: errMsg });
        }
      } catch {
        // Ignore non-JSON log lines
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-3000);
    });

    child.on('close', (code, signal) => {
      if (finished) return;
      finished = true;
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        sendProgress(win, {
          jobId,
          stage: 'cancelled',
          progress: 0,
          message: 'Render cancelled by user.',
        });
        cleanup();
        resolve({ ok: false, jobId, error: 'Render cancelled.' });
      } else {
        const errMsg = stderrTail.trim() || `Render worker exited with code ${code}`;
        sendProgress(win, {
          jobId,
          stage: 'error',
          progress: 0,
          message: errMsg,
          error: errMsg,
        });
        cleanup();
        resolve({ ok: false, jobId, error: errMsg });
      }
    });
  });
}

export function cancelActiveRender(): boolean {
  if (!activeRenderChild) return false;
  try {
    activeRenderChild.kill('SIGTERM');
    return true;
  } catch {
    return false;
  }
}
