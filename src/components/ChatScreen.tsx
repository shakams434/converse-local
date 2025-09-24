import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Square, RotateCcw, Bot, User, AlertCircle } from 'lucide-react';
import { useLLMStore } from '@/store/llmStore';
import LocalLLM from '@/plugins/local-llm';
import { useToast } from '@/hooks/use-toast';

const ChatScreen = () => {
  const {
    chatMessages,
    isGenerating,
    engineStatus,
    systemPrompt,
    forceSpanish,
    addMessage,
    updateLastAssistantChunk,
    setIsGenerating,
    resetChat
  } = useLLMStore();

  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [tokenListener, setTokenListener] = useState<(() => void) | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Setup token listener
  useEffect(() => {
    if (isGenerating && !tokenListener) {
      const unsubscribe = LocalLLM.addTokenListener((token: string) => {
        updateLastAssistantChunk(token);
      });
      setTokenListener(() => unsubscribe);
    } else if (!isGenerating && tokenListener) {
      tokenListener();
      setTokenListener(null);
    }

    return () => {
      if (tokenListener) {
        tokenListener();
      }
    };
  }, [isGenerating, tokenListener, updateLastAssistantChunk]);

  const buildFinalPrompt = (userInput: string): string => {
    let prompt = '';
    
    if (systemPrompt.trim()) {
      prompt += `<SYSTEM>\n${systemPrompt}\n</SYSTEM>\n`;
    }
    
    prompt += `Usuario: ${userInput}\nAsistente:`;
    
    if (forceSpanish && !systemPrompt.toLowerCase().includes('español')) {
      prompt += ' (Responde siempre en español)';
    }
    
    return prompt;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;
    
    if (engineStatus !== 'ready') {
      toast({
        title: "Motor no disponible",
        description: "Carga un modelo en la sección 'Modelo' primero",
        variant: "destructive"
      });
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage({
      role: 'user',
      text: userMessage
    });

    try {
      setIsGenerating(true);
      
      // Build the final prompt combining system prompt with user input
      const finalPrompt = buildFinalPrompt(userMessage);
      
      await LocalLLM.generate({
        input: finalPrompt,
        opts: {
          maxNewTokens: 150,
          temperature: 0.7,
          topP: 0.9
        }
      });

    } catch (error) {
      console.error('Error generating response:', error);
      setIsGenerating(false);
      
      // Add error message
      addMessage({
        role: 'assistant',
        text: 'Lo siento, ocurrió un error al generar la respuesta. Por favor, intenta nuevamente.'
      });
      
      toast({
        title: "Error",
        description: "Error al generar la respuesta",
        variant: "destructive"
      });
    }
  };

  const handleStopGeneration = async () => {
    try {
      await LocalLLM.stop();
      setIsGenerating(false);
      toast({
        title: "Generación detenida",
        description: "La generación ha sido detenida",
      });
    } catch (error) {
      console.error('Error stopping generation:', error);
      toast({
        title: "Error",
        description: "No se pudo detener la generación",
        variant: "destructive"
      });
    }
  };

  const handleResetChat = async () => {
    try {
      await LocalLLM.reset();
      resetChat();
      toast({
        title: "Chat reiniciado",
        description: "El historial de conversación ha sido limpiado",
      });
    } catch (error) {
      console.error('Error resetting chat:', error);
      toast({
        title: "Error",
        description: "No se pudo reiniciar el chat",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <h2 className="font-semibold">Asistente Bancario</h2>
                <p className="text-xs text-muted-foreground">
                  {engineStatus === 'ready' ? (
                    '🟢 Motor listo'
                  ) : engineStatus === 'loading' ? (
                    '🟡 Cargando modelo...'
                  ) : engineStatus === 'error' ? (
                    '🔴 Error en el motor'
                  ) : (
                    '⚪ Motor inactivo'
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isGenerating && (
                <Button
                  onClick={handleStopGeneration}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}
              
              <Button
                onClick={handleResetChat}
                variant="outline"
                size="sm"
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          {chatMessages.length === 0 ? (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6 text-center">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">¡Hola! Soy tu asistente bancario</h3>
                <p className="text-muted-foreground mb-4">
                  Puedo ayudarte con consultas sobre préstamos, pagos y servicios bancarios.
                  Escribe tu pregunta para comenzar.
                </p>
                {engineStatus !== 'ready' && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    Carga un modelo en la sección "Modelo" para comenzar a chatear
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl relative ${
                    message.role === 'user'
                      ? 'chat-bubble-user text-user-message-foreground ml-12'
                      : message.role === 'assistant'
                      ? 'chat-bubble-assistant text-assistant-message-foreground mr-12'
                      : 'chat-bubble-system text-accent-foreground'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-user-message-foreground/20'
                        : 'bg-assistant-message-foreground/20'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        {message.isStreaming && (
                          <div className="typing-indicator inline-flex gap-1 ml-1">
                            <span className="w-1 h-1 bg-current rounded-full"></span>
                            <span className="w-1 h-1 bg-current rounded-full"></span>
                            <span className="w-1 h-1 bg-current rounded-full"></span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs opacity-60 mt-2">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                engineStatus !== 'ready' 
                  ? "Carga un modelo para comenzar a chatear..."
                  : "Escribe tu consulta bancaria..."
              }
              disabled={isGenerating || engineStatus !== 'ready'}
              className="flex-1"
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGenerating || engineStatus !== 'ready'}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {forceSpanish && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              🌍 Respuestas forzadas en español
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;