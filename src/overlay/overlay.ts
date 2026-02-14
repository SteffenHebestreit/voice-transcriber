/**
 * Overlay window script
 */

// This will be exposed via preload script if needed
window.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  // Listen for status updates from main process
  if ((window as any).electronAPI) {
    (window as any).electronAPI.onOverlayStatus((status: 'recording' | 'processing') => {
      if (statusIndicator && statusText) {
        if (status === 'recording') {
          statusIndicator.className = 'recording';
          statusText.textContent = 'Recording...';
        } else if (status === 'processing') {
          statusIndicator.className = 'processing';
          statusText.textContent = 'Processing...';
        }
      }
    });
  }
});
