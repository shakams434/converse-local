import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, Play, Square, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useLLMStore } from '@/store/llmStore';
import { localLLM } from '@/modules/local-llm';
import { pickDocument, copyToModelsDirectory, formatFileSize, isValidGGUFFile } from '@/utils/fileUtils';
import { useToast } from '@/hooks/use-toast';

const ModelManagerScreen = () => {
  const {
    modelPath,
    modelSize,
    engineStatus,
    statusMessage,
    nCtx,
    nThreads,
    setModelPath,
    setModelSize,
    setEngineStatus,
    setModelConfig
  } = useLLMStore();

  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Status color and icon mapping
  const getStatusDisplay = () => {
    switch (engineStatus) {
      case 'ready':
        return { 
          color: 'text-status-ready', 
          icon: CheckCircle, 
          bg: 'bg-status-ready/10',
          text: 'Motor Listo'
        };
      case 'loading':
        return { 
          color: 'text-status-loading', 
          icon: Loader2, 
          bg: 'bg-status-loading/10',
          text: 'Cargando...'
        };
      case 'error':
        return { 
          color: 'text-status-error', 
          icon: AlertCircle, 
          bg: 'bg-status-error/10',
          text: 'Error'
        };
      default:
        return { 
          color: 'text-status-idle', 
          icon: Square, 
          bg: 'bg-status-idle/10',
          text: 'Inactivo'
        };
    }
  };

  const handleImportModel = async () => {
    try {
      setIsImporting(true);
      
      const file = await pickDocument();
      if (!file) return;

      if (!isValidGGUFFile(file.name)) {
        toast({
          title: "Archivo inválido",
          description: "Solo se permiten archivos .gguf",
          variant: "destructive"
        });
        return;
      }

      // For web demo, we'll just set the file info directly
      // In native app, we would copy to models directory
      const finalPath = file.path;
      
      setModelPath(finalPath);
      setModelSize(file.size);
      
      toast({
        title: "Modelo importado",
        description: `${file.name} (${formatFileSize(file.size)})`,
      });

    } catch (error) {
      console.error('Error importing model:', error);
      toast({
        title: "Error",
        description: "No se pudo importar el modelo",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadModel = async () => {
    if (!modelPath) return;

    try {
      setIsLoading(true);
      setEngineStatus('loading', 'Cargando modelo en memoria...');
      
      const success = await localLLM.loadModel(modelPath, { nCtx, nThreads });
      
      if (success) {
        setEngineStatus('ready', 'Modelo cargado correctamente');
        toast({
          title: "Modelo cargado",
          description: "El motor está listo para generar respuestas",
        });
      } else {
        setEngineStatus('error', 'Error al cargar el modelo');
        toast({
          title: "Error",
          description: "No se pudo cargar el modelo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading model:', error);
      setEngineStatus('error', 'Error de comunicación con el motor');
      toast({
        title: "Error",
        description: "Error de comunicación con el motor",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModel = () => {
    setModelPath(null);
    setModelSize(null);
    setEngineStatus('idle');
    toast({
      title: "Modelo eliminado",
      description: "El modelo ha sido eliminado del dispositivo",
    });
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      {/* Model Import Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Modelo
          </CardTitle>
          <CardDescription>
            Selecciona un archivo .gguf para importar al dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleImportModel}
            disabled={isImporting}
            className="w-full"
            size="lg"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar archivo .gguf
              </>
            )}
          </Button>

          {modelPath && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{modelPath.split('/').pop()}</p>
                    <p className="text-sm text-muted-foreground">
                      {modelSize ? formatFileSize(modelSize) : 'Tamaño desconocido'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {modelPath}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteModel}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Configuración del Motor</CardTitle>
          <CardDescription>
            Parámetros optimizados para dispositivos móviles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nCtx">Contexto (nCtx)</Label>
              <Input
                id="nCtx"
                type="number"
                value={nCtx}
                onChange={(e) => setModelConfig({ nCtx: parseInt(e.target.value) || 1024 })}
                min="512"
                max="4096"
                step="512"
              />
              <p className="text-xs text-muted-foreground">
                Tamaño del contexto en tokens (512-4096)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nThreads">Hilos (nThreads)</Label>
              <Input
                id="nThreads"
                type="number"
                value={nThreads}
                onChange={(e) => setModelConfig({ nThreads: parseInt(e.target.value) || 4 })}
                min="1"
                max="8"
              />
              <p className="text-xs text-muted-foreground">
                Número de hilos de procesamiento (1-8)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engine Status and Control */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${status.color} ${engineStatus === 'loading' ? 'animate-spin' : ''}`} />
            Estado del Motor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg ${status.bg} border border-border/50`}>
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className={`h-4 w-4 ${status.color} ${engineStatus === 'loading' ? 'animate-spin' : ''}`} />
              <span className={`font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>
            {statusMessage && (
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            )}
            {engineStatus === 'loading' && (
              <Progress value={66} className="mt-2 h-2" />
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleLoadModel}
              disabled={!modelPath || isLoading || engineStatus === 'loading'}
              className="flex-1"
              variant={engineStatus === 'ready' ? 'secondary' : 'default'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {engineStatus === 'ready' ? 'Recargar Motor' : 'Cargar en Motor'}
                </>
              )}
            </Button>
          </div>

          {!modelPath && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              💡 Primero importa un modelo .gguf para poder cargarlo en el motor
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelManagerScreen;