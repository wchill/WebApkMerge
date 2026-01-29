import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { state } from './state';
import { dom } from './dom';
import { showStatus, showProgress, hideProgress, updateProgress, showConsole, appendToConsole } from './ui';

let credentialStore: AdbWebCredentialStore | null = null;

export function checkWebUsbSupport(): void {
  if ('usb' in navigator) {
    state.webUsbSupported = true;
    console.log('WebUSB is supported');
  } else {
    state.webUsbSupported = false;
    console.log('WebUSB is not supported');
    // Add a note that ADB push won't be available
    if (dom.pushToPhoneBtn) {
      dom.pushToPhoneBtn.title = 'WebUSB not supported in this browser';
    }
  }
}

async function getCredentialStore(): Promise<AdbWebCredentialStore> {
  if (!credentialStore) {
    credentialStore = new AdbWebCredentialStore();
  }
  return credentialStore;
}

export async function pushToPhone(): Promise<void> {
  if (!state.processedBlob || !state.processedFileName) {
    showStatus('No processed file available to push', 'error');
    return;
  }

  dom.pushToPhoneBtn.disabled = true;
  showConsole();
  appendToConsole('=== Starting ADB Push to Phone ===', 'info');
  showStatus('Connecting to device...', 'info');
  showProgress();
  updateProgress(10);

  try {
    if (state.adbDevice === null) {
        // Request USB device
        appendToConsole('Requesting USB device access...', 'info');
        const manager = AdbDaemonWebUsbDeviceManager.BROWSER!;
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

        if (!device) {
          throw new Error('No device selected');
        }

        // Connect to device
        appendToConsole('Connecting to device...', 'info');
        const connection = await device.connect();

        updateProgress(30);

        // Authenticate
        appendToConsole('Authenticating with device...', 'info');
        const transport = await AdbDaemonTransport.authenticate({
          serial: device.serial,
          connection,
          credentialStore: await getCredentialStore(),
        });

        state.adbDevice = new Adb(transport);

        appendToConsole(`Connected to device: ${device.serial}`, 'stdout');
    }
    updateProgress(40);
    
    // Prepare file for push
    const devicePath = `/sdcard/${state.processedFileName}`;
    appendToConsole(`Target path: ${devicePath}`, 'info');
    
    updateProgress(50);
    showStatus('Pushing file to device...', 'info');
    appendToConsole('Starting file transfer...', 'info');
    
    // Convert blob to stream
    const fileStream = state.processedBlob.stream();
    
    // Create sync service and push file
    const sync = await state.adbDevice.sync();
    updateProgress(60);

    // Push the file
    appendToConsole(`Pushing ${state.processedFileName} to ${devicePath}...`, 'stdout');
    await sync.write({
      filename: devicePath,
      file: fileStream,
      permission: 0o644, // file permissions
    });
    
    await sync.dispose();
    updateProgress(95);
    
    appendToConsole(`File pushed successfully to ${devicePath}`, 'stdout');
    appendToConsole('=== ADB Push Complete ===', 'info');
    
    updateProgress(100);
    showStatus('File pushed to phone successfully!', 'success');
    
    setTimeout(() => {
      hideProgress();
    }, 2000);
    
  } catch (error) {
    const err = error as Error;
    appendToConsole('=== ADB PUSH ERROR ===', 'stderr');
    appendToConsole(err.message, 'stderr');
    if (err.stack) {
      appendToConsole(err.stack, 'stderr');
    }
    
    let errorMessage = 'Failed to push file to phone: ' + err.message;
    
    if (err.message.includes('No device selected')) {
      errorMessage = 'No device selected. Please connect your phone and try again.';
    } else if (err.message.includes('denied')) {
      errorMessage = 'USB access denied. Please grant permission and try again.';
    }
    
    showStatus(errorMessage, 'error');
    hideProgress();
    console.error('ADB Push error:', error);
  } finally {
    dom.pushToPhoneBtn.disabled = false;
  }
}
