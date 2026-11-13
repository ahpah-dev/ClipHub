import { app, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { BYOKSettings, PROVIDER_PRESETS, VideoProject } from '../shared/types';
import { STARTER_PROJECTS } from '../shared/starterTemplates';

const SETTINGS_FILE = 'cliphub-settings.json';
const PROJECTS_FILE = 'cliphub-projects.json';

function getDefaultSettings(): BYOKSettings {
  const providers = {} as BYOKSettings['providers'];
  for (const preset of PROVIDER_PRESETS) {
    providers[preset.id] = {
      apiKey: '',
      model: preset.defaultModel,
      baseUrl: preset.baseUrl,
    };
  }
  return {
    activeProvider: 'openai',
    providers,
    customInstructions: '',
    systemPromptOverride: '',
    autoRepairOnError: true,
  };
}

function encryptSecret(plain: string): string {
  if (!plain) return '';
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const buf = safeStorage.encryptString(plain);
      return `enc:${buf.toString('base64')}`;
    }
  } catch {
    // Fall back to plain storage if OS keystore is unavailable
  }
  return `raw:${plain}`;
}

function decryptSecret(stored: string): string {
  if (!stored) return '';
  if (stored.startsWith('enc:')) {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const buf = Buffer.from(stored.slice(4), 'base64');
        return safeStorage.decryptString(buf);
      }
    } catch {
      return '';
    }
  }
  if (stored.startsWith('raw:')) {
    return stored.slice(4);
  }
  return stored;
}

export function loadSettings(): BYOKSettings {
  const filePath = path.join(app.getPath('userData'), SETTINGS_FILE);
  const defaults = getDefaultSettings();

  if (!fs.existsSync(filePath)) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Partial<BYOKSettings>;
    const merged: BYOKSettings = {
      activeProvider: parsed.activeProvider ?? defaults.activeProvider,
      providers: { ...defaults.providers },
      customInstructions: parsed.customInstructions ?? '',
      systemPromptOverride: parsed.systemPromptOverride ?? '',
      autoRepairOnError: parsed.autoRepairOnError ?? true,
    };

    for (const preset of PROVIDER_PRESETS) {
      const incoming = parsed.providers?.[preset.id];
      if (incoming) {
        merged.providers[preset.id] = {
          apiKey: decryptSecret(incoming.apiKey ?? ''),
          model: incoming.model || preset.defaultModel,
          baseUrl: incoming.baseUrl ?? preset.baseUrl,
        };
      }
    }
    return merged;
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: BYOKSettings): BYOKSettings {
  const filePath = path.join(app.getPath('userData'), SETTINGS_FILE);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const toPersist: BYOKSettings = {
    ...settings,
    providers: { ...settings.providers },
  };

  for (const preset of PROVIDER_PRESETS) {
    const entry = toPersist.providers[preset.id];
    if (entry) {
      toPersist.providers[preset.id] = {
        ...entry,
        apiKey: encryptSecret(entry.apiKey.trim()),
      };
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(toPersist, null, 2), 'utf-8');
  return settings;
}

export function loadProjects(): VideoProject[] {
  const filePath = path.join(app.getPath('userData'), PROJECTS_FILE);
  if (!fs.existsSync(filePath)) {
    return STARTER_PROJECTS;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as VideoProject[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return STARTER_PROJECTS;
    }
    return parsed;
  } catch {
    return STARTER_PROJECTS;
  }
}

export function saveProjects(projects: VideoProject[]): void {
  const filePath = path.join(app.getPath('userData'), PROJECTS_FILE);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(projects, null, 2), 'utf-8');
}
