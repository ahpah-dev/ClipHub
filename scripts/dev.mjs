import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import electronPath from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildElectron } from './build-electron.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function startDev() {
  await buildElectron();

  const viteServer = await createServer({
    configFile: path.join(rootDir, 'vite.config.ts'),
  });
  await viteServer.listen();
  const port = viteServer.config.server.port || 5173;
  const devUrl = `http://localhost:${port}`;

  console.log(`[ClipHub] Vite dev server ready at ${devUrl}`);

  const electronProc = spawn(String(electronPath), ['.'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      CLIPHUB_DEV_URL: devUrl,
    },
  });

  electronProc.on('close', async (code) => {
    await viteServer.close();
    process.exit(code ?? 0);
  });
}

startDev().catch((err) => {
  console.error(err);
  process.exit(1);
});
