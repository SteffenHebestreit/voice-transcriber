/**
 * IPC handlers for main-renderer communication
 */
import { ipcMain, Notification, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import { ConfigManager } from './app-config';
import { TranscriptionOrchestrator } from './transcription-orchestrator';
import { StateManager } from './state-manager';
import { WhisperClient } from './whisper-client';
import { ServerManager } from './server-manager';

export class IPCHandlers {
  private serverManager: ServerManager;

  constructor(
    private configManager: ConfigManager,
    private orchestrator: TranscriptionOrchestrator,
    private stateManager: StateManager
  ) {
    this.serverManager = new ServerManager();
  }

  register(): void {
    // Config handlers
    ipcMain.handle(IPC_CHANNELS.GET_CONFIG, () => {
      return this.configManager.getAll();
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_CONFIG, async (_, config) => {
      try {
        // Update each section
        for (const key in config) {
          this.configManager.set(key as any, config[key]);
        }

        // Reload orchestrator with new config
        this.orchestrator.updateConfig();

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Test Whisper connection
    ipcMain.handle(IPC_CHANNELS.TEST_WHISPER_CONNECTION, async () => {
      try {
        const whisperConfig = this.configManager.get('whisper');
        const client = new WhisperClient(whisperConfig);
        const isReachable = await client.healthCheck();
        return { success: isReachable };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Restart server with new model and device
    ipcMain.handle(
      IPC_CHANNELS.RESTART_SERVER,
      async (_, config: { model: string; device: 'cpu' | 'cuda'; computeType: 'int8' | 'float16' | 'float32' }) => {
        try {
          await this.serverManager.restartWithModel(config.model, config.device, config.computeType);
          // Update config to remember the server settings
          this.configManager.set('whisper', {
            ...this.configManager.get('whisper'),
            serverModel: config.model as any,
            device: config.device,
            computeType: config.computeType
          });
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }
    );

    // Recording handlers
    ipcMain.handle(
      IPC_CHANNELS.START_RECORDING,
      async (_, mode: 'toggle' | 'ptt') => {
        try {
          await this.orchestrator.startRecording(mode);
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }
    );

    ipcMain.handle(IPC_CHANNELS.STOP_RECORDING, async () => {
      try {
        await this.orchestrator.stopRecording();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Transcription result forwarding
    this.stateManager.on('transcription-complete', (text: string) => {
      // Send to all renderer windows
      BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send(IPC_CHANNELS.TRANSCRIPTION_RESULT, text);
        }
      });

      // Show notification if enabled
      if (this.configManager.get('ui').showNotifications) {
        new Notification({
          title: 'Transcription Complete',
          body: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        }).show();
      }
    });

    this.stateManager.on('error', (error: string) => {
      // Send to all renderer windows
      BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send(IPC_CHANNELS.TRANSCRIPTION_ERROR, error);
        }
      });

      // Show error notification
      new Notification({
        title: 'Transcription Error',
        body: error
      }).show();
    });

    // Forward state changes to renderer
    this.stateManager.on('state-changed', (state) => {
      BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send(IPC_CHANNELS.RECORDING_STATUS, state);
        }
      });
    });
  }
}
