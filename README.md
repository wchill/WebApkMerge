# WebApkMerge

A web application that wraps the APKEditor Java command-line tool using CheerpJ, allowing users to process APK files directly in their browser.

## Features

- 📁 **File Upload**: Drag and drop or click to select APK, XAPK, or APKS files
- 🚀 **Browser-based Processing**: Runs Java applications directly in the browser using CheerpJ
- 💾 **Easy Download**: Automatically downloads the processed file
- 📱 **Push to Phone**: Copy merged APK directly to your Android device via WebUSB
  - Uses ya-webadb for ADB connection through the browser
  - Automatically detects WebUSB support
  - Pushes APK to `/data/local/tmp/` on your device
  - Shows real-time transfer progress
  - Only available in browsers that support WebUSB (Chrome, Edge)
- 🎨 **Modern UI**: Clean and intuitive user interface
- 🖥️ **Terminal Console**: View real-time output from APKEditor processing
  - Hidden by default, automatically shown and expanded during processing
  - Collapsible interface with click-to-expand header
  - Color-coded output (info, stdout, stderr)
  - Copy button to copy all output to clipboard for error reporting
  - Clear button to reset console output
  - Auto-scrolls to show latest messages
  - Full keyboard accessibility

## How It Works

1. The application uses [CheerpJ](https://leaningtech.com/cheerpj/) to run Java applications in the browser
2. Users select an APK file through the web interface
3. The file is written to CheerpJ's virtual filesystem
4. APKEditor.jar processes the file (merge operation)
5. The processed file is read from the virtual filesystem and downloaded

## Setup

### Prerequisites

- A web server to host the files (e.g., Apache, Nginx, or a simple HTTP server)
- The `APKEditor.jar` file must be available at `/app/APKEditor.jar` on your web server

### Deployment

1. Clone this repository
2. Place the `APKEditor.jar` file in the `/app/` directory on your web server
3. Serve the `index.html` file from your web server
4. Open the application in a modern web browser

### Local Testing

For local testing, you can use Python's built-in HTTP server:

```bash
# In the repository directory
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

**Note**: You'll need to ensure `APKEditor.jar` is available at the correct path for the application to work properly.

## Usage

1. Open the web application in your browser
2. Wait for CheerpJ to initialize (you'll see a status message)
3. Click the upload area or drag and drop an APK file
4. Click the "Process File" button
5. Wait for processing to complete
6. The processed file will automatically download

### Push to Phone (WebUSB)

After processing your APK, you can push it directly to your Android device:

1. **Enable USB Debugging** on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings > Developer Options
   - Enable "USB Debugging"
2. Connect your Android device to your computer via USB
3. Click the **"📱 Push to Phone"** button (appears after processing)
4. Select your device from the browser's USB device picker
5. The APK will be pushed to `/data/local/tmp/` on your device
6. You can then install it using a file manager or `adb install`

**Requirements:**
- WebUSB-compatible browser (Chrome 61+, Edge 79+, Opera 48+)
- USB debugging enabled on Android device
- USB connection between computer and device

**Note:** If the "Push to Phone" button doesn't appear, your browser may not support WebUSB.

### Console Output

The application includes a terminal-like console that displays output from the APKEditor processing:

- **Hidden by default**: The console only appears when you start processing a file
- **Auto-expands**: The console automatically expands when processing starts to show output
- **Expand/Collapse**: Click the console header (or press Enter/Space when focused) to toggle between collapsed and expanded views
- **Color-coded messages**:
  - Cyan: Informational messages about process steps
  - Blue: Standard output from APKEditor
  - Red: Error messages
- **Copy button**: Click "Copy" to copy all console output to clipboard for error reporting
- **Clear button**: Click "Clear" to reset the console output
- **Auto-scroll**: The console automatically scrolls to show the latest output
- **Keyboard accessible**: Use Tab to focus the console header, then Enter or Space to expand/collapse

## Technical Details

### CheerpJ Integration

The application uses CheerpJ 3.0 to run the Java JAR file directly in the browser. CheerpJ creates a virtual filesystem where input and output files are managed.

**Note**: The CheerpJ integration requires proper implementation of the virtual filesystem API. The current implementation includes placeholders for:
- File system operations (reading/writing files)
- Directory creation
- JAR execution

These operations need to be implemented according to the CheerpJ 3.0 API documentation for full functionality.

### File Processing Flow

```
User selects file → 
Write to /files/input/ → 
Run APKEditor.jar → 
Read from /files/output/ → 
Download processed file
```

### Browser Compatibility

**General Features:**
- Modern browsers with WebAssembly support
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

**Push to Phone Feature (WebUSB):**
- Chrome 61+
- Edge 79+
- Opera 48+
- **Not supported:** Firefox, Safari (WebUSB not implemented)

## License

This project is provided as-is for demonstration purposes.