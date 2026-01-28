# WebApkMerge

A web application that wraps the APKEditor Java command-line tool using CheerpJ, allowing users to process APK files directly in their browser.

## Features

- 📁 **File Upload**: Drag and drop or click to select APK, XAPK, or APKS files
- 🚀 **Browser-based Processing**: Runs Java applications directly in the browser using CheerpJ
- 💾 **Easy Download**: Automatically downloads the processed file
- 🎨 **Modern UI**: Clean and intuitive user interface

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

## Technical Details

### CheerpJ Integration

The application uses CheerpJ 3.0 to run the Java JAR file directly in the browser. CheerpJ creates a virtual filesystem where input and output files are managed.

### File Processing Flow

```
User selects file → 
Write to /app/input/ → 
Run APKEditor.jar → 
Read from /app/output/ → 
Download processed file
```

### Browser Compatibility

- Modern browsers with WebAssembly support
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## License

This project is provided as-is for demonstration purposes.