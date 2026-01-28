// State management
let selectedFile = null;
let cheerpjReady = false;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const processBtn = document.getElementById('processBtn');
const status = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');

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
        
        // Write input file to CheerpJ virtual filesystem
        await cheerpjCreateDirectory('/files');
        await cheerpjCreateDirectory('/files/input');
        await cheerpjCreateDirectory('/files/output');
        
        // Write the file data to virtual filesystem
        await cheerpjWriteFile(inputPath, fileData);
        
        updateProgress(50);
        showStatus('Running APKEditor...', 'info');
        
        // Run the Java application
        // Command: java -jar /app/APKEditor.jar m -i <input> -o <output>
        const result = await cheerpjRunJar('/app/APKEditor.jar', 
            'm', '-i', inputPath, '-o', outputPath);
        
        updateProgress(70);
        
        if (result !== 0) {
            throw new Error(`APKEditor exited with code ${result}`);
        }
        
        showStatus('Reading processed file...', 'info');
        updateProgress(80);
        
        // Read the output file from virtual filesystem
        const outputBlob = await cheerpjReadFileAsBlob(outputPath);
        
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
        hideProgress();
        console.error('Processing error:', error);
    }
}

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

// Initialize on page load
window.addEventListener('load', () => {
    console.log('Initializing WebApkMerge...');
    initCheerpJ();
});
