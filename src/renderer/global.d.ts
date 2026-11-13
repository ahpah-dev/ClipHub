import type { ClipHubAPI } from '../main/preload';

declare global {
  interface Window {
    cliphub: ClipHubAPI;
  }
}

export {};
