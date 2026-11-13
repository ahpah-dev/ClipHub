import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { AIProviderId, BYOKSettings, GenerateVideoRequest, RenderRequest, VideoProject } from '../shared/types';
import { loadProjects, loadSettings, saveProjects, saveSettings } from './keyStore';
import { generateVideoWithAI, testProviderKey } from './aiService';
import { compileComposition } from './compilerService';
import { cancelActiveRender, getDefaultExportPath, startNativeRender } from './renderService';

let mainWindow: BrowserWindow | null = null;

function resolveIcon() {
  const candidates = [
    path.join(app.getAppPath(), 'assets', 'icon.png'),
    path.join(process.cwd(), 'assets', 'icon.png'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      return nativeImage.createFromPath(file);
    }
  }
  return undefined;
}

function createWindow() {
  const isWin = process.platform === 'win32';
  const icon = resolveIcon();

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#060913',
    frame: false,
    titleBarStyle: isWin ? 'hidden' : 'hiddenInset',
    transparent: false,
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.CLIPHUB_DEV_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Window controls
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

  // BYOK Settings
  ipcMain.handle('settings:get', () => loadSettings());
  ipcMain.handle('settings:save', (_e, settings: BYOKSettings) => saveSettings(settings));
  ipcMain.handle('settings:testKey', (_e, settings: BYOKSettings, providerId: AIProviderId) =>
    testProviderKey(settings, providerId)
  );

  // Projects
  ipcMain.handle('projects:list', () => loadProjects());
  ipcMain.handle('projects:saveAll', (_e, projects: VideoProject[]) => saveProjects(projects));

  // AI Video Generation
  ipcMain.handle('ai:generateVideo', (_e, req: GenerateVideoRequest) => {
    const settings = loadSettings();
    return generateVideoWithAI(settings, req);
  });

  // Fast esbuild compiler for live Remotion Player preview
  ipcMain.handle('compiler:compile', (_e, code: string) => compileComposition(code));

  // Native Remotion MP4 rendering
  ipcMain.handle('render:getDefaultOutputPath', (_e, title: string) => getDefaultExportPath(title));
  ipcMain.handle('render:chooseOutputPath', async (_e, defaultName: string) => {
    const suggested = getDefaultExportPath(defaultName);
    const res = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export MP4 Video',
      defaultPath: suggested,
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    });
    return res.canceled ? null : res.filePath ?? null;
  });
  ipcMain.handle('render:start', (_e, req: RenderRequest) => startNativeRender(mainWindow, req));
  ipcMain.handle('render:cancel', () => cancelActiveRender());
  ipcMain.handle('render:openFile', async (_e, filePath: string) => {
    if (filePath && fs.existsSync(filePath)) {
      await shell.openPath(filePath);
    }
  });
  ipcMain.handle('render:revealInFolder', (_e, filePath: string) => {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
