import * as esbuild from 'esbuild';
import { CompileResult } from '../shared/types';

const ALLOWED_IMPORTS = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'remotion',
  '@remotion/transitions',
  '@remotion/transitions/fade',
  '@remotion/transitions/slide',
  '@remotion/transitions/wipe',
  '@remotion/shapes',
  'lucide-react',
]);

function validateImports(code: string): string | null {
  const importRegex = /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/gm;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(code)) !== null) {
    const pkg = match[1];
    if (!ALLOWED_IMPORTS.has(pkg)) {
      return `Disallowed import "${pkg}". Only ${Array.from(ALLOWED_IMPORTS).join(', ')} are allowed.`;
    }
  }
  return null;
}

export async function compileComposition(tsxCode: string): Promise<CompileResult> {
  if (!tsxCode || !tsxCode.trim()) {
    return { ok: false, error: 'Composition code is empty.' };
  }

  const importError = validateImports(tsxCode);
  if (importError) {
    return { ok: false, error: importError };
  }

  try {
    const result = await esbuild.transform(tsxCode, {
      loader: 'tsx',
      format: 'cjs',
      jsx: 'automatic',
      jsxImportSource: 'react',
      target: 'es2020',
      sourcemap: false,
    });

    const compiledCode = result.code;
    if (!compiledCode.includes('GeneratedVideo')) {
      return {
        ok: false,
        error: 'Composition must export a React component named `GeneratedVideo`.',
      };
    }

    return { ok: true, compiledCode };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
