/**
 * Local LLM Native Module Interface
 * 
 * This interface defines the contract for the native LLM engine.
 * Currently implemented as a mock for development and testing.
 * 
 * TODO: Replace mock implementation with actual native module
 * - Android: JNI bridge to llama.cpp
 * - iOS: Swift/ObjC bridge to llama.cpp
 */

export interface GenerationOptions {
  maxNewTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
}

export interface ModelLoadOptions {
  nCtx?: number;
  nThreads?: number;
}

export interface EngineStatus {
  state: 'idle' | 'loading' | 'ready' | 'error';
  message?: string;
  modelInfo?: {
    name: string;
    size: number;
    quantization?: string;
  };
}

/**
 * Token listener callback type
 * Receives streaming tokens from the model during generation
 */
export type TokenListener = (token: string) => void;

/**
 * Main interface for the Local LLM Native Module
 */
export interface LocalLLM {
  /**
   * Load a GGUF model file into memory
   * @param path Absolute path to the .gguf model file
   * @param opts Model configuration options
   * @returns Promise that resolves to true if successful
   */
  loadModel(path: string, opts?: ModelLoadOptions): Promise<boolean>;

  /**
   * Set the system prompt for the model
   * @param prompt System prompt text
   */
  setSystemPrompt(prompt: string): Promise<void>;

  /**
   * Generate text from user input with streaming tokens
   * @param input User message
   * @param opts Generation parameters
   */
  generate(input: string, opts?: GenerationOptions): Promise<void>;

  /**
   * Stop the current generation
   */
  stop(): Promise<void>;

  /**
   * Reset the conversation context
   */
  reset(): Promise<void>;

  /**
   * Get current engine status
   */
  getStatus(): Promise<EngineStatus>;

  /**
   * Add a listener for streaming tokens
   * @param callback Function to call for each token
   * @returns Function to unsubscribe the listener
   */
  addTokenListener(callback: TokenListener): () => void;

  /**
   * Remove all token listeners
   */
  removeAllListeners(): void;
}