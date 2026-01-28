import { state } from './state';
import { showStatus, hideProgress } from './ui';

declare global {
  interface Window {
    cheerpjInit: () => Promise<void>;
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
  // This is a placeholder for CheerpJ 3.0 file writing API
  // The actual implementation should use CheerpJ's filesystem API
  // Example: await cheerpOSAddFile(path, fileData);
  
  if (typeof (window as any).cheerpOSAddFile === 'undefined') {
    throw new Error('CheerpJ filesystem API not available. File write operation cannot be completed.');
  }
  
  console.log('Writing file to:', path, 'Size:', fileData.length, 'bytes');
  // Actual implementation:
  // await cheerpOSAddFile(path, fileData);
}

export async function cheerpjReadFileAsBlob(path: string): Promise<Blob> {
  // This is a placeholder for CheerpJ 3.0 file reading API
  // The actual implementation should use CheerpJ's filesystem API
  // Example: return await cheerpOSReadFileAsBlob(path);
  
  if (typeof (window as any).cheerpOSReadFileAsBlob === 'undefined') {
    throw new Error('CheerpJ filesystem API not available. File read operation cannot be completed.');
  }
  
  console.log('Reading file from:', path);
  // Actual implementation:
  // return await cheerpOSReadFileAsBlob(path);
  
  // Placeholder - this will be replaced by actual CheerpJ API call
  throw new Error('CheerpJ filesystem not fully initialized');
}

declare global {
  interface Window {
    cheerpjRunJar: (jarPath: string, ...args: string[]) => Promise<number>;
  }
}
