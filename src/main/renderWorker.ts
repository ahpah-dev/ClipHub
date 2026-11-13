import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { ensureBrowser, renderMedia, selectComposition } from '@remotion/renderer';

interface RenderJobConfig {
  jobId: string;
  workDir: string;
  appNodeModules: string;
  outputPath: string;
  meta: {
    title: string;
    durationInFrames: number;
    fps: number;
    width: number;
    height: number;
  };
  assets?: Record<string, string>;
  codec: 'h264' | 'h265';
  crf: number;
}

function emit(payload: Record<string, unknown>) {
  process.stdout.write(JSON.stringify(payload) + '\n');
}

async function run() {
  const jobFilePath = process.argv[2];
  if (!jobFilePath) {
    throw new Error('Missing render job config path argument.');
  }

  const job = JSON.parse(fs.readFileSync(jobFilePath, 'utf-8')) as RenderJobConfig;
  const entryPoint = path.join(job.workDir, 'src', 'index.ts');

  emit({
    type: 'progress',
    jobId: job.jobId,
    stage: 'downloading-browser',
    progress: 4,
    message: 'Checking headless browser & ffmpeg binaries...',
  });

  await ensureBrowser({
    onBrowserDownload: () => {
      emit({
        type: 'progress',
        jobId: job.jobId,
        stage: 'downloading-browser',
        progress: 8,
        message: 'Downloading Chrome Headless Shell for native rendering (first run)...',
      });
      let lastDownloadPct = -1;
      return {
        version: null,
        onProgress: ({ percent }) => {
          const pct = Math.round(percent * 100);
          if (pct === lastDownloadPct) return;
          lastDownloadPct = pct;
          emit({
            type: 'progress',
            jobId: job.jobId,
            stage: 'downloading-browser',
            progress: Math.round(8 + percent * 12),
            message: `Downloading headless renderer (${pct}%)...`,
          });
        },
      };
    },
  });

  emit({
    type: 'progress',
    jobId: job.jobId,
    stage: 'bundling',
    progress: 22,
    message: 'Bundling Remotion React composition...',
  });

  const bundleLocation = await bundle({
    entryPoint,
    enableCaching: false,
    onProgress: (pct) => {
      emit({
        type: 'progress',
        jobId: job.jobId,
        stage: 'bundling',
        progress: Math.round(22 + (pct / 100) * 20),
        message: `Bundling assets & TSX (${Math.round(pct)}%)...`,
      });
    },
    webpackOverride: (config) => {
      const existingModules = Array.isArray(config.resolve?.modules) ? config.resolve.modules : ['node_modules'];
      const existingLoaderModules = Array.isArray(config.resolveLoader?.modules)
        ? config.resolveLoader.modules
        : ['node_modules'];
      return {
        ...config,
        resolve: {
          ...config.resolve,
          modules: [job.appNodeModules, ...existingModules],
          alias: {
            ...(config.resolve?.alias ?? {}),
            react: path.join(job.appNodeModules, 'react'),
            'react-dom': path.join(job.appNodeModules, 'react-dom'),
            remotion: path.join(job.appNodeModules, 'remotion'),
            '@remotion/transitions': path.join(job.appNodeModules, '@remotion/transitions'),
            '@remotion/shapes': path.join(job.appNodeModules, '@remotion/shapes'),
            'lucide-react': path.join(job.appNodeModules, 'lucide-react'),
          },
        },
        resolveLoader: {
          ...config.resolveLoader,
          modules: [job.appNodeModules, ...existingLoaderModules],
        },
      };
    },
  });

  emit({
    type: 'progress',
    jobId: job.jobId,
    stage: 'rendering',
    progress: 44,
    message: 'Selecting composition & preparing frames...',
  });

  const inputProps = { assets: job.assets ?? {} };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'ClipHubVideo',
    inputProps,
  });

  fs.mkdirSync(path.dirname(job.outputPath), { recursive: true });

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: job.meta.durationInFrames,
      fps: job.meta.fps,
      width: job.meta.width,
      height: job.meta.height,
    },
    serveUrl: bundleLocation,
    inputProps,
    codec: job.codec,
    crf: job.crf,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    pixelFormat: 'yuv420p',
    chromiumOptions: {
      gl: 'angle',
    },
    outputLocation: job.outputPath,
    overwrite: true,
    onProgress: ({ renderedFrames, encodedFrames, progress, stitchStage }) => {
      const pct = Math.round(45 + progress * 54);
      const isEncoding = stitchStage === 'encoding' && renderedFrames >= job.meta.durationInFrames;
      emit({
        type: 'progress',
        jobId: job.jobId,
        stage: isEncoding ? 'encoding' : 'rendering',
        progress: Math.min(99, pct),
        renderedFrames,
        totalFrames: job.meta.durationInFrames,
        message: isEncoding
          ? `Encoding MP4 (${encodedFrames}/${job.meta.durationInFrames} frames)...`
          : `Rendering frames (${renderedFrames}/${job.meta.durationInFrames})...`,
      });
    },
  });

  emit({
    type: 'done',
    jobId: job.jobId,
    outputPath: job.outputPath,
  });
}

run().catch((err) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  emit({
    type: 'error',
    error: message,
  });
  process.exit(1);
});
