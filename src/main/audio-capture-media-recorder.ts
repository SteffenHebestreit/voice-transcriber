/**
 * Audio capture using browser's built-in MediaRecorder API
 * Uses bundled ffmpeg for audio conversion
 */
import { EventEmitter } from 'events';
import { BrowserWindow, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AudioConfig } from '../shared/types';
import ffmpegPath from 'ffmpeg-static';

const execAsync = promisify(exec);

export class AudioCaptureMediaRecorder extends EventEmitter {
  private recordingWindow: BrowserWindow | null = null;
  private tempFilePath: string = '';
  private isRecordingFlag: boolean = false;
  private ipcHandlersRegistered: boolean = false;

  constructor(private config: AudioConfig) {
    super();
    this.registerIPCHandlers();
  }

  private registerIPCHandlers(): void {
    if (this.ipcHandlersRegistered) return;

    ipcMain.on('media-recorder:started', () => {
      this.isRecordingFlag = true;
      this.emit('started');
    });

    ipcMain.on('media-recorder:data', async (event, audioBuffer: Buffer) => {
      try {
        // Save WebM file temporarily
        const webmPath = this.tempFilePath.replace('.wav', '.webm');
        fs.writeFileSync(webmPath, audioBuffer);

        // Convert WebM to WAV using ffmpeg
        await this.convertToWav(webmPath, this.tempFilePath);

        // Delete temporary WebM file
        try {
          fs.unlinkSync(webmPath);
        } catch (err) {
          console.error('Failed to delete temp WebM file:', err);
        }

        this.isRecordingFlag = false;
        this.emit('stopped', {
          filePath: this.tempFilePath,
          duration: audioBuffer.length
        });
      } catch (error: any) {
        this.isRecordingFlag = false;
        this.emit('error', error);
      }
    });

    ipcMain.on('media-recorder:error', (event, errorMessage: string) => {
      this.isRecordingFlag = false;
      this.emit('error', new Error(errorMessage));
    });

    this.ipcHandlersRegistered = true;
  }

  private getRecordingWindow(): BrowserWindow {
    if (!this.recordingWindow || this.recordingWindow.isDestroyed()) {
      // Try to use an existing window first
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        this.recordingWindow = windows[0];
      } else {
        throw new Error('No browser window available for recording');
      }
    }
    return this.recordingWindow;
  }

  async startRecording(): Promise<void> {
    if (this.isRecordingFlag) {
      console.warn('Recording already in progress');
      return;
    }

    this.tempFilePath = path.join(
      app.getPath('temp'),
      `voice-transcribe-${Date.now()}.wav`
    );

    try {
      const window = this.getRecordingWindow();
      window.webContents.send('media-recorder:start', this.config);
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  stopRecording(): string {
    if (!this.isRecordingFlag) {
      console.warn('Stop recording called but no recording in progress');
      return this.tempFilePath || '';
    }

    try {
      const window = this.getRecordingWindow();
      window.webContents.send('media-recorder:stop');
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }

    return this.tempFilePath;
  }

  isRecording(): boolean {
    return this.isRecordingFlag;
  }

  cleanup(): void {
    if (this.tempFilePath && fs.existsSync(this.tempFilePath)) {
      try {
        fs.unlinkSync(this.tempFilePath);
      } catch (error) {
        console.error('Failed to cleanup audio file:', error);
      }
    }
  }

  updateConfig(config: AudioConfig): void {
    this.config = config;
  }

  /**
   * Convert WebM audio to WAV using bundled ffmpeg
   */
  private async convertToWav(inputPath: string, outputPath: string): Promise<void> {
    try {
      if (!ffmpegPath) {
        throw new Error('ffmpeg binary not found');
      }

      // Convert WebM to WAV with 16kHz sample rate, mono channel (Whisper requirements)
      const command = `"${ffmpegPath}" -loglevel error -i "${inputPath}" -ar 16000 -ac 1 -y "${outputPath}"`;
      const { stderr } = await execAsync(command);

      if (stderr) {
        console.error('ffmpeg stderr:', stderr);
      }
    } catch (error: any) {
      console.error('ffmpeg conversion failed:', error);
      throw new Error(`Failed to convert audio to WAV: ${error.message}`);
    }
  }
}
