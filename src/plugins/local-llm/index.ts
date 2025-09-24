/**
 * Local LLM Plugin Mock
 * 
 * This mock simulates a Capacitor plugin for the Local LLM engine.
 * In production, this will be replaced by actual native implementations
 * that bridge to llama.cpp on Android (JNI) and iOS (Swift/ObjC).
 * 
 * The API contract remains the same for seamless replacement.
 */

export type EngineState = 'idle' | 'loading' | 'ready' | 'error';

export interface LoadOptions {
  nCtx?: number;
  nThreads?: number;
}

export interface GenerationOptions {
  maxNewTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface EngineStatus {
  state: EngineState;
  message?: string;
  modelInfo?: {
    name: string;
    size: number;
  };
}

type TokenListener = (chunk: string) => void;

// Mock state management
let _state: EngineStatus = { state: 'idle' };
let _systemPrompt = '';
let _listeners: TokenListener[] = [];
let _generationTimer: any;
let _currentModelPath = '';

/**
 * Mock Local LLM Plugin
 * 
 * This provides the same interface that the native plugin will implement.
 * Replace this entire mock with Capacitor.registerPlugin('LocalLLM') in production.
 */
export const LocalLLM = {
  async loadModel({ path, opts }: { path: string; opts?: LoadOptions }) {
    console.log('LocalLLM Mock: Loading model', path, opts);
    
    _state = { state: 'loading', message: 'Loading model...' };
    _currentModelPath = path;
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Extract model name from path
    const modelName = path.split('/').pop() || 'unknown.gguf';
    
    _state = { 
      state: 'ready', 
      message: 'Model loaded successfully',
      modelInfo: {
        name: modelName,
        size: Math.floor(Math.random() * 5000000000) + 1000000000 // Mock size 1-6GB
      }
    };
    
    console.log('LocalLLM Mock: Model loaded', _state);
    return { ok: true };
  },

  async setSystemPrompt({ prompt }: { prompt: string }) {
    console.log('LocalLLM Mock: Setting system prompt', prompt.substring(0, 100) + '...');
    _systemPrompt = prompt;
  },

  async generate({ input, opts }: { input: string; opts?: GenerationOptions }) {
    console.log('LocalLLM Mock: Generating response for', input, opts);
    
    if (_state.state !== 'ready') {
      console.warn('LocalLLM Mock: Cannot generate, engine not ready');
      return;
    }

    // Create mock response based on system prompt
    const hasSpanishPrompt = _systemPrompt.toLowerCase().includes('español');
    const isBankingPrompt = _systemPrompt.toLowerCase().includes('bancario');
    
    let mockResponse = '';
    
    if (isBankingPrompt) {
      if (hasSpanishPrompt) {
        mockResponse = `Como asistente bancario, puedo ayudarte con tu consulta sobre "${input}". Para préstamos personales, las tasas van del 15% al 35% anual dependiendo del perfil crediticio. Para una simulación precisa, necesitaría: monto deseado, plazo en meses, y tus ingresos aproximados. Recuerda que estas son estimaciones referenciales.`;
      } else {
        mockResponse = `As a banking assistant, I can help with your query about "${input}". For personal loans, rates range from 15% to 35% annually depending on credit profile. For accurate simulation, I'd need: desired amount, term in months, and approximate income. Please note these are reference estimates.`;
      }
    } else {
      mockResponse = `Respuesta simulada del modelo local para: "${input}". El sistema está funcionando correctamente con streaming de tokens.`;
    }

    // Add system prompt context if available
    if (_systemPrompt) {
      mockResponse = `[Sistema aplicado] ${mockResponse}`;
    }

    // Split into tokens for streaming simulation
    const tokens = mockResponse.split(' ');
    let tokenIndex = 0;

    // Clear any existing generation
    clearInterval(_generationTimer);

    // Start streaming tokens
    _generationTimer = setInterval(() => {
      if (tokenIndex >= tokens.length) {
        clearInterval(_generationTimer);
        return;
      }
      
      const token = tokens[tokenIndex] + ' ';
      _listeners.forEach(listener => listener(token));
      tokenIndex++;
    }, 40); // ~25 tokens per second
  },

  async stop() {
    console.log('LocalLLM Mock: Stopping generation');
    clearInterval(_generationTimer);
  },

  async reset() {
    console.log('LocalLLM Mock: Resetting state');
    clearInterval(_generationTimer);
    // Keep model loaded but reset conversation state
  },

  async getStatus() {
    return _state;
  },

  addTokenListener(callback: TokenListener): () => void {
    _listeners.push(callback);
    return () => {
      _listeners = _listeners.filter(listener => listener !== callback);
    };
  },

  removeAllListeners() {
    _listeners = [];
  }
};

export default LocalLLM;
