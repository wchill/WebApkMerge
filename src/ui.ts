import type { StatusType, ConsoleLineType } from './types';
import { state } from './state';
import { dom } from './dom';

export function showStatus(message: string, type: StatusType): void {
  dom.status.textContent = message;
  dom.status.className = 'status show ' + type;
}

export function showProgress(): void {
  dom.progressBar.classList.add('show');
}

export function hideProgress(): void {
  dom.progressBar.classList.remove('show');
  updateProgress(0);
}

export function updateProgress(percent: number): void {
  dom.progressFill.style.width = percent + '%';
  dom.progressBar.setAttribute('aria-valuenow', percent.toString());
}

export function showConsole(): void {
  dom.consoleContainer.classList.add('show');
}

export function hideConsole(): void {
  dom.consoleContainer.classList.remove('show');
}

export function toggleConsole(): void {
  state.consoleExpanded = !state.consoleExpanded;
  dom.consoleBody.classList.toggle('show', state.consoleExpanded);
  dom.consoleToggle.classList.toggle('expanded', state.consoleExpanded);
  dom.consoleHeader.setAttribute('aria-expanded', state.consoleExpanded.toString());
}

export function appendToConsole(message: string, type: ConsoleLineType = 'stdout'): void {
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.textContent = message;
  dom.consoleBody.appendChild(line);
  
  // Auto-scroll to bottom only if console is expanded
  if (state.consoleExpanded) {
    dom.consoleBody.scrollTop = dom.consoleBody.scrollHeight;
  }
}

export function clearConsole(): void {
  dom.consoleBody.innerHTML = '';
}

export async function copyConsoleToClipboard(): Promise<void> {
  try {
    // Get all console lines
    const lines = dom.consoleBody.querySelectorAll('.console-line');
    const text = Array.from(lines).map(line => line.textContent).join('\n');
    
    if (!text) {
      showStatus('Console is empty, nothing to copy', 'info');
      return;
    }
    
    // Copy to clipboard
    await navigator.clipboard.writeText(text);
    
    // Show feedback
    dom.consoleCopyBtn.textContent = '✓ Copied!';
    dom.consoleCopyBtn.classList.add('copied');
    
    // Reset button after 2 seconds
    setTimeout(() => {
      dom.consoleCopyBtn.textContent = 'Copy';
      dom.consoleCopyBtn.classList.remove('copied');
    }, 2000);
    
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    showStatus('Failed to copy to clipboard', 'error');
  }
}
