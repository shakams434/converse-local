import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LLMState {
  // Model Management
  modelPath: string | null;
  modelSize: number | null;
  engineStatus: EngineStatus;
  statusMessage?: string;
  
  // Model Configuration
  nCtx: number;
  nThreads: number;
  
  // System Configuration
  systemPrompt: string;
  forceSpanish: boolean;
  
  // Chat State
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  
  // Actions
  setModelPath: (path: string | null) => void;
  setModelSize: (size: number | null) => void;
  setEngineStatus: (status: EngineStatus, message?: string) => void;
  setModelConfig: (config: { nCtx?: number; nThreads?: number }) => void;
  setSystemPrompt: (prompt: string) => void;
  setForceSpanish: (force: boolean) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastAssistantChunk: (chunk: string) => void;
  setIsGenerating: (generating: boolean) => void;
  resetChat: () => void;
}

const DEFAULT_SYSTEM_PROMPT = `Eres un asistente bancario que siempre responde en español, de forma breve, clara y responsable.

Ayudas con:
(1) simulación de préstamos (cuotas aproximadas)
(2) pagos y cronogramas
(3) preguntas frecuentes de banca minorista

No inventes tasas ni políticas reales; si faltan datos, pide los mínimos (monto, plazo, tasa estimada anual).
Incluye advertencias cuando des estimaciones y sugiere verificar con un asesor.`;

export const useLLMStore = create<LLMState>()(
  persist(
    (set, get) => ({
      // Initial state
      modelPath: null,
      modelSize: null,
      engineStatus: 'idle',
      statusMessage: undefined,
      nCtx: 1024,
      nThreads: 4,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      forceSpanish: true,
      chatMessages: [],
      isGenerating: false,

      // Actions
      setModelPath: (path) => set({ modelPath: path }),
      
      setModelSize: (size) => set({ modelSize: size }),
      
      setEngineStatus: (status, message) => 
        set({ engineStatus: status, statusMessage: message }),
      
      setModelConfig: (config) => 
        set((state) => ({ 
          nCtx: config.nCtx ?? state.nCtx,
          nThreads: config.nThreads ?? state.nThreads 
        })),
      
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      
      setForceSpanish: (force) => set({ forceSpanish: force }),
      
      addMessage: (message) => 
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            {
              ...message,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              timestamp: new Date(),
            }
          ]
        })),
      
      updateLastAssistantChunk: (chunk) => 
        set((state) => {
          const messages = [...state.chatMessages];
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            lastMessage.text += chunk;
            return { chatMessages: messages };
          }
          
          // If no streaming message exists, create one
          return {
            chatMessages: [
              ...messages,
              {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                role: 'assistant',
                text: chunk,
                timestamp: new Date(),
                isStreaming: true,
              }
            ]
          };
        }),
      
      setIsGenerating: (generating) => {
        set({ isGenerating: generating });
        
        // When generation stops, mark the last assistant message as complete
        if (!generating) {
          set((state) => {
            const messages = [...state.chatMessages];
            const lastMessage = messages[messages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              lastMessage.isStreaming = false;
            }
            
            return { chatMessages: messages };
          });
        }
      },
      
      resetChat: () => set({ chatMessages: [], isGenerating: false }),
    }),
    {
      name: 'llm-storage',
      partialize: (state) => ({
        modelPath: state.modelPath,
        modelSize: state.modelSize,
        nCtx: state.nCtx,
        nThreads: state.nThreads,
        systemPrompt: state.systemPrompt,
        forceSpanish: state.forceSpanish,
      }),
    }
  )
);