import { contextBridge, ipcRenderer } from 'electron';
import {
  AIProviderId,
  BYOKSettings,
  CompileResult,
  GenerateVideoRequest,
  GenerateVideoResult,
  RenderProgressEvent,
  RenderRequest,
  TestKeyResult,
  VideoProject,
} from '../shared/types';

export interface ClipHubAPI {
  windowControls: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  settings: {
    get: () => Promise<BYOKSettings>;
    save: (settings: BYOKSettings) => Promise<BYOKSettings>;
    testKey: (settings: BYOKSettings, providerId: AIProviderId) => Promise<TestKeyResult>;
  };
  projects: {
    list: () => Promise<VideoProject[]>;
    saveAll: (projects: VideoProject[]) => Promise<void>;
  };
  ai: {
    generateVideo: (req: GenerateVideoRequest) => Promise<GenerateVideoResult>;
  };
  compiler: {
    compile: (code: string) => Promise<CompileResult>;
  };
  render: {
    chooseOutputPath: (defaultName: string) => Promise<string | null>;
    getDefaultOutputPath: (title: string) => Promise<string>;
    start: (req: RenderRequest) => Promise<{ ok: boolean; jobId: string; outputPath?: string; error?: string }>;
    cancel: () => Promise<boolean>;
    openFile: (filePath: string) => Promise<void>;
    revealInFolder: (filePath: string) => Promise<void>;
    onProgress: (callback: (event: RenderProgressEvent) => void) => () => void;
  };
}

const api: ClipHubAPI = {
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    testKey: (settings, providerId) => ipcRenderer.invoke('settings:testKey', settings, providerId),
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    saveAll: (projects) => ipcRenderer.invoke('projects:saveAll', projects),
  },
  ai: {
    generateVideo: (req) => ipcRenderer.invoke('ai:generateVideo', req),
  },
  compiler: {
    compile: (code) => ipcRenderer.invoke('compiler:compile', code),
  },
  render: {
    chooseOutputPath: (defaultName) => ipcRenderer.invoke('render:chooseOutputPath', defaultName),
    getDefaultOutputPath: (title) => ipcRenderer.invoke('render:getDefaultOutputPath', title),
    start: (req) => ipcRenderer.invoke('render:start', req),
    cancel: () => ipcRenderer.invoke('render:cancel'),
    openFile: (filePath) => ipcRenderer.invoke('render:openFile', filePath),
    revealInFolder: (filePath) => ipcRenderer.invoke('render:revealInFolder', filePath),
    onProgress: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: RenderProgressEvent) => callback(payload);
      ipcRenderer.on('render:progress', handler);
      return () => ipcRenderer.removeListener('render:progress', handler);
    },
  },
};

contextBridge.exposeInMainWorld('cliphub', api);
