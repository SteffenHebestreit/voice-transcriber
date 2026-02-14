/**
 * Settings UI logic
 */
import { AppConfig, AppState, RecordingState } from '../shared/types';
import './media-recorder-handler'; // Initialize MediaRecorder handler

class SettingsUI {
  private config: AppConfig | null = null;

  async init(): Promise<void> {
    this.config = await window.electronAPI.getConfig();
    this.renderSettings();
    this.attachEventListeners();
    this.listenForRecordingStatus();
  }

  private renderSettings(): void {
    if (!this.config) return;

    // Whisper config
    (document.getElementById('whisper-endpoint') as HTMLInputElement).value =
      this.config.whisper.endpoint;
    (document.getElementById('whisper-api-key') as HTMLInputElement).value =
      this.config.whisper.apiKey || '';
    (document.getElementById('server-model') as HTMLSelectElement).value =
      this.config.whisper.serverModel || 'base';
    (document.getElementById('server-device') as HTMLSelectElement).value =
      this.config.whisper.device || 'cpu';
    (document.getElementById('compute-type') as HTMLSelectElement).value =
      this.config.whisper.computeType || 'int8';

    // Hotkeys
    (document.getElementById('hotkey-toggle') as HTMLInputElement).value =
      this.config.hotkeys.toggleMode;
    (document.getElementById('hotkey-ptt') as HTMLInputElement).value =
      this.config.hotkeys.pushToTalk;

    // Audio
    (document.getElementById('audio-sample-rate') as HTMLSelectElement).value =
      this.config.audio.sampleRate.toString();

    // UI
    (document.getElementById('show-overlay') as HTMLInputElement).checked =
      this.config.ui.showOverlay;
    (document.getElementById('show-notifications') as HTMLInputElement).checked =
      this.config.ui.showNotifications;
    (document.getElementById('start-minimized') as HTMLInputElement).checked =
      this.config.ui.startMinimized;

    // Advanced
    (document.getElementById('auto-insert-text') as HTMLInputElement).checked =
      this.config.advanced.autoInsertText;
    (document.getElementById('insert-delay') as HTMLInputElement).value =
      this.config.advanced.insertDelay.toString();
    (document.getElementById('language') as HTMLInputElement).value =
      this.config.advanced.language || '';
  }

  private attachEventListeners(): void {
    // Test connection button
    document.getElementById('test-connection')?.addEventListener('click', async () => {
      const button = document.getElementById('test-connection') as HTMLButtonElement;
      const status = document.getElementById('connection-status')!;

      button.disabled = true;
      button.textContent = 'Testing...';
      status.textContent = '';

      const result = await window.electronAPI.testWhisperConnection();

      button.disabled = false;
      button.textContent = 'Test Connection';

      if (result.success) {
        button.className = 'button success';
        status.textContent = '✓ Connected successfully!';
        status.style.color = '#10b981';
      } else {
        button.className = 'button error';
        status.textContent = `✗ Failed: ${result.error || 'Connection failed'}`;
        status.style.color = '#ef4444';
      }

      setTimeout(() => {
        button.className = 'button button-secondary';
        status.textContent = '';
      }, 3000);
    });

    // Restart server button
    document.getElementById('restart-server')?.addEventListener('click', async () => {
      const button = document.getElementById('restart-server') as HTMLButtonElement;
      const status = document.getElementById('server-status')!;
      const modelSelect = document.getElementById('server-model') as HTMLSelectElement;
      const deviceSelect = document.getElementById('server-device') as HTMLSelectElement;
      const computeTypeSelect = document.getElementById('compute-type') as HTMLSelectElement;

      const selectedModel = modelSelect.value;
      const selectedDevice = deviceSelect.value as 'cpu' | 'cuda';
      const selectedComputeType = computeTypeSelect.value as 'int8' | 'float16' | 'float32';

      button.disabled = true;
      button.textContent = 'Restarting...';
      status.textContent = '🔄 Restarting server...';
      status.style.color = '#f59e0b';

      const result = await window.electronAPI.restartServer({
        model: selectedModel,
        device: selectedDevice,
        computeType: selectedComputeType
      });

      button.disabled = false;
      button.textContent = 'Restart Server with Settings';

      if (result.success) {
        status.textContent = `✓ Server restarted with ${selectedModel} on ${selectedDevice.toUpperCase()}!`;
        status.style.color = '#10b981';
      } else {
        status.textContent = `✗ Failed: ${result.error}`;
        status.style.color = '#ef4444';
      }

      setTimeout(() => {
        status.textContent = '';
      }, 5000);
    });

    // Save settings button
    document.getElementById('save-settings')?.addEventListener('click', async () => {
      const updatedConfig = this.collectFormData();
      const result = await window.electronAPI.updateConfig(updatedConfig);

      const saveStatus = document.getElementById('save-status')!;

      if (result.success) {
        saveStatus.textContent = '✓ Settings saved successfully!';
        saveStatus.style.color = '#10b981';
        this.config = await window.electronAPI.getConfig();
      } else {
        saveStatus.textContent = `✗ Failed to save: ${result.error}`;
        saveStatus.style.color = '#ef4444';
      }

      setTimeout(() => {
        saveStatus.textContent = '';
      }, 3000);
    });
  }

  private collectFormData(): Partial<AppConfig> {
    return {
      whisper: {
        endpoint: (document.getElementById('whisper-endpoint') as HTMLInputElement).value,
        apiKey: (document.getElementById('whisper-api-key') as HTMLInputElement).value || undefined,
        timeout: this.config?.whisper.timeout || 30000,
        model: this.config?.whisper.model || 'whisper-1',
        serverModel: (document.getElementById('server-model') as HTMLSelectElement).value as any,
        device: (document.getElementById('server-device') as HTMLSelectElement).value as any,
        computeType: (document.getElementById('compute-type') as HTMLSelectElement).value as any
      },
      hotkeys: {
        toggleMode: (document.getElementById('hotkey-toggle') as HTMLInputElement).value,
        pushToTalk: (document.getElementById('hotkey-ptt') as HTMLInputElement).value
      },
      audio: {
        sampleRate: parseInt(
          (document.getElementById('audio-sample-rate') as HTMLSelectElement).value
        ),
        channels: this.config?.audio.channels || 1,
        encoding: this.config?.audio.encoding || 'LINEAR16'
      },
      ui: {
        showOverlay: (document.getElementById('show-overlay') as HTMLInputElement).checked,
        showNotifications: (document.getElementById('show-notifications') as HTMLInputElement)
          .checked,
        startMinimized: (document.getElementById('start-minimized') as HTMLInputElement).checked
      },
      advanced: {
        autoInsertText: (document.getElementById('auto-insert-text') as HTMLInputElement).checked,
        insertDelay: parseInt(
          (document.getElementById('insert-delay') as HTMLInputElement).value
        ),
        language:
          (document.getElementById('language') as HTMLInputElement).value || undefined
      }
    };
  }

  private listenForRecordingStatus(): void {
    window.electronAPI.onRecordingStatus((state: AppState) => {
      const statusElement = document.getElementById('current-status')!;

      switch (state.recordingState) {
        case RecordingState.IDLE:
          statusElement.textContent = 'Idle';
          statusElement.style.color = '#667eea';
          break;
        case RecordingState.RECORDING_TOGGLE:
          statusElement.textContent = 'Recording (Toggle Mode)...';
          statusElement.style.color = '#ef4444';
          break;
        case RecordingState.RECORDING_PTT:
          statusElement.textContent = 'Recording (Push-to-Talk)...';
          statusElement.style.color = '#ef4444';
          break;
        case RecordingState.PROCESSING:
          statusElement.textContent = 'Processing transcription...';
          statusElement.style.color = '#f59e0b';
          break;
        case RecordingState.ERROR:
          statusElement.textContent = `Error: ${state.lastError}`;
          statusElement.style.color = '#ef4444';
          break;
      }

      if (state.lastTranscription) {
        const transcriptionElement = document.getElementById('last-transcription')!;
        transcriptionElement.textContent = `Last: "${state.lastTranscription.substring(0, 100)}${
          state.lastTranscription.length > 100 ? '...' : ''
        }"`;
      }
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const ui = new SettingsUI();
  ui.init().catch(console.error);
});
