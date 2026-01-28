# WebApkMerge

A web application that wraps the APKEditor Java command-line tool using CheerpJ, allowing users to merge APK bundles (APKM, XAPK, APKS) directly in their browser.

## Features

- 📁 **File Upload**: Drag and drop or click to select APK bundle files (APKM, XAPK, or APKS)
- 🚀 **Browser-based Processing**: Runs Java applications directly in the browser using CheerpJ
- 💾 **Easy Download**: Automatically downloads the processed file
- 📱 **Push to Phone**: Copy merged APK directly to your Android device via WebUSB
  - Uses ya-webadb for ADB connection through the browser
  - Automatically detects WebUSB support
  - Pushes APK to `/sdcard/` on your device
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

## Development

This project is built with TypeScript and bundled with Vite for optimal performance.

### Prerequisites

- Node.js 20 or higher
- npm

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
src/
├── main.ts          # Entry point
├── types.ts         # TypeScript type definitions
├── state.ts         # Application state management
├── dom.ts           # DOM element references
├── cheerpj.ts       # CheerpJ integration
├── adb.ts           # ADB/WebUSB functionality
├── file-handling.ts # File upload and validation
├── processor.ts     # File processing logic
├── console.ts       # Console UI handlers
└── ui.ts            # UI helper functions
```

## How It Works

1. The application uses [CheerpJ](https://leaningtech.com/cheerpj/) to run Java applications in the browser
2. Users select an APK bundle file (APKM, XAPK, or APKS) through the web interface
3. The file is written to CheerpJ's virtual filesystem
4. APKEditor.jar processes the file (merge operation)
5. The processed file is read from the virtual filesystem and downloaded

## Deployment

### Prerequisites

- A web server to host the files (e.g., Apache, Nginx, or GitHub Pages)
- The `APKEditor.jar` file must be available at `/app/APKEditor.jar` on your web server

### GitHub Pages Deployment

This project includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on push to the main branch.

1. Enable GitHub Pages in your repository settings
2. Set the source to "GitHub Actions"
3. Push to the main branch
4. The workflow will automatically build and deploy

### Manual Deployment

```bash
# Build the project
npm run build

# The dist/ folder contains the production build
# Upload the contents to your web server
```

### Local Testing

For local testing with the production build:

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

Or serve the dist folder with any static file server:

```bash
# Using Python
python3 -m http.server 8000 --directory dist
```

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
5. The APK will be pushed to `/sdcard/` on your device
6. You can then install it using a file manager or access it via ADB

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