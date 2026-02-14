/**
 * System tray manager
 */
import { Tray, Menu, app, nativeImage } from 'electron';
import * as path from 'path';
import { RecordingState, AppState } from '../shared/types';
import { StateManager } from './state-manager';

export class TrayManager {
  private tray: Tray | null = null;
  private idleIcon: string;
  private recordingIcon: string;

  constructor(
    private stateManager: StateManager,
    private onShowSettings: () => void,
    private onQuit: () => void
  ) {
    // For now, use placeholder icons (will be replaced with actual icons)
    this.idleIcon = path.join(__dirname, '../../resources/icons/tray-idle.png');
    this.recordingIcon = path.join(
      __dirname,
      '../../resources/icons/tray-recording.png'
    );

    this.stateManager.on('state-changed', (state: AppState) => {
      this.updateTrayIcon(state.recordingState);
    });
  }

  create(): void {
    // Create tray with idle icon (will use default if custom icon doesn't exist)
    this.tray = new Tray(
      nativeImage.createEmpty()
    );

    this.updateContextMenu();

    this.tray.setToolTip('Voice Transcriber');
    this.tray.on('click', () => {
      this.onShowSettings();
    });
  }

  private updateContextMenu(): void {
    if (!this.tray) return;

    const state = this.stateManager.getState();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Voice Transcriber',
        type: 'normal',
        enabled: false
      },
      { type: 'separator' },
      {
        label: `Status: ${this.getStatusLabel(state.recordingState)}`,
        type: 'normal',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Settings',
        type: 'normal',
        click: () => this.onShowSettings()
      },
      {
        label: 'Start on Boot',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({
            openAtLogin: menuItem.checked
          });
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        type: 'normal',
        click: () => this.onQuit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private updateTrayIcon(state: RecordingState): void {
    if (!this.tray) return;

    // Update tooltip based on state
    this.tray.setToolTip(`Voice Transcriber - ${this.getStatusLabel(state)}`);

    // Update context menu
    this.updateContextMenu();
  }

  private getStatusLabel(state: RecordingState): string {
    switch (state) {
      case RecordingState.IDLE:
        return 'Idle';
      case RecordingState.RECORDING_TOGGLE:
        return 'Recording (Toggle)';
      case RecordingState.RECORDING_PTT:
        return 'Recording (PTT)';
      case RecordingState.PROCESSING:
        return 'Processing...';
      case RecordingState.ERROR:
        return 'Error';
      default:
        return 'Unknown';
    }
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
