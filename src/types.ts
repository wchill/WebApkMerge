export interface AppState {
  selectedFile: File | null;
  cheerpjReady: boolean;
  consoleExpanded: boolean;
  processedBlob: Blob | null;
  processedFileName: string | null;
  webUsbSupported: boolean;
  adbDevice: any | null; // Type from @yume-chan/adb
}

export type StatusType = 'info' | 'success' | 'error';
export type ConsoleLineType = 'info' | 'stdout' | 'stderr';
