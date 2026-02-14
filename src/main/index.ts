/**
 * Main process entry point
 */
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { ConfigManager } from './app-config';
import { StateManager } from './state-manager';
import { TranscriptionOrchestrator } from './transcription-orchestrator';
import { GlobalShortcutManager } from './global-shortcuts';
import { TrayManager } from './tray-manager';
import { OverlayWindow } from './overlay-window';
import { IPCHandlers } from './ipc-handlers';
import { RecordingState } from '../shared/types';

class VoiceTranscriberApp {
  private configManager: ConfigManager;
  private stateManager: StateManager;
  private orchestrator: TranscriptionOrchestrator;
  private shortcutManager: GlobalShortcutManager;
  private trayManager: TrayManager;
  private overlayWindow: OverlayWindow;
  private settingsWindow: BrowserWindow | null = null;
  private ipcHandlers: IPCHandlers;

  constructor() {
    this.configManager = new ConfigManager();
    this.stateManager = new StateManager();
    this.orchestrator = new TranscriptionOrchestrator(
      this.stateManager,
      this.configManager
    );

    const hotkeyConfig = this.configManager.get('hotkeys');
    this.shortcutManager = new GlobalShortcutManager(hotkeyConfig);

    this.trayManager = new TrayManager(
      this.stateManager,
      () => this.showSettings(),
      () => this.quit()
    );

    this.overlayWindow = new OverlayWindow();

    this.ipcHandlers = new IPCHandlers(
      this.configManager,
      this.orchestrator,
      this.stateManager
    );
  }

  async init(): Promise<void> {
    await app.whenReady();

    // Setup IPC handlers
    this.ipcHandlers.register();

    // Create tray icon
    this.trayManager.create();

    // Create overlay if enabled
    if (this.configManager.get('ui').showOverlay) {
      this.overlayWindow.create();
    }

    // Register global shortcuts
    this.setupHotkeys();

    // Setup state listeners
    this.setupStateListeners();

    // Show settings window if not starting minimized
    if (!this.configManager.get('ui').startMinimized) {
      this.showSettings();
    }

    // Prevent app from quitting when all windows are closed
    app.on('window-all-closed', (e) => {
      e.preventDefault();
    });

    // Cleanup on quit
    app.on('will-quit', () => {
      this.shortcutManager.unregister();
    });
  }

  private setupHotkeys(): void {
    this.shortcutManager.on('toggle-activated', () => {
      if (this.stateManager.isRecording()) {
        this.orchestrator.stopRecording();
      } else {
        this.orchestrator.startRecording('toggle');
      }
    });

    this.shortcutManager.on('push-to-talk-started', () => {
      this.orchestrator.startRecording('ptt');
    });

    this.shortcutManager.on('push-to-talk-stopped', () => {
      this.orchestrator.stopRecording();
    });

    const success = this.shortcutManager.register();
    if (!success) {
      console.error('Failed to register global shortcuts');
    }
  }

  private setupStateListeners(): void {
    this.stateManager.on('state-changed', (state) => {
      // Update overlay
      if (this.configManager.get('ui').showOverlay) {
        if (
          state.recordingState === RecordingState.RECORDING_TOGGLE ||
          state.recordingState === RecordingState.RECORDING_PTT
        ) {
          this.overlayWindow.show();
          this.overlayWindow.updateStatus('recording');
        } else if (state.recordingState === RecordingState.PROCESSING) {
          this.overlayWindow.updateStatus('processing');
        } else {
          this.overlayWindow.hide();
        }
      }
    });
  }

  private showSettings(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 900,
      height: 800,
      title: 'Voice Transcriber Settings',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/index.js')
      }
    });

    this.settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  private quit(): void {
    this.shortcutManager.unregister();
    this.trayManager.destroy();
    this.overlayWindow.destroy();
    app.quit();
  }
}

// Start the application
const voiceApp = new VoiceTranscriberApp();
voiceApp.init().catch(console.error);
