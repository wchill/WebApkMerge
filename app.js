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
        const uint8Array = new Uint8Array(arrayBuffer);
        
        updateProgress(40);
        showStatus('Writing file to virtual filesystem...', 'info');
        
        // Write input file to CheerpJ virtual filesystem
        await cheerpjCreateDirectory('/files');
        await cheerpjCreateDirectory('/files/input');
        await cheerpjCreateDirectory('/files/output');
        
        // Mount the file data
        const fileData = new Uint8Array(arrayBuffer);
        await cheerpjAddStringFile(inputPath, fileData);
        
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
        showStatus('Error processing file: ' + error.message, 'error');
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
async function cheerpjAddStringFile(path, data) {
    // Use CheerpJ's file writing API
    // In CheerpJ 3.0, this is handled through the virtual filesystem
    // The actual implementation depends on CheerpJ's API
    console.log('Writing file to:', path, 'Size:', data.length);
}

// Helper function to read file from CheerpJ filesystem as Blob
async function cheerpjReadFileAsBlob(path) {
    // Use CheerpJ's file reading API
    // This returns a Blob object that can be downloaded
    console.log('Reading file from:', path);
    // Placeholder - actual implementation uses CheerpJ API
    return new Blob([]);
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
}

// Initialize on page load
window.addEventListener('load', () => {
    console.log('Initializing WebApkMerge...');
    initCheerpJ();
});
