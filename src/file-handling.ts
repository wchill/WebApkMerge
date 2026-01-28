import { state } from './state';
import { dom } from './dom';
import { showStatus } from './ui';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function handleFileSelect(file: File): void {
  // Validate file type
  const validExtensions = ['.apkm', '.xapk', '.apks'];
  const fileName = file.name.toLowerCase();
  const isValid = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!isValid) {
    showStatus('Invalid file type. Please select an APKM, XAPK, or APKS file.', 'error');
    return;
  }
  
  state.selectedFile = file;
  
  // Display file info
  dom.fileName.textContent = file.name;
  dom.fileSize.textContent = formatFileSize(file.size);
  dom.fileInfo.classList.add('show');
  
  // Enable process button if CheerpJ is ready
  dom.processBtn.disabled = !state.cheerpjReady;
  
  console.log('File selected:', file.name, formatFileSize(file.size));
}

export function setupFileUploadHandlers(): void {
  // Click handler
  dom.uploadArea.addEventListener('click', () => dom.fileInput.click());

  // Keyboard support for upload area
  dom.uploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dom.fileInput.click();
    }
  });

  // Drag and drop handlers
  dom.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.uploadArea.classList.add('dragover');
  });

  dom.uploadArea.addEventListener('dragleave', () => {
    dom.uploadArea.classList.remove('dragover');
  });

  dom.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  // File input change handler
  dom.fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleFileSelect(target.files[0]);
    }
  });
}
