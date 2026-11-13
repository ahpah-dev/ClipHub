export type AIProviderId = 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'custom';

export interface ProviderPreset {
  id: AIProviderId;
  label: string;
  description: string;
  defaultModel: string;
  suggestedModels: string[];
  baseUrl?: string;
  keyPlaceholder: string;
  docsUrl: string;
}

export interface BYOKSettings {
  activeProvider: AIProviderId;
  providers: Record<
    AIProviderId,
    {
      apiKey: string;
      model: string;
      baseUrl?: string;
    }
  >;
  customInstructions: string;
  systemPromptOverride: string;
  autoRepairOnError: boolean;
}

export interface VideoCompositionMeta {
  title: string;
  summary: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

export interface PromptAttachment {
  id: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'text';
  size: number;
  dataUrl?: string;
  textContent?: string;
}

export interface VideoProject {
  id: string;
  meta: VideoCompositionMeta;
  code: string;
  updatedAt: number;
  lastPrompt?: string;
  assets?: Record<string, string>;
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  meta?: VideoCompositionMeta;
  attachments?: Array<{ id: string; name: string; kind: 'image' | 'text'; dataUrl?: string }>;
  error?: string;
}

export interface GenerateVideoRequest {
  prompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  targetDurationSec: number;
  fps: number;
  currentCode?: string;
  currentMeta?: VideoCompositionMeta;
  currentAssets?: Record<string, string>;
  attachments?: PromptAttachment[];
  mode: 'create' | 'refine';
}

export interface GenerateVideoResult {
  ok: boolean;
  meta?: VideoCompositionMeta;
  code?: string;
  compiledCode?: string;
  assets?: Record<string, string>;
  assistantMessage?: string;
  repairAttempts?: number;
  error?: string;
}

export interface CompileResult {
  ok: boolean;
  compiledCode?: string;
  error?: string;
}

export interface RenderRequest {
  projectId: string;
  title: string;
  code: string;
  meta: VideoCompositionMeta;
  assets?: Record<string, string>;
  outputPath?: string;
  codec: 'h264' | 'h265';
  crf: number;
}

export interface RenderProgressEvent {
  jobId: string;
  stage: 'preparing' | 'bundling' | 'downloading-browser' | 'rendering' | 'encoding' | 'done' | 'error' | 'cancelled';
  progress: number; // 0..100
  message: string;
  renderedFrames?: number;
  totalFrames?: number;
  outputPath?: string;
  error?: string;
}

export interface TestKeyResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-5 / GPT-4.1 / o3-mini via OpenAI Responses or Chat Completions API',
    defaultModel: 'gpt-4.1',
    suggestedModels: ['gpt-4.1', 'gpt-4o', 'gpt-5', 'o4-mini'],
    baseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    description: 'Claude Sonnet / Opus via Anthropic Messages API',
    defaultModel: 'claude-sonnet-4-20250514',
    suggestedModels: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-latest', 'claude-opus-4-20250514'],
    baseUrl: 'https://api.anthropic.com/v1',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    description: 'Gemini 2.5 Pro / Flash via Google AI Studio Generative Language API',
    defaultModel: 'gemini-2.5-pro',
    suggestedModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'Access Claude, Gemini, GPT, Qwen, DeepSeek through one OpenRouter key',
    defaultModel: 'anthropic/claude-sonnet-4',
    suggestedModels: [
      'anthropic/claude-sonnet-4',
      'google/gemini-2.5-pro',
      'openai/gpt-4.1',
      'deepseek/deepseek-r1',
    ],
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-...',
    docsUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'custom',
    label: 'Custom OpenAI-Compatible',
    description: 'Local Ollama, LM Studio, vLLM, Groq, Together, or self-hosted endpoint',
    defaultModel: 'qwen2.5-coder:32b',
    suggestedModels: ['qwen2.5-coder:32b', 'llama-3.3-70b-versatile', 'deepseek-chat'],
    baseUrl: 'http://localhost:11434/v1',
    keyPlaceholder: 'optional-or-bearer-token',
    docsUrl: '',
  },
];
