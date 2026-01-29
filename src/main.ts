import { initCheerpJ } from './cheerpj';
import { checkWebUsbSupport, pushToPhone } from './adb';
import { setupFileUploadHandlers } from './file-handling';
import { setupConsoleHandlers } from './console';
import { setupProcessButton } from './processor';
import { dom } from './dom';

// Initialize on page load
window.addEventListener('load', async () => {
  console.log('Initializing WebApkMerge...');
  
  // Check WebUSB support
  checkWebUsbSupport();
  
  // Initialize CheerpJ
  const cheerpjInitPromise = initCheerpJ();
  
  // Setup event handlers
  setupFileUploadHandlers();
  setupConsoleHandlers();
  setupProcessButton();
  
  // Push to phone button handler
  dom.pushToPhoneBtn.addEventListener('click', async () => {
    await pushToPhone();
  });

  await cheerpjInitPromise;
  dom.uploadAreaWaiting.classList.add('hidden');
  dom.uploadArea.classList.remove('hidden');
});
