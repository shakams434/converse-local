/**
 * Local LLM Module
 * 
 * This module provides a unified interface for interacting with the local LLM engine.
 * It abstracts away the platform-specific implementations and provides a consistent
 * API for the React components.
 * 
 * Architecture:
 * - types.ts: TypeScript interfaces and types
 * - mock.ts: Mock implementation for development
 * - native/: Native implementations (to be added)
 *   - android.ts: Android JNI bridge
 *   - ios.ts: iOS Swift/ObjC bridge
 * - index.ts: Main export and factory
 */

export type { 
  LocalLLM, 
  EngineStatus, 
  GenerationOptions, 
  ModelLoadOptions, 
  TokenListener 
} from './types';

export { createLocalLLM } from './mock';

// Re-export for convenience
import { createLocalLLM } from './mock';
export const localLLM = createLocalLLM();