// Import ya-webadb libraries
import { Adb } from 'https://esm.sh/@yume-chan/adb@0.0.24';
import { AdbDaemonWebUsbDeviceManager } from 'https://esm.sh/@yume-chan/adb-daemon-webusb@0.0.24';
import { ConsumableWritableStream } from 'https://esm.sh/@yume-chan/stream-extra@0.0.24';

// State management
let selectedFile = null;
let cheerpjReady = false;
let consoleExpanded = false;
let processedBlob = null;
let processedFileName = null;
let webUsbSupported = false;
let adbDevice = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const processBtn = document.getElementById('processBtn');
const pushToPhoneBtn = document.getElementById('pushToPhoneBtn');
const status = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const consoleContainer = document.getElementById('consoleContainer');
const consoleHeader = document.getElementById('consoleHeader');
const consoleBody = document.getElementById('consoleBody');
const consoleToggle = document.getElementById('consoleToggle');
const consoleClearBtn = document.getElementById('consoleClearBtn');
const consoleCopyBtn = document.getElementById('consoleCopyBtn');

// Initialize CheerpJ
async function initCheerpJ() {
    showStatus('Initializing CheerpJ runtime...', 'info');
    updateProgress(10);
    
    try {
        // Check if CheerpJ is loaded
        if (typeof cheerpjInit === 'undefined') {
            throw new Error('CheerpJ library not loaded. Please check your internet connection.');
        }
        
        await cheerpjInit();
        cheerpjReady = true;
        showStatus('CheerpJ ready! Select a file to begin.', 'success');
        hideProgress();
        console.log('CheerpJ initialized successfully');
    } catch (error) {
        showStatus('Failed to initialize CheerpJ: ' + error.message, 'error');
        hideProgress();
        console.error('CheerpJ initialization error:', error);
    }
}

// Check WebUSB support
function checkWebUsbSupport() {
    if ('usb' in navigator) {
        webUsbSupported = true;
        console.log('WebUSB is supported');
    } else {
        webUsbSupported = false;
        console.log('WebUSB is not supported');
        // Add a note that ADB push won't be available
        if (pushToPhoneBtn) {
            pushToPhoneBtn.title = 'WebUSB not supported in this browser';
        }
    }
}

// File upload handlers
uploadArea.addEventListener('click', () => fileInput.click());

// Add keyboard support for upload area
uploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// Handle file selection
function handleFileSelect(file) {
    // Validate file type
    const validExtensions = ['.apk', '.xapk', '.apks'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
        showStatus('Invalid file type. Please select an APK, XAPK, or APKS file.', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Display file info
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.add('show');
    
    // Enable process button if CheerpJ is ready
    processBtn.disabled = !cheerpjReady;
    
    console.log('File selected:', file.name, formatFileSize(file.size));
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Process file button handler
processBtn.addEventListener('click', async () => {
    if (!selectedFile || !cheerpjReady) {
        showStatus('Please select a file and wait for initialization', 'error');
        return;
    }
    
    processBtn.disabled = true;
    await processFile(selectedFile);
    processBtn.disabled = false;
});

// Process file with CheerpJ
async function processFile(file) {
    showStatus('Processing file...', 'info');
    showProgress();
    updateProgress(20);
    
    // Show and clear console, auto-expand it
    showConsole();
    clearConsole();
    consoleExpanded = true;
    consoleBody.classList.add('show');
    consoleToggle.classList.add('expanded');
    consoleHeader.setAttribute('aria-expanded', 'true');
    appendToConsole('=== Starting APKEditor Process ===', 'info');
    appendToConsole(`Input file: ${file.name} (${formatFileSize(file.size)})`, 'info');
    
    try {
        // Create virtual file system paths
        const inputPath = '/files/input/' + file.name;
        const outputFileName = file.name.replace(/\.(apk|xapk|apks)$/i, '_merged.apk');
        const outputPath = '/files/output/' + outputFileName;
        
        updateProgress(30);
        
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);
        
        updateProgress(40);
        showStatus('Writing file to virtual filesystem...', 'info');
        appendToConsole('Writing file to virtual filesystem...', 'info');
        
        // Write input file to CheerpJ virtual filesystem
        await cheerpjCreateDirectory('/files');
        await cheerpjCreateDirectory('/files/input');
        await cheerpjCreateDirectory('/files/output');
        
        // Write the file data to virtual filesystem
        await cheerpjWriteFile(inputPath, fileData);
        appendToConsole(`File written to: ${inputPath}`, 'stdout');
        
        updateProgress(50);
        showStatus('Running APKEditor...', 'info');
        appendToConsole(`Executing: java -jar /app/APKEditor.jar m -i ${inputPath} -o ${outputPath}`, 'info');
        
        // Run the Java application
        // Command: java -jar /app/APKEditor.jar m -i <input> -o <output>
        const result = await cheerpjRunJar('/app/APKEditor.jar', 
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
        processedBlob = outputBlob;
        processedFileName = outputFileName;
        
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
        if (webUsbSupported) {
            pushToPhoneBtn.classList.add('show');
            pushToPhoneBtn.disabled = false;
            appendToConsole('Push to Phone button enabled', 'info');
        }
        
        // Hide progress after a delay
        setTimeout(hideProgress, 2000);
        
    } catch (error) {
        let errorMessage = 'Error processing file: ' + error.message;
        
        // Provide more helpful error messages for common issues
        if (error.message.includes('not loaded')) {
            errorMessage = 'CheerpJ not initialized. Please refresh the page and try again.';
        } else if (error.message.includes('exited with code')) {
            errorMessage = 'APKEditor failed to process the file. Please ensure it is a valid APK file.';
        } else if (error.message.includes('filesystem')) {
            errorMessage = 'Failed to access virtual filesystem. This may be a browser compatibility issue.';
        }
        
        showStatus(errorMessage, 'error');
        appendToConsole('=== ERROR ===', 'stderr');
        appendToConsole(error.message, 'stderr');
        if (error.stack) {
            appendToConsole(error.stack, 'stderr');
        }
        hideProgress();
        console.error('Processing error:', error);
    }
}

// ADB Push functionality
async function pushToPhone() {
    if (!processedBlob || !processedFileName) {
        showStatus('No processed file available to push', 'error');
        return;
    }

    pushToPhoneBtn.disabled = true;
    showConsole();
    appendToConsole('=== Starting ADB Push to Phone ===', 'info');
    showStatus('Connecting to device...', 'info');
    showProgress();
    updateProgress(10);

    try {
        // Request USB device
        appendToConsole('Requesting USB device access...', 'info');
        const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
        const devices = await manager.getDevices();
        
        let device;
        if (devices.length === 0) {
            appendToConsole('No devices found, requesting device selection...', 'info');
            device = await manager.requestDevice();
        } else {
            device = devices[0];
            appendToConsole(`Found device: ${device.serial}`, 'stdout');
        }

        updateProgress(20);
        
        // Connect to device
        appendToConsole('Connecting to device...', 'info');
        const connection = await device.connect();
        
        updateProgress(30);
        
        // Authenticate
        appendToConsole('Authenticating with device...', 'info');
        const transport = await connection.createTransport();
        adbDevice = await Adb.authenticate(transport);
        
        appendToConsole(`Connected to device: ${device.serial}`, 'stdout');
        updateProgress(40);
        
        // Prepare file for push
        const devicePath = `/data/local/tmp/${processedFileName}`;
        appendToConsole(`Target path: ${devicePath}`, 'info');
        
        updateProgress(50);
        showStatus('Pushing file to device...', 'info');
        appendToConsole('Starting file transfer...', 'info');
        
        // Convert blob to stream
        const fileStream = processedBlob.stream();
        
        // Create sync service and push file
        const sync = await adbDevice.sync();
        updateProgress(60);
        
        // Push the file
        appendToConsole(`Pushing ${processedFileName} to ${devicePath}...`, 'stdout');
        await sync.write(
            devicePath,
            fileStream,
            0o644, // file permissions
            processedBlob.size,
            (progress) => {
                const percent = Math.floor((progress / processedBlob.size) * 100);
                updateProgress(60 + (percent * 0.3)); // 60-90% range for transfer
                if (percent % 10 === 0) {
                    appendToConsole(`Transfer progress: ${percent}%`, 'stdout');
                }
            }
        );
        
        await sync.close();
        updateProgress(95);
        
        appendToConsole(`File pushed successfully to ${devicePath}`, 'stdout');
        appendToConsole('=== ADB Push Complete ===', 'info');
        
        updateProgress(100);
        showStatus('File pushed to phone successfully!', 'success');
        
        setTimeout(() => {
            hideProgress();
        }, 2000);
        
    } catch (error) {
        appendToConsole('=== ADB PUSH ERROR ===', 'stderr');
        appendToConsole(error.message, 'stderr');
        if (error.stack) {
            appendToConsole(error.stack, 'stderr');
        }
        
        let errorMessage = 'Failed to push file to phone: ' + error.message;
        
        if (error.message.includes('No device selected')) {
            errorMessage = 'No device selected. Please connect your phone and try again.';
        } else if (error.message.includes('denied')) {
            errorMessage = 'USB access denied. Please grant permission and try again.';
        }
        
        showStatus(errorMessage, 'error');
        hideProgress();
        console.error('ADB Push error:', error);
    } finally {
        pushToPhoneBtn.disabled = false;
    }
}

// Push to phone button handler
pushToPhoneBtn.addEventListener('click', async () => {
    await pushToPhone();
});

// Helper function to create directory in CheerpJ filesystem
async function cheerpjCreateDirectory(path) {
    try {
        // CheerpJ 3.0 automatically creates parent directories when needed
        // This is a placeholder for compatibility
        console.log('Directory will be created automatically:', path);
    } catch (error) {
        console.log('Directory creation note:', error.message);
    }
}

// Helper function to write file to CheerpJ filesystem
async function cheerpjWriteFile(path, fileData) {
    // This is a placeholder for CheerpJ 3.0 file writing API
    // The actual implementation should use CheerpJ's filesystem API
    // Example: await cheerpOSAddFile(path, fileData);
    
    if (typeof cheerpOSAddFile === 'undefined') {
        throw new Error('CheerpJ filesystem API not available. File write operation cannot be completed.');
    }
    
    console.log('Writing file to:', path, 'Size:', fileData.length, 'bytes');
    // Actual implementation:
    // await cheerpOSAddFile(path, fileData);
}

// Helper function to read file from CheerpJ filesystem as Blob
async function cheerpjReadFileAsBlob(path) {
    // This is a placeholder for CheerpJ 3.0 file reading API
    // The actual implementation should use CheerpJ's filesystem API
    // Example: return await cheerpOSReadFileAsBlob(path);
    
    if (typeof cheerpOSReadFileAsBlob === 'undefined') {
        throw new Error('CheerpJ filesystem API not available. File read operation cannot be completed.');
    }
    
    console.log('Reading file from:', path);
    // Actual implementation:
    // return await cheerpOSReadFileAsBlob(path);
    
    // Placeholder - this will be replaced by actual CheerpJ API call
    throw new Error('CheerpJ filesystem not fully initialized');
}

// UI helper functions
function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status show ' + type;
}

function showProgress() {
    progressBar.classList.add('show');
}

function hideProgress() {
    progressBar.classList.remove('show');
    updateProgress(0);
}

function updateProgress(percent) {
    progressFill.style.width = percent + '%';
    progressBar.setAttribute('aria-valuenow', percent);
}

// Console functions
function showConsole() {
    consoleContainer.classList.add('show');
}

function hideConsole() {
    consoleContainer.classList.remove('show');
}

function toggleConsole() {
    consoleExpanded = !consoleExpanded;
    consoleBody.classList.toggle('show', consoleExpanded);
    consoleToggle.classList.toggle('expanded', consoleExpanded);
    consoleHeader.setAttribute('aria-expanded', consoleExpanded.toString());
}

function appendToConsole(message, type = 'stdout') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = message;
    consoleBody.appendChild(line);
    
    // Auto-scroll to bottom only if console is expanded
    if (consoleExpanded) {
        consoleBody.scrollTop = consoleBody.scrollHeight;
    }
}

function clearConsole() {
    consoleBody.innerHTML = '';
}

async function copyConsoleToClipboard() {
    try {
        // Get all console lines
        const lines = consoleBody.querySelectorAll('.console-line');
        const text = Array.from(lines).map(line => line.textContent).join('\n');
        
        if (!text) {
            showStatus('Console is empty, nothing to copy', 'info');
            return;
        }
        
        // Copy to clipboard
        await navigator.clipboard.writeText(text);
        
        // Show feedback
        consoleCopyBtn.textContent = '✓ Copied!';
        consoleCopyBtn.classList.add('copied');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            consoleCopyBtn.textContent = 'Copy';
            consoleCopyBtn.classList.remove('copied');
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showStatus('Failed to copy to clipboard', 'error');
    }
}

// Console event listeners
consoleHeader.addEventListener('click', toggleConsole);

// Add keyboard support for console header
consoleHeader.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleConsole();
    }
});

consoleClearBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent toggle when clicking clear
    clearConsole();
});

consoleCopyBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent toggle when clicking copy
    copyConsoleToClipboard();
});

// Initialize on page load
window.addEventListener('load', () => {
    console.log('Initializing WebApkMerge...');
    checkWebUsbSupport();
    initCheerpJ();
});
