import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Settings as SettingsIcon, Bot } from 'lucide-react';
import { useLLMStore } from '@/store/llmStore';
import LocalLLM from '@/plugins/local-llm';
import { useToast } from '@/hooks/use-toast';

const SettingsScreen = () => {
  const {
    systemPrompt,
    forceSpanish,
    engineStatus,
    setSystemPrompt,
    setForceSpanish
  } = useLLMStore();

  const { toast } = useToast();
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [isApplying, setIsApplying] = useState(false);

  const handleSavePrompt = () => {
    setSystemPrompt(localPrompt);
    toast({
      title: "Configuración guardada",
      description: "El System Prompt ha sido guardado en el dispositivo",
    });
  };

  const handleApplyToEngine = async () => {
    if (engineStatus !== 'ready') {
      toast({
        title: "Motor no disponible",
        description: "Carga un modelo primero para aplicar la configuración",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsApplying(true);
      await LocalLLM.setSystemPrompt({ prompt: localPrompt });
      setSystemPrompt(localPrompt);
      
      toast({
        title: "Configuración aplicada",
        description: "El System Prompt ha sido aplicado al motor",
      });
    } catch (error) {
      console.error('Error applying system prompt:', error);
      toast({
        title: "Error",
        description: "No se pudo aplicar la configuración al motor",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleForceSpanishChange = (checked: boolean) => {
    setForceSpanish(checked);
    toast({
      title: "Configuración actualizada",
      description: checked ? "Respuestas forzadas en español" : "Idioma libre",
    });
  };

  const resetToDefault = () => {
    const defaultPrompt = `Eres un asistente bancario que siempre responde en español, de forma breve, clara y responsable.

Ayudas con:
(1) simulación de préstamos (cuotas aproximadas)
(2) pagos y cronogramas
(3) preguntas frecuentes de banca minorista

No inventes tasas ni políticas reales; si faltan datos, pide los mínimos (monto, plazo, tasa estimada anual).
Incluye advertencias cuando des estimaciones y sugiere verificar con un asesor.`;
    
    setLocalPrompt(defaultPrompt);
    toast({
      title: "Prompt restaurado",
      description: "Se ha restaurado el prompt por defecto",
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      {/* System Prompt Configuration */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            System Prompt
          </CardTitle>
          <CardDescription>
            Define el comportamiento y personalidad del asistente AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">Instrucciones del Sistema</Label>
            <Textarea
              id="systemPrompt"
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              placeholder="Escribe las instrucciones que definirán el comportamiento del asistente..."
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Este texto se incluirá en cada conversación para guiar las respuestas del modelo
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSavePrompt}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar Localmente
            </Button>

            <Button
              onClick={handleApplyToEngine}
              disabled={engineStatus !== 'ready' || isApplying}
              className="flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <SettingsIcon className="h-4 w-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Aplicar al Motor
                </>
              )}
            </Button>

            <Button
              onClick={resetToDefault}
              variant="outline"
              className="flex items-center gap-2"
            >
              Restaurar por Defecto
            </Button>
          </div>

          {engineStatus !== 'ready' && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              💡 Carga un modelo en la sección "Modelo" para aplicar la configuración al motor
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language and Behavior Settings */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Configuración de Comportamiento
          </CardTitle>
          <CardDescription>
            Opciones adicionales para el comportamiento del asistente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="forceSpanish" className="text-base">
                Forzar respuestas en español
              </Label>
              <p className="text-sm text-muted-foreground">
                Garantiza que todas las respuestas sean en español
              </p>
            </div>
            <Switch
              id="forceSpanish"
              checked={forceSpanish}
              onCheckedChange={handleForceSpanishChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Configuración Avanzada</CardTitle>
          <CardDescription>
            Configuraciones adicionales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="text-center">
                  <h3 className="font-medium">Estado del Motor</h3>
                  <p className={`text-sm mt-1 ${
                    engineStatus === 'ready' ? 'text-status-ready' :
                    engineStatus === 'loading' ? 'text-status-loading' :
                    engineStatus === 'error' ? 'text-status-error' :
                    'text-status-idle'
                  }`}>
                    {engineStatus === 'ready' ? '✅ Listo' :
                     engineStatus === 'loading' ? '⏳ Cargando' :
                     engineStatus === 'error' ? '❌ Error' :
                     '⭕ Inactivo'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="text-center">
                  <h3 className="font-medium">Modo Offline</h3>
                  <p className="text-sm text-status-ready mt-1">
                    ✅ Sin conexión a internet
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium mb-2">💡 Consejos de Configuración:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Sé específico en las instrucciones del System Prompt</li>
              <li>• Incluye ejemplos de comportamiento deseado</li>
              <li>• Define limitaciones y responsabilidades</li>
              <li>• Recuerda que el prompt se aplicará a todas las conversaciones</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsScreen;