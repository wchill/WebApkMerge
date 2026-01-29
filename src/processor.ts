import { state } from './state';
import { dom } from './dom';
import { 
  showStatus, 
  showProgress, 
  hideProgress, 
  updateProgress, 
  showConsole, 
  appendToConsole 
} from './ui';
import { 
  cheerpjWriteFile, 
  cheerpjReadFileAsBlob,
  cheerpjCopyFromStrToFiles,
} from './cheerpj';
import { formatFileSize } from './file-handling';

export async function processFile(file: File): Promise<void> {
  showStatus('Processing file...', 'info');
  showProgress();
  updateProgress(20);
  
  // Show and clear console, auto-expand it
  showConsole();
  dom.consoleBody.innerHTML = '';
  state.consoleExpanded = true;
  dom.consoleBody.classList.add('show');
  dom.consoleToggle.classList.add('expanded');
  dom.consoleHeader.setAttribute('aria-expanded', 'true');
  appendToConsole('=== Starting APKEditor Process ===', 'info');
  appendToConsole(`Input file: ${file.name} (${formatFileSize(file.size)})`, 'info');

  try {
    // Create virtual file system paths
    // Input file goes to /str/ (JavaScript writes here, Java reads from here)
    const tempPath = '/str/' + file.name;
    const inputPath = '/files/' + file.name;
    const outputFileName = file.name.replace(/\.(apkm|xapk|apks)$/i, '_merged.apk');
    // Output file goes to /files/ (Java writes here, JavaScript reads from here)
    const outputPath = '/files/' + outputFileName;
    
    updateProgress(30);
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    
    updateProgress(40);
    showStatus('Writing file to virtual filesystem...', 'info');
    appendToConsole('Writing file to virtual filesystem...', 'info');
    
    // Write input file to CheerpJ /str/ virtual filesystem
    // No need to create directories for /str/ - it's automatically available
    // Write the file data to virtual filesystem
    await cheerpjWriteFile(tempPath, fileData);
    await cheerpjCopyFromStrToFiles(tempPath, inputPath);
    appendToConsole(`File written to: ${inputPath}`, 'stdout');
    
    updateProgress(50);
    showStatus('Running APKEditor...', 'info');
    appendToConsole(`Executing: java -jar APKEditor.jar m -i ${inputPath} -o ${outputPath}`, 'info');
    
    // Run the Java application
    // Command: java -jar /app/APKEditor.jar m -i <input> -o <output>
    const result = await window.cheerpjRunJar('/app/APKEditor-1.4.7.jar',
      'm', '-i', inputPath, '-o', outputPath);
    
    updateProgress(70);
    
    if (result !== 0) {
      appendToConsole(`APKEditor exited with code: ${result}`, 'stderr');
      throw new Error(`APKEditor exited with code ${result}`);
    }
    
    appendToConsole(`APKEditor completed successfully (exit code: ${result})`, 'stdout');
    
    showStatus('Reading processed file...', 'info');
    updateProgress(80);
    appendToConsole('Reading processed file from virtual filesystem...', 'info');
    
    // Read the output file from virtual filesystem
    const outputBlob = await cheerpjReadFileAsBlob(outputPath);
    appendToConsole(`Output file read: ${outputPath}`, 'stdout');
    
    // Store the blob and filename for ADB push later
    state.processedBlob = outputBlob;
    state.processedFileName = outputFileName;
    
    updateProgress(90);
    showStatus('Preparing download...', 'info');
    
    // Create download link
    const url = URL.createObjectURL(outputBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    updateProgress(100);
    showStatus('File processed and downloaded successfully!', 'success');
    appendToConsole(`=== Process Complete: ${outputFileName} downloaded ===`, 'info');
    
    // Enable push to phone button if WebUSB is supported
    if (state.webUsbSupported) {
      dom.pushToPhoneBtn.classList.add('show');
      dom.pushToPhoneBtn.disabled = false;
      appendToConsole('Push to Phone button enabled', 'info');
    }
    
    // Hide progress after a delay
    setTimeout(hideProgress, 2000);
    
  } catch (error) {
    const err = error as Error;
    let errorMessage = 'Error processing file: ' + err.message;
    
    // Provide more helpful error messages for common issues
    if (err.message.includes('not loaded')) {
      errorMessage = 'CheerpJ not initialized. Please refresh the page and try again.';
    } else if (err.message.includes('exited with code')) {
      errorMessage = 'APKEditor failed to process the file. Please ensure it is a valid APK bundle file.';
    } else if (err.message.includes('filesystem')) {
      errorMessage = 'Failed to access virtual filesystem. This may be a browser compatibility issue.';
    }
    
    showStatus(errorMessage, 'error');
    appendToConsole('=== ERROR ===', 'stderr');
    appendToConsole(err.message, 'stderr');
    if (err.stack) {
      appendToConsole(err.stack, 'stderr');
    }
    hideProgress();
    console.error('Processing error:', error);
  }
}

export function setupProcessButton(): void {
  dom.processBtn.addEventListener('click', async () => {
    if (!state.selectedFile || !state.cheerpjReady) {
      showStatus('Please select a file and wait for initialization', 'error');
      return;
    }
    
    dom.processBtn.disabled = true;
    await processFile(state.selectedFile);
    dom.processBtn.disabled = false;
  });
}
