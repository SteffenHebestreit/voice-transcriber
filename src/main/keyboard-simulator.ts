/**
 * Keyboard simulator for system-wide text insertion
 * Using clipboard-based approach (no native modules required)
 */
import { clipboard } from 'electron';
import { spawn } from 'child_process';

export class KeyboardSimulator {
  private insertDelay: number;

  constructor(insertDelay: number = 100) {
    this.insertDelay = insertDelay;
  }

  async typeText(text: string): Promise<void> {
    // Use clipboard paste for all text insertion
    // This avoids the need for native keyboard automation libraries
    await this.pasteText(text);
  }

  async pasteText(text: string): Promise<void> {
    // Save previous clipboard content
    const previousClipboard = clipboard.readText();

    try {
      // Write transcribed text to clipboard
      clipboard.writeText(text);

      // Wait for configured delay
      await this.sleep(this.insertDelay);

      // Simulate paste using platform-specific methods
      await this.simulatePaste();

      // Restore previous clipboard content after a delay
      setTimeout(() => {
        try {
          clipboard.writeText(previousClipboard);
        } catch (error) {
          console.error('Failed to restore clipboard:', error);
        }
      }, 500);
    } catch (error) {
      // Restore clipboard even on error
      try {
        clipboard.writeText(previousClipboard);
      } catch (restoreError) {
        console.error('Failed to restore clipboard after error:', restoreError);
      }
      throw new Error(`Failed to paste text: ${error}`);
    }
  }

  private async simulatePaste(): Promise<void> {
    // Platform-specific paste simulation using system commands
    return new Promise((resolve, reject) => {
      let command: string;
      let args: string[];

      if (process.platform === 'win32') {
        // Windows: Use PowerShell to send Ctrl+V
        command = 'powershell.exe';
        args = [
          '-Command',
          `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")`
        ];
      } else if (process.platform === 'darwin') {
        // macOS: Use AppleScript to send Cmd+V
        command = 'osascript';
        args = ['-e', 'tell application "System Events" to keystroke "v" using command down'];
      } else {
        // Linux: Use xdotool to send Ctrl+V
        command = 'xdotool';
        args = ['key', 'ctrl+v'];
      }

      const proc = spawn(command, args, {
        windowsHide: true
      });

      let errorOutput = '';

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Paste simulation failed: ${errorOutput || 'Unknown error'}`));
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to execute paste command: ${error.message}`));
      });
    });
  }

  async insertTranscription(text: string, usePaste: boolean = true): Promise<void> {
    // Always use paste since we don't have character-by-character typing
    await this.pasteText(text);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  updateDelay(delay: number): void {
    this.insertDelay = delay;
  }
}
