import type { AppState } from './types';

export const state: AppState = {
  selectedFile: null,
  cheerpjReady: false,
  consoleExpanded: false,
  processedBlob: null,
  processedFileName: null,
  webUsbSupported: false,
  adbDevice: null,
};
