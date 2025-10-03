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
  echo(options: { value: string;}): Promise<{ value: string;}>
}

export const ModelImporter = registerPlugin<ModelImporterPlugin>('ModelImporter');

export async function eco(){
return ModelImporter.echo({value:"hola david"})
}

/**
 * Importa un modelo .gguf por streaming (sin cargar en memoria)
 */

export async function importarModeloPorStreaming(
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {

  let progressListener: PluginListenerHandle | undefined;

  // if (onProgress) {
  //   progressListener = await ModelImporter.addListener('importProgress', (data: ImportProgress) => {
  //     onProgress(data);
  //   });
  // }

  try {
    const res = await FilePicker.pickFiles({
      readData: false, // ✅ NO cargar archivo en memoria
      types: ['application/octet-stream', 'application/*', '*/*'],
    });

    if (!res.files?.length) throw new Error('No se seleccionó archivo');

    const f = res.files[0];
    const uri = (f as any).path ?? (f as any).uri;
    const fileName = f.name ?? 'model.gguf';
    if (!uri) throw new Error('No se pudo obtener URI del archivo');

    // Llama al plugin nativo
    return await ModelImporter.importFromUri({ uri, fileName });

  } finally {
    if (progressListener) await progressListener.remove();
  }
}
