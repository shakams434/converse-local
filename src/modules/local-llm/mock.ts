import { LocalLLM, EngineStatus, GenerationOptions, ModelLoadOptions, TokenListener } from './types';

/**
 * Mock implementation of the Local LLM Native Module
 * 
 * This provides a realistic simulation of the native module behavior
 * for development and testing purposes. It simulates:
 * - Model loading with delays
 * - Token streaming with realistic timing
 * - Status management
 * - Error conditions
 * 
 * TODO: Replace with actual native implementation
 */

class MockLocalLLM implements LocalLLM {
  private status: EngineStatus = { state: 'idle' };
  private listeners: Set<TokenListener> = new Set();
  private currentGeneration: NodeJS.Timeout | null = null;
  private isGenerating = false;
  private systemPrompt = '';
  private modelPath = '';

  async loadModel(path: string, opts?: ModelLoadOptions): Promise<boolean> {
    this.status = { state: 'loading', message: 'Cargando modelo...' };
    this.modelPath = path;
    
    // Simulate loading delay
    await this.delay(2000 + Math.random() * 1000);
    
    // Extract model name from path
    const modelName = path.split('/').pop() || 'unknown-model.gguf';
    const simulatedSize = Math.floor(Math.random() * 7000) + 1000; // 1-8GB
    
    this.status = {
      state: 'ready',
      message: 'Modelo cargado correctamente',
      modelInfo: {
        name: modelName,
        size: simulatedSize,
        quantization: 'Q4_K_M'
      }
    };
    
    console.log('[MockLLM] Model loaded:', { path, opts, modelName, size: simulatedSize });
    return true;
  }

  async setSystemPrompt(prompt: string): Promise<void> {
    this.systemPrompt = prompt;
    console.log('[MockLLM] System prompt set:', prompt.substring(0, 100) + '...');
    await this.delay(100);
  }

  async generate(input: string, opts?: GenerationOptions): Promise<void> {
    if (this.status.state !== 'ready') {
      throw new Error('Model not ready. Load a model first.');
    }

    if (this.isGenerating) {
      throw new Error('Generation already in progress. Call stop() first.');
    }

    this.isGenerating = true;
    console.log('[MockLLM] Starting generation:', { input, opts });

    // Simulate realistic banking assistant responses
    const responses = [
      "Perfecto, entiendo que necesitas ayuda con información bancaria. ",
      "Para calcular las cuotas de un préstamo, necesito algunos datos: el monto que deseas solicitar, el plazo en meses y la tasa de interés estimada. ",
      "Como ejemplo, si solicitas $100,000 a 24 meses con una tasa del 15% anual, la cuota mensual aproximada sería de $4,850. ",
      "**Importante**: Esta es solo una estimación. Las tasas reales pueden variar según tu perfil crediticio y las políticas del banco. ",
      "Te recomiendo consultar con un asesor especializado para obtener información precisa y actualizada sobre nuestros productos financieros. ",
      "¿Hay algún monto específico o plazo que tengas en mente?"
    ];

    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    const words = selectedResponse.split(' ');
    
    // Stream words with realistic timing
    for (let i = 0; i < words.length && this.isGenerating; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      
      this.listeners.forEach(listener => {
        try {
          listener(word);
        } catch (error) {
          console.error('[MockLLM] Listener error:', error);
        }
      });
      
      // Variable delay to simulate realistic generation
      const delay = Math.random() * 150 + 50; // 50-200ms per word
      await this.delay(delay);
    }

    this.isGenerating = false;
    console.log('[MockLLM] Generation completed');
  }

  async stop(): Promise<void> {
    if (this.currentGeneration) {
      clearTimeout(this.currentGeneration);
      this.currentGeneration = null;
    }
    this.isGenerating = false;
    console.log('[MockLLM] Generation stopped');
  }

  async reset(): Promise<void> {
    await this.stop();
    console.log('[MockLLM] Context reset');
    await this.delay(200);
  }

  async getStatus(): Promise<EngineStatus> {
    return { ...this.status };
  }

  addTokenListener(callback: TokenListener): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.currentGeneration = setTimeout(resolve, ms);
    });
  }
}

// Singleton instance for the mock
export const mockLocalLLM = new MockLocalLLM();

/**
 * Factory function to get the LLM instance
 * In production, this would return the actual native module
 * For now, it returns the mock implementation
 */
export function createLocalLLM(): LocalLLM {
  // TODO: Detect if running on native platform and return actual implementation
  // if (Platform.OS === 'ios' || Platform.OS === 'android') {
  //   return NativeLocalLLM;
  // }
  
  return mockLocalLLM;
}