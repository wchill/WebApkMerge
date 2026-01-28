import { state } from './state';
import { showStatus, hideProgress } from './ui';

declare global {
  interface Window {
    cheerpjInit: () => Promise<void>;
    cheerpjRunJar: (jarPath: string, ...args: string[]) => Promise<number>;
    cheerpOSAddStringFile: (path: string, data: string | Uint8Array) => void;
    cjFileBlob: (path: string) => Promise<Blob>;
  }
}

export async function initCheerpJ(): Promise<void> {
  showStatus('Initializing CheerpJ runtime...', 'info');
  // updateProgress is in ui module, but we don't use it here to avoid circular deps
  
  try {
    // Check if CheerpJ is loaded
    if (typeof window.cheerpjInit === 'undefined') {
      throw new Error('CheerpJ library not loaded. Please check your internet connection.');
    }
    
    await window.cheerpjInit();
    state.cheerpjReady = true;
    showStatus('CheerpJ ready! Select a file to begin.', 'success');
    hideProgress();
    console.log('CheerpJ initialized successfully');
  } catch (error) {
    const err = error as Error;
    showStatus('Failed to initialize CheerpJ: ' + err.message, 'error');
    hideProgress();
    console.error('CheerpJ initialization error:', error);
  }
}

// CheerpJ filesystem helper functions
export async function cheerpjCreateDirectory(path: string): Promise<void> {
  try {
    // CheerpJ 3.0 automatically creates parent directories when needed
    // This is a placeholder for compatibility
    console.log('Directory will be created automatically:', path);
  } catch (error) {
    const err = error as Error;
    console.log('Directory creation note:', err.message);
  }
}

export async function cheerpjWriteFile(path: string, fileData: Uint8Array): Promise<void> {
  // Use CheerpJ's cheerpOSAddStringFile API to write files to /str/ virtual filesystem
  // This makes the file accessible from Java code
  
  if (typeof window.cheerpOSAddStringFile === 'undefined') {
    throw new Error('CheerpJ filesystem API not available. File write operation cannot be completed.');
  }
  
  console.log('Writing file to:', path, 'Size:', fileData.length, 'bytes');
  
  // Write the file to the virtual filesystem
  // cheerpOSAddStringFile accepts both strings and Uint8Array
  window.cheerpOSAddStringFile(path, fileData);
}

export async function cheerpjReadFileAsBlob(path: string): Promise<Blob> {
  // Use CheerpJ's cjFileBlob API to read files from /files/ virtual filesystem
  // This reads files that were written by Java code
  
  if (typeof window.cjFileBlob === 'undefined') {
    throw new Error('CheerpJ filesystem API not available. File read operation cannot be completed.');
  }
  
  console.log('Reading file from:', path);
  
  // Read the file as a Blob
  const blob = await window.cjFileBlob(path);
  return blob;
}
