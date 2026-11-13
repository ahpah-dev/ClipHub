import {
  AIProviderId,
  BYOKSettings,
  GenerateVideoRequest,
  GenerateVideoResult,
  PROVIDER_PRESETS,
  PromptAttachment,
  TestKeyResult,
  VideoCompositionMeta,
} from '../shared/types';
import { DEFAULT_SYSTEM_PROMPT } from '../shared/systemPrompt';
import { compileComposition } from './compilerService';

interface ImageInputPart {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  base64: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: ImageInputPart[];
}

function getDimensions(aspectRatio: GenerateVideoRequest['aspectRatio']) {
  if (aspectRatio === '9:16') return { width: 1080, height: 1920 };
  if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
}

function buildEffectiveSystemPrompt(settings: BYOKSettings): string {
  const base = settings.systemPromptOverride?.trim() || DEFAULT_SYSTEM_PROMPT;
  const custom = settings.customInstructions?.trim();
  if (!custom) return base;
  return `${base}\n\n======================================================================\nUSER CUSTOM BRAND & STYLE INSTRUCTIONS\n======================================================================\n${custom}`;
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function prepareAttachments(
  attachments: PromptAttachment[] = [],
  existingAssets: Record<string, string> = {}
): {
  imageParts: ImageInputPart[];
  mergedAssets: Record<string, string>;
  attachmentPromptSection: string;
} {
  const mergedAssets: Record<string, string> = { ...existingAssets };
  const imageParts: ImageInputPart[] = [];
  const notes: string[] = [];

  for (const att of attachments) {
    if (att.kind === 'image' && att.dataUrl) {
      const parsed = parseDataUrl(att.dataUrl);
      if (parsed) {
        mergedAssets[att.id] = att.dataUrl;
        imageParts.push({
          id: att.id,
          name: att.name,
          mimeType: parsed.mimeType,
          dataUrl: att.dataUrl,
          base64: parsed.base64,
        });
        notes.push(
          `- Image attachment "${att.name}" (${parsed.mimeType}) -> available at runtime via \`assets?.['${att.id}']\``
        );
      }
    } else if (att.kind === 'text' && att.textContent !== undefined) {
      const clipped = att.textContent.slice(0, 48000);
      notes.push(
        `--- Attached File: ${att.name} (${att.mimeType || 'text/plain'}) ---\n${clipped}\n--- End of ${att.name} ---`
      );
    }
  }

  const existingKeys = Object.keys(existingAssets);
  if (existingKeys.length > 0 && attachments.length === 0) {
    notes.push(
      `Existing project image asset keys available via \`assets\`: ${existingKeys.map((k) => `'${k}'`).join(', ')}`
    );
  }

  return {
    imageParts,
    mergedAssets,
    attachmentPromptSection: notes.length > 0 ? `\nATTACHED FILES & ASSETS:\n${notes.join('\n')}` : '',
  };
}

function buildUserPrompt(req: GenerateVideoRequest, attachmentPromptSection: string): string {
  const { width, height } = getDimensions(req.aspectRatio);
  const targetFrames = Math.max(60, Math.round(req.targetDurationSec * req.fps));

  if (req.mode === 'refine' && req.currentCode) {
    return [
      `REFINE EXISTING REMOTION VIDEO`,
      `Requested change: ${req.prompt}`,
      `Target canvas: ${width}x${height} (${req.aspectRatio}), ${req.fps} fps, target ~${targetFrames} frames (${req.targetDurationSec}s) unless the user requested a different duration or aspect ratio.`,
      attachmentPromptSection,
      ``,
      `Current metadata:`,
      JSON.stringify(req.currentMeta ?? { width, height, fps: req.fps, durationInFrames: targetFrames }),
      ``,
      `Current Composition TSX:`,
      '```tsx',
      req.currentCode,
      '```',
      ``,
      `Return the COMPLETE updated <cliphub_meta>{...}</cliphub_meta> and full \`\`\`tsx ... \`\`\` file.`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    `CREATE A NEW REMOTION VIDEO`,
    `User prompt: ${req.prompt}`,
    ``,
    `Technical parameters:`,
    `- Aspect ratio: ${req.aspectRatio} (${width}x${height})`,
    `- FPS: ${req.fps}`,
    `- Target duration: ${req.targetDurationSec} seconds (${targetFrames} frames)`,
    attachmentPromptSection,
    ``,
    `Make it visually striking, richly choreographed across multiple scenes or beats, deterministic, and 100% self-contained. Output <cliphub_meta>{...}</cliphub_meta> followed by the complete \`\`\`tsx ... \`\`\` file.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function extractResponseArtifacts(
  rawText: string,
  fallbackMeta: VideoCompositionMeta
): { meta: VideoCompositionMeta; code: string } | null {
  const codeMatch =
    rawText.match(/```(?:tsx|typescript|ts|jsx|javascript)?\s*\n([\s\S]*?)```/i) ??
    rawText.match(/```([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : rawText.includes('GeneratedVideo') ? rawText.trim() : '';

  if (!code) {
    return null;
  }

  let parsedMeta: Partial<VideoCompositionMeta> = {};
  const metaMatch = rawText.match(/<cliphub_meta>\s*([\s\S]*?)\s*<\/cliphub_meta>/i);
  if (metaMatch) {
    try {
      parsedMeta = JSON.parse(metaMatch[1]) as Partial<VideoCompositionMeta>;
    } catch {
      // Ignore malformed tag JSON and fall back to code extraction
    }
  }

  if (!parsedMeta.title || !parsedMeta.durationInFrames) {
    const titleM = code.match(/title\s*:\s*['"`]([^'"`]+)['"`]/);
    const summaryM = code.match(/summary\s*:\s*['"`]([^'"`]+)['"`]/);
    const durM = code.match(/durationInFrames\s*:\s*(\d+)/);
    const fpsM = code.match(/fps\s*:\s*(\d+)/);
    const widthM = code.match(/width\s*:\s*(\d+)/);
    const heightM = code.match(/height\s*:\s*(\d+)/);

    parsedMeta = {
      title: parsedMeta.title ?? titleM?.[1],
      summary: parsedMeta.summary ?? summaryM?.[1],
      durationInFrames: parsedMeta.durationInFrames ?? (durM ? Number(durM[1]) : undefined),
      fps: parsedMeta.fps ?? (fpsM ? Number(fpsM[1]) : undefined),
      width: parsedMeta.width ?? (widthM ? Number(widthM[1]) : undefined),
      height: parsedMeta.height ?? (heightM ? Number(heightM[1]) : undefined),
    };
  }

  const meta: VideoCompositionMeta = {
    title: String(parsedMeta.title || fallbackMeta.title || 'Untitled AI Clip').slice(0, 80),
    summary: String(parsedMeta.summary || fallbackMeta.summary || 'AI-generated Remotion composition').slice(0, 240),
    durationInFrames: Math.max(30, Math.min(18000, Number(parsedMeta.durationInFrames) || fallbackMeta.durationInFrames)),
    fps: Math.max(15, Math.min(120, Number(parsedMeta.fps) || fallbackMeta.fps)),
    width: Math.max(320, Math.min(3840, Number(parsedMeta.width) || fallbackMeta.width)),
    height: Math.max(320, Math.min(3840, Number(parsedMeta.height) || fallbackMeta.height)),
  };

  return { meta, code };
}

async function callProviderLLM(
  settings: BYOKSettings,
  providerId: AIProviderId,
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  const cfg = settings.providers[providerId];
  const preset = PROVIDER_PRESETS.find((p) => p.id === providerId)!;
  const apiKey = cfg?.apiKey?.trim() ?? '';
  const model = cfg?.model?.trim() || preset.defaultModel;
  const baseUrl = (cfg?.baseUrl?.trim() || preset.baseUrl || '').replace(/\/+$/, '');

  if (!apiKey && providerId !== 'custom') {
    throw new Error(`No API key configured for ${preset.label}. Open BYOK Settings to add your key.`);
  }

  if (providerId === 'anthropic') {
    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: messages.map((m) => {
          if (m.role === 'user' && m.images && m.images.length > 0) {
            return {
              role: 'user',
              content: [
                ...m.images.map((img) => ({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: img.mimeType,
                    data: img.base64,
                  },
                })),
                { type: 'text', text: m.content },
              ],
            };
          }
          return { role: m.role, content: m.content };
        }),
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      content?: Array<{ type: string; text?: string }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message || `Anthropic HTTP ${res.status}`);
    }
    const text = data.content?.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('\n') ?? '';
    if (!text) throw new Error('Anthropic returned an empty response.');
    return text;
  }

  if (providerId === 'gemini') {
    const endpoint = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: messages.map((m) => {
          const parts: Array<Record<string, unknown>> = [];
          if (m.role === 'user' && m.images && m.images.length > 0) {
            for (const img of m.images) {
              parts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.base64,
                },
              });
            }
          }
          parts.push({ text: m.content });
          return {
            role: m.role === 'assistant' ? 'model' : 'user',
            parts,
          };
        }),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
    }
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('\n') ?? '';
    if (!text) throw new Error('Gemini returned an empty response.');
    return text;
  }

  // OpenAI, OpenRouter, and Custom OpenAI-compatible
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = 'https://cliphub.local';
    headers['X-Title'] = 'ClipHub AI Motion Studio';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => {
          if (m.role === 'user' && m.images && m.images.length > 0) {
            return {
              role: 'user',
              content: [
                { type: 'text', text: m.content },
                ...m.images.map((img) => ({
                  type: 'image_url',
                  image_url: { url: img.dataUrl },
                })),
              ],
            };
          }
          return { role: m.role, content: m.content };
        }),
      ],
      temperature: model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4') ? undefined : 0.7,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `${preset.label} HTTP ${res.status}`);
  }
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error(`${preset.label} returned an empty response.`);
  return text;
}

export async function generateVideoWithAI(
  settings: BYOKSettings,
  req: GenerateVideoRequest
): Promise<GenerateVideoResult> {
  const providerId = settings.activeProvider;
  const { width, height } = getDimensions(req.aspectRatio);
  const fallbackMeta: VideoCompositionMeta = {
    title: req.prompt.slice(0, 42).trim() || 'AI Motion Clip',
    summary: req.prompt.slice(0, 140),
    durationInFrames: Math.max(60, Math.round(req.targetDurationSec * req.fps)),
    fps: req.fps,
    width,
    height,
  };

  const { imageParts, mergedAssets, attachmentPromptSection } = prepareAttachments(
    req.attachments,
    req.mode === 'refine' ? req.currentAssets : {}
  );

  const systemPrompt = buildEffectiveSystemPrompt(settings);
  const history: Message[] = [
    {
      role: 'user',
      content: buildUserPrompt(req, attachmentPromptSection),
      images: imageParts,
    },
  ];

  const maxRepairs = settings.autoRepairOnError ? 2 : 0;
  let lastError = 'Unknown generation error';

  for (let attempt = 0; attempt <= maxRepairs; attempt++) {
    try {
      const rawText = await callProviderLLM(settings, providerId, systemPrompt, history);
      const extracted = extractResponseArtifacts(rawText, fallbackMeta);

      if (!extracted) {
        lastError = 'Model output did not contain a valid TSX code block.';
        if (attempt < maxRepairs) {
          history.push({ role: 'assistant', content: rawText });
          history.push({
            role: 'user',
            content:
              'Your reply did not include the required <cliphub_meta>{...}</cliphub_meta> and complete ```tsx ... ``` code block exporting `GeneratedVideo`. Please output both now.',
          });
          continue;
        }
        return { ok: false, error: lastError };
      }

      const compiled = await compileComposition(extracted.code);
      if (compiled.ok && compiled.compiledCode) {
        return {
          ok: true,
          meta: extracted.meta,
          code: extracted.code,
          compiledCode: compiled.compiledCode,
          assets: Object.keys(mergedAssets).length > 0 ? mergedAssets : undefined,
          assistantMessage: `${extracted.meta.title} — ${extracted.meta.summary}`,
          repairAttempts: attempt,
        };
      }

      lastError = compiled.error || 'TSX compilation failed.';
      if (attempt < maxRepairs) {
        history.push({ role: 'assistant', content: rawText });
        history.push({
          role: 'user',
          content: `The TSX failed compilation with this exact error:\n\n${lastError}\n\nFix the issue and return the COMPLETE corrected <cliphub_meta>{...}</cliphub_meta> and full \`\`\`tsx ... \`\`\` block.`,
        });
      }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return {
    ok: false,
    error: `Compilation failed after ${maxRepairs} auto-repair attempt(s): ${lastError}`,
  };
}

export async function testProviderKey(
  settings: BYOKSettings,
  providerId: AIProviderId
): Promise<TestKeyResult> {
  const start = Date.now();
  try {
    const reply = await callProviderLLM(
      settings,
      providerId,
      'You are a connection verifier. Reply with exactly: OK',
      [{ role: 'user', content: 'Reply with OK' }]
    );
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      message: `Connected (${latencyMs}ms): "${reply.trim().slice(0, 40)}"`,
      latencyMs,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
