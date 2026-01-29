import { dom } from './dom';
import { toggleConsole, clearConsole, copyConsoleToClipboard, appendToConsole } from './ui';

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

  const observer = new MutationObserver(function(mutationsList: MutationRecord[], _) {
    for (const mutation of mutationsList) {
        if (mutation.addedNodes.length === 0) continue;

        const newText = mutation.addedNodes!!.item(0)!!.nodeValue!!;
        let oldText;
        if (mutation.removedNodes.length > 0) {
            oldText = mutation.removedNodes!!.item(0)!!.nodeValue!!;
        } else {
            oldText = '';
        }

        if (!newText || newText.length < oldText.length) continue;

        const log = newText.replace(oldText, '').trim();
        if (log.length === 0) continue;

        appendToConsole(log);
    }
    dom.consoleBuffer.innerHTML = '';
  });
  observer.observe(dom.consoleBuffer, {characterData: false, childList: true, attributes: false});
}
