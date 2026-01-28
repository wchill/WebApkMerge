import { dom } from './dom';
import { toggleConsole, clearConsole, copyConsoleToClipboard } from './ui';

export function setupConsoleHandlers(): void {
  // Console header click handler
  dom.consoleHeader.addEventListener('click', toggleConsole);

  // Add keyboard support for console header
  dom.consoleHeader.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleConsole();
    }
  });

  // Clear button handler
  dom.consoleClearBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent toggle when clicking clear
    clearConsole();
  });

  // Copy button handler
  dom.consoleCopyBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent toggle when clicking copy
    copyConsoleToClipboard();
  });
}
