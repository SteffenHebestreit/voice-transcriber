/**
 * Overlay window for recording indicator
 */
import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

export class OverlayWindow {
  private window: BrowserWindow | null = null;

  create(): void {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    this.window = new BrowserWindow({
      width: 200,
      height: 80,
      x: width - 220,
      y: height - 100,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/index.js')
      }
    });

    this.window.loadFile(path.join(__dirname, '../overlay/overlay.html'));
    this.window.setIgnoreMouseEvents(true);
    this.hide();
  }

  show(): void {
    if (this.window) {
      this.window.showInactive();
    }
  }

  hide(): void {
    if (this.window) {
      this.window.hide();
    }
  }

  updateStatus(status: 'recording' | 'processing'): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('overlay:status', status);
    }
  }

  destroy(): void {
    if (this.window) {
      this.window.destroy();
      this.window = null;
    }
  }
}
