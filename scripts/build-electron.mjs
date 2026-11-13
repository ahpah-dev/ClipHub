import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export async function buildElectron() {
  const sharedConfig = {
    bundle: true,
    platform: 'node',
    target: 'node20',
    sourcemap: true,
    logLevel: 'info',
  };

  // Main process
  await esbuild.build({
    ...sharedConfig,
    entryPoints: [path.join(rootDir, 'src/main/index.ts')],
    outfile: path.join(rootDir, 'dist-electron/main/index.js'),
    format: 'cjs',
    external: ['electron', 'esbuild', '@remotion/bundler', '@remotion/renderer'],
  });

  // Preload script
  await esbuild.build({
    ...sharedConfig,
    entryPoints: [path.join(rootDir, 'src/main/preload.ts')],
    outfile: path.join(rootDir, 'dist-electron/main/preload.js'),
    format: 'cjs',
    external: ['electron'],
  });

  // Isolated Remotion native render worker (runs via ELECTRON_RUN_AS_NODE=1)
  await esbuild.build({
    ...sharedConfig,
    entryPoints: [path.join(rootDir, 'src/main/renderWorker.ts')],
    outfile: path.join(rootDir, 'dist-electron/main/renderWorker.cjs'),
    format: 'cjs',
    external: [
      'electron',
      'esbuild',
      'remotion',
      '@remotion/bundler',
      '@remotion/renderer',
      'webpack',
      '@rspack/core',
    ],
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildElectron().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
