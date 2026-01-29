import { state } from './state';
import { showStatus, hideProgress } from './ui';

declare global {
  interface Window {
    cheerpjInit(options?: {
      version?: number;
      status?: "splash" | "none" | "default";
      logCanvasUpdates?: boolean;
      preloadResources?: { [key: string]: number[] };
      preloadProgress?: (preloadDone: number, preloadTotal: number) => void;
      clipboardMode?: "permission" | "system" | "java";
      beepCallback?: () => void;
      enableInputMethods?: boolean;
      overrideShortcuts?: (evt: KeyboardEvent) => boolean;
      appletParamFilter?: (originalName: string, paramValue: string) => string;
      natives?: { [method: string]: Function };
      overrideDocumentBase?: string;
      javaProperties?: string[];
      tailscaleControlUrl?: string;
      tailscaleDnsIp?: string;
      tailscaleAuthKey?: string;
      tailscaleLoginUrlCb?: (url: string) => void;
      tailscaleIpCb?: (ip: string) => void;
      licenseKey?: string;
      execCallback?: (cmdPath: string, argsArray: string[]) => void;
      enableDebug?: boolean;
    }): Promise<void>;
    cheerpjRunLibrary: (libPath: string) => Promise<any>;
    cheerpjRunJar: (jarPath: string, ...args: string[]) => Promise<number>;
    cheerpOSAddStringFile: (path: string, data: string | Uint8Array) => void;
    cjFileBlob: (path: string) => Promise<Blob>;
  }
}

const preload = {"/lt/11/lib/modules":[0,131072,1441792,4063232,4194304,4587520,4849664,5636096,5767168,6160384,6291456,6422528,6553600,6946816,7602176,7864320,9306112,9437184,9830400,9961472,18481152,18612224,41156608,41287680,43253760,43384832],"/lt/etc/users":[0,131072],"/lt/etc/localtime":[],"/lt/11/jre/lib/cheerpj-handlers.jar":[0,131072],"/lt/11/jre/lib/cheerpj-awt.jar":[0,131072],"/lt/11/jre/lib/cheerpj-jsobject.jar":[0,131072],"/lt/11/conf/security/java.security":[0,131072],"/lt/etc/timezone":[],"/lt/11/lib/tzdb.dat":[0,131072]}

function execCb(cmdPath: string, argsArray: any) {
  console.log(`Running external command: ${cmdPath} with arguments: ${argsArray}`);
}

export async function initCheerpJ(): Promise<void> {
  showStatus('Initializing CheerpJ runtime...', 'info');
  // updateProgress is in ui module, but we don't use it here to avoid circular deps
  
  try {
    // Check if CheerpJ is loaded
    if (typeof window.cheerpjInit === 'undefined') {
      throw new Error('CheerpJ library not loaded. Please check your internet connection.');
    }

    await window.cheerpjInit({ version: 11, execCallback: execCb, preloadResources: preload });
    state.cheerpjStdlib = await window.cheerpjRunLibrary("");
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

export async function cheerpjCopyFromStrToFiles(srcPath: string, destPath: string): Promise<void> {
  const lib = state.cheerpjStdlib;
  const Files = await lib.java.nio.file.Files;
  const StandardCopyOption = await lib.java.nio.file.StandardCopyOption;
  const Paths = await lib.java.nio.file.Paths;

  const source = await Paths.get(srcPath);
  const target = await Paths.get(destPath);

  await Files.copy(source, target, [StandardCopyOption.REPLACE_EXISTING]);
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

export async function cheerpjListFiles(dir: string): Promise<string[]> {
  const lib = state.cheerpjStdlib;
  const File = await lib.java.io.File;
  const rootFile = await new File(dir);
  const files = await rootFile.listFiles();

  const retval = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    retval.push(await f.getName());
  }
  return retval;
}

export async function cheerpjDeleteFile(path: string): Promise<void> {
  const lib = state.cheerpjStdlib;
  const File = await lib.java.io.File;
  const f = await new File(path);
  await f.delete();
}
