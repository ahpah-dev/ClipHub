import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as remotion from 'remotion';
import * as remotionTransitions from '@remotion/transitions';
import * as transitionsFade from '@remotion/transitions/fade';
import * as transitionsSlide from '@remotion/transitions/slide';
import * as transitionsWipe from '@remotion/transitions/wipe';
import * as remotionShapes from '@remotion/shapes';
import * as lucideReact from 'lucide-react';
import type { VideoCompositionMeta } from '@shared/types';

const MODULE_MAP: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  'react/jsx-dev-runtime': jsxRuntime,
  remotion,
  '@remotion/transitions': remotionTransitions,
  '@remotion/transitions/fade': transitionsFade,
  '@remotion/transitions/slide': transitionsSlide,
  '@remotion/transitions/wipe': transitionsWipe,
  '@remotion/shapes': remotionShapes,
  'lucide-react': lucideReact,
};

export interface EvaluatedComposition {
  Component: React.FC<{ assets?: Record<string, string> }>;
  videoConfig?: Partial<VideoCompositionMeta>;
}

export function evaluateCompiledComposition(compiledCjs: string): EvaluatedComposition {
  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };

  const customRequire = (specifier: string) => {
    if (specifier in MODULE_MAP) {
      return MODULE_MAP[specifier];
    }
    throw new Error(`Module "${specifier}" is not available in the ClipHub preview runtime.`);
  };

  const fn = new Function('require', 'module', 'exports', 'React', compiledCjs);
  fn(customRequire, moduleObj, exportsObj, React);

  const resolvedExports = (moduleObj.exports ?? exportsObj) as Record<string, unknown>;
  const Component = (resolvedExports.GeneratedVideo ?? resolvedExports.default) as
    | React.FC<{ assets?: Record<string, string> }>
    | undefined;

  if (typeof Component !== 'function') {
    throw new Error('Compiled module does not export a valid `GeneratedVideo` React component.');
  }

  return {
    Component,
    videoConfig: resolvedExports.videoConfig as Partial<VideoCompositionMeta> | undefined,
  };
}
