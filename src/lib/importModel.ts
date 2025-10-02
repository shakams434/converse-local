import { FilePicker } from '@capawesome/capacitor-file-picker';
import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export interface ImportProgress {
  progress: number;      // 0-100
  bytesCopied: number;
  totalBytes: number;
}

export interface ImportResult {
  destPath: string;
  fileSize: number;
  fileName: string;
}

type ImportFromUriResult = ImportResult;

interface ModelImporterPlugin {
  importFromUri(options: { uri: string; fileName: string }): Promise<ImportFromUriResult>;
  addListener(
    eventName: 'importProgress',
    listenerFunc: (data: ImportProgress) => void
  ): Promise<PluginListenerHandle>;
}

export const ModelImporter = registerPlugin<ModelImporterPlugin>('ModelImporter');

/**
 * Importa un modelo .gguf por streaming (sin cargar en memoria)
 * @param onProgress Callback opcional para recibir progreso (0-100%)
 * @returns Promise con destPath, fileSize y fileName
 */
export async function importarModeloPorStreaming(
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  
  // Registrar listener de progreso si se proporciona callback
  let progressListener: any;
  if (onProgress) {
    progressListener = await ModelImporter.addListener('importProgress', (data: ImportProgress) => {
      onProgress(data);
    });
  }

  try {
    // Usar FilePicker SIN leer datos (readData: false)
    const res = await FilePicker.pickFiles({
      readData: false, // ✅ NO cargar archivo en memoria
      types: ['application/octet-stream', 'application/*', '*/*'],
    });

    if (!res.files?.length) {
      throw new Error('No se seleccionó archivo');
    }

    const f = res.files[0];
    const uri = (f as any).path ?? (f as any).uri;
    const fileName = f.name ?? 'model.gguf';

    if (!uri) {
      throw new Error('No se pudo obtener URI del archivo');
    }

    // Llamar plugin nativo para copiar por streaming
    const result = await ModelImporter.importFromUri({ uri, fileName });
    
    return result;

  } finally {
    // Limpiar listener
    if (progressListener) {
      progressListener.remove();
    }
  }
}
