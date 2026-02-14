/**
 * Transcription orchestrator - coordinates the full workflow
 */
import { AudioCaptureMediaRecorder } from './audio-capture-media-recorder';
import { WhisperClient } from './whisper-client';
import { KeyboardSimulator } from './keyboard-simulator';
import { StateManager } from './state-manager';
import { ConfigManager } from './app-config';

export class TranscriptionOrchestrator {
  private audioCapture: AudioCaptureMediaRecorder;
  private whisperClient: WhisperClient;
  private keyboardSim: KeyboardSimulator;

  constructor(
    private stateManager: StateManager,
    private configManager: ConfigManager
  ) {
    const audioConfig = this.configManager.get('audio');
    const whisperConfig = this.configManager.get('whisper');
    const advancedConfig = this.configManager.get('advanced');

    this.audioCapture = new AudioCaptureMediaRecorder(audioConfig);
    this.whisperClient = new WhisperClient(whisperConfig);
    this.keyboardSim = new KeyboardSimulator(advancedConfig.insertDelay);

    // Listen for recording stopped event
    this.audioCapture.on('stopped', (data: { filePath: string; duration: number }) => {
      this.transcribeAndInsert(data.filePath);
    });

    this.audioCapture.on('error', (error: Error) => {
      this.stateManager.setError(error.message);
    });
  }

  async startRecording(mode: 'toggle' | 'ptt'): Promise<void> {
    if (this.stateManager.isRecording()) {
      console.warn('Already recording');
      return;
    }

    try {
      this.stateManager.startRecording(mode);
      this.audioCapture.startRecording();
    } catch (error: any) {
      this.stateManager.setError(error.message);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.stateManager.isRecording()) {
      console.warn('Not recording');
      return;
    }

    try {
      // Stop recording (file will be saved asynchronously)
      this.audioCapture.stopRecording();
      this.stateManager.stopRecording();
      // Transcription will be triggered by the 'stopped' event handler
    } catch (error: any) {
      this.stateManager.setError(error.message);
      throw error;
    }
  }

  private async transcribeAndInsert(audioFilePath: string): Promise<void> {
    try {
      const result = await this.whisperClient.transcribe(audioFilePath);

      if (result.text && result.text.trim()) {
        this.stateManager.setTranscription(result.text);

        if (this.configManager.get('advanced').autoInsertText) {
          await this.keyboardSim.insertTranscription(result.text);
        }
      } else {
        this.stateManager.setError('No transcription received');
      }
    } catch (error: any) {
      this.stateManager.setError(error.message);
    } finally {
      // Cleanup temp file
      this.audioCapture.cleanup();
    }
  }

  updateConfig(): void {
    // Reload configurations when settings change
    const audioConfig = this.configManager.get('audio');
    const whisperConfig = this.configManager.get('whisper');
    const advancedConfig = this.configManager.get('advanced');

    this.audioCapture.updateConfig(audioConfig);
    this.whisperClient.updateConfig(whisperConfig);
    this.keyboardSim.updateDelay(advancedConfig.insertDelay);
  }
}
