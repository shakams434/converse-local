/**
 * File utilities for handling model files and storage
 * Uses Capacitor Filesystem API for native file operations
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  mimeType?: string;
}

/**
 * Get the models directory path
 */
export async function getModelsDirectory(): Promise<string> {
  try {
    // Ensure the models directory exists
    await Filesystem.mkdir({
      path: 'Models',
      directory: Directory.Documents,
      recursive: true
    });
    
    const result = await Filesystem.getUri({
      directory: Directory.Documents,
      path: 'Models'
    });
    
    return result.uri;
  } catch (error) {
    console.error('Error creating models directory:', error);
    throw error;
  }
}

/**
 * Copy a file to the models directory
 * @param sourceUri Source file URI (from document picker)
 * @param fileName Destination file name
 */
export async function copyToModelsDirectory(sourceUri: string, fileName: string): Promise<string> {
  try {
    // Read the source file
    const data = await Filesystem.readFile({
      path: sourceUri
    });
    
    // Write to models directory
    const destinationPath = `Models/${fileName}`;
    await Filesystem.writeFile({
      path: destinationPath,
      directory: Directory.Documents,
      data: data.data,
      encoding: Encoding.UTF8
    });
    
    // Get the full URI of the copied file
    const result = await Filesystem.getUri({
      directory: Directory.Documents,
      path: destinationPath
    });
    
    return result.uri;
  } catch (error) {
    console.error('Error copying file to models directory:', error);
    throw error;
  }
}

/**
 * Get file information
 */
export async function getFileInfo(filePath: string): Promise<FileInfo> {
  try {
    const stat = await Filesystem.stat({
      path: filePath
    });
    
    return {
      name: filePath.split('/').pop() || 'unknown',
      path: filePath,
      size: stat.size,
      mimeType: stat.type === 'file' ? 'application/octet-stream' : undefined
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
}

/**
 * Delete a model file
 */
export async function deleteModelFile(filePath: string): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: filePath
    });
  } catch (error) {
    console.error('Error deleting model file:', error);
    throw error;
  }
}

/**
 * List all model files in the models directory
 */
export async function listModelFiles(): Promise<FileInfo[]> {
  try {
    const result = await Filesystem.readdir({
      path: 'Models',
      directory: Directory.Documents
    });
    
    const files: FileInfo[] = [];
    
    for (const file of result.files) {
      if (file.name.endsWith('.gguf')) {
        try {
          const fullPath = `Models/${file.name}`;
          const stat = await Filesystem.stat({
            path: fullPath,
            directory: Directory.Documents
          });
          
          const uri = await Filesystem.getUri({
            directory: Directory.Documents,
            path: fullPath
          });
          
          files.push({
            name: file.name,
            path: uri.uri,
            size: stat.size,
            mimeType: 'application/octet-stream'
          });
        } catch (error) {
          console.warn(`Error getting info for file ${file.name}:`, error);
        }
      }
    }
    
    return files;
  } catch (error) {
    // Directory might not exist yet
    if ((error as any).message?.includes('does not exist')) {
      return [];
    }
    console.error('Error listing model files:', error);
    throw error;
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate if file is a GGUF model
 */
export function isValidGGUFFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.gguf');
}

/**
 * Native document picker using Capacitor FilePicker
 * Picks a .gguf file and stores it in Documents/Models/
 */
export async function pickAndStoreGguf(): Promise<FileInfo | null> {
  try {
    // For web development, use file input
    if (typeof window !== 'undefined' && !(window as any).Capacitor) {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.gguf';
        
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file && isValidGGUFFile(file.name)) {
            // For web, we'll simulate storing it
            resolve({
              name: file.name,
              path: `Documents/Models/${file.name}`,
              size: file.size,
              mimeType: file.type || 'application/octet-stream'
            });
          } else {
            resolve(null);
          }
        };
        
        input.oncancel = () => resolve(null);
        input.click();
      });
    }

    // Use Capacitor FilePicker for native platforms
    const { FilePicker } = await import('@capawesome/capacitor-file-picker');
    
    const result = await FilePicker.pickFiles({
      types: ['application/octet-stream', '*/*'],
      readData: true
    });
    
    if (!result.files || result.files.length === 0) {
      return null;
    }
    
    const file = result.files[0];
    const fileName = file.name || 'model.gguf';
    
    // Validate GGUF file
    if (!isValidGGUFFile(fileName)) {
      throw new Error('Invalid file type. Please select a .gguf file.');
    }
    
    // Ensure Models directory exists
    await getModelsDirectory();
    
    // Store file in Documents/Models/
    const destinationPath = `Models/${fileName}`;
    
    let fileData: string;
    if (file.data) {
      fileData = file.data;
    } else if (file.blob) {
      // Convert blob to base64
      fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file.blob!);
      });
    } else {
      throw new Error('No file data available');
    }
    
    await Filesystem.writeFile({
      path: destinationPath,
      data: fileData,
      directory: Directory.Documents
    });
    
    // Get the full URI of the stored file
    const uri = await Filesystem.getUri({
      directory: Directory.Documents,
      path: destinationPath
    });
    
    return {
      name: fileName,
      path: uri.uri,
      size: file.size || 0,
      mimeType: 'application/octet-stream'
    };
    
  } catch (error) {
    console.error('Error picking and storing GGUF file:', error);
    throw error;
  }
}

/**
 * Delete a model file from storage
 */
export async function deleteStoredModel(modelPath: string): Promise<void> {
  try {
    // Extract relative path from full URI if needed
    const fileName = modelPath.split('/').pop() || '';
    const relativePath = `Models/${fileName}`;
    
    await Filesystem.deleteFile({
      path: relativePath,
      directory: Directory.Documents
    });
  } catch (error) {
    console.error('Error deleting model file:', error);
    throw error;
  }
}