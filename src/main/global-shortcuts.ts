/**
 * Global shortcut manager for hotkey handling with true hold-to-talk support
 */
import { globalShortcut } from 'electron';
import { EventEmitter } from 'events';
import { HotkeyConfig } from '../shared/types';
import { uIOhook, UiohookKey } from 'uiohook-napi';

export class GlobalShortcutManager extends EventEmitter {
  private registeredShortcuts: string[] = [];
  private isPushToTalkActive = false;
  private pttTimer: NodeJS.Timeout | null = null;
  private uiohookStarted = false;
  private pttKeyCodes: number[] = [];
  private pttKeysPressed = new Set<number>();
  private pttStartTime: number = 0;
  private minRecordingDuration: number = 300; // Minimum 300ms recording to prevent bouncing

  constructor(private config: HotkeyConfig) {
    super();
  }

  register(): boolean {
    try {
      // Toggle mode shortcut
      const toggleSuccess = globalShortcut.register(
        this.config.toggleMode,
        () => {
          this.emit('toggle-activated');
        }
      );

      if (toggleSuccess) {
        this.registeredShortcuts.push(this.config.toggleMode);
      }

      // Push-to-talk with TRUE hold functionality using uiohook
      this.registerPushToTalk();

      return toggleSuccess;
    } catch (error) {
      console.error('Failed to register shortcuts:', error);
      return false;
    }
  }

  private registerPushToTalk(): void {
    try {
      // Parse the hotkey string to get key codes
      this.pttKeyCodes = this.parseHotkeyToCodes(this.config.pushToTalk);

      if (this.pttKeyCodes.length === 0) {
        console.warn('Could not parse push-to-talk hotkey');
        return;
      }

      // Start uiohook if not already started
      if (!this.uiohookStarted) {
        uIOhook.on('keydown', (event) => {
          this.handleKeyDown(event.keycode);
        });

        uIOhook.on('keyup', (event) => {
          this.handleKeyUp(event.keycode);
        });

        uIOhook.start();
        this.uiohookStarted = true;
      }
    } catch (error) {
      console.error('Failed to register push-to-talk:', error);
    }
  }

  private parseHotkeyToCodes(hotkey: string): number[] {
    const keys: number[] = [];
    const parts = hotkey.split('+').map(k => k.trim().toLowerCase());

    for (const part of parts) {
      switch (part) {
        case 'commandorcontrol':
        case 'ctrl':
        case 'control':
          keys.push(UiohookKey.Ctrl);
          keys.push(UiohookKey.CtrlRight);
          break;
        case 'shift':
          keys.push(UiohookKey.Shift);
          keys.push(UiohookKey.ShiftRight);
          break;
        case 'alt':
          keys.push(UiohookKey.Alt);
          keys.push(UiohookKey.AltRight);
          break;
        case 'space':
          keys.push(UiohookKey.Space);
          break;
        case 't':
          keys.push(UiohookKey.T);
          break;
        default:
          // Try to get key code from the character
          const keyName = `Key${part.toUpperCase()}`;
          if (UiohookKey[keyName as keyof typeof UiohookKey]) {
            keys.push(UiohookKey[keyName as keyof typeof UiohookKey]);
          }
          break;
      }
    }

    return keys;
  }

  private handleKeyDown(keycode: number): void {
    // Check if this is one of the PTT keys (Ctrl, Shift, Space)
    if (this.isPTTKey(keycode)) {
      this.pttKeysPressed.add(keycode);
      this.checkPushToTalkActivation();
    }
  }

  private handleKeyUp(keycode: number): void {
    // Check if this is one of the PTT keys
    if (this.isPTTKey(keycode)) {
      this.pttKeysPressed.delete(keycode);
      this.checkPushToTalkDeactivation();
    }
  }

  private isPTTKey(keycode: number): boolean {
    // Ctrl: 29 (left), 3613 (right)
    // Shift: 42 (left), 3638 (right)
    // Space: 57
    return keycode === 29 || keycode === 3613 || // Ctrl
           keycode === 42 || keycode === 3638 || // Shift
           keycode === 57; // Space
  }

  private checkPushToTalkActivation(): void {
    // Check if all required keys are pressed
    // For Ctrl+Shift+Space, we need at least one Ctrl, one Shift, and Space
    const hasCtrl = this.pttKeysPressed.has(29) || this.pttKeysPressed.has(3613); // Left or Right Ctrl
    const hasShift = this.pttKeysPressed.has(42) || this.pttKeysPressed.has(3638); // Left or Right Shift
    const hasSpace = this.pttKeysPressed.has(57); // Space

    if (hasCtrl && hasShift && hasSpace && !this.isPushToTalkActive) {
      this.isPushToTalkActive = true;
      this.pttStartTime = Date.now();

      // Small delay to ensure we don't stop too quickly
      setTimeout(() => {
        this.emit('push-to-talk-started');
      }, 100);

      // Safety timeout - auto-stop after 60 seconds
      this.pttTimer = setTimeout(() => {
        this.stopPushToTalk();
      }, 60000);
    }
  }

  private checkPushToTalkDeactivation(): void {
    // If any of the required keys is released, stop recording
    const hasCtrl = this.pttKeysPressed.has(29) || this.pttKeysPressed.has(3613);
    const hasShift = this.pttKeysPressed.has(42) || this.pttKeysPressed.has(3638);
    const hasSpace = this.pttKeysPressed.has(57);

    if (!(hasCtrl && hasShift && hasSpace) && this.isPushToTalkActive) {
      // Check if minimum recording duration has passed to prevent bouncing
      const recordingDuration = Date.now() - this.pttStartTime;
      if (recordingDuration < this.minRecordingDuration) {
        // Don't stop yet - wait for minimum duration to prevent bouncing
        return;
      }

      this.stopPushToTalk();
    }
  }

  unregister(): void {
    this.registeredShortcuts.forEach((shortcut) => {
      globalShortcut.unregister(shortcut);
    });
    this.registeredShortcuts = [];

    if (this.pttTimer) {
      clearTimeout(this.pttTimer);
      this.pttTimer = null;
    }

    if (this.uiohookStarted) {
      try {
        uIOhook.stop();
        this.uiohookStarted = false;
      } catch (error) {
        console.error('Failed to stop uiohook:', error);
      }
    }

    this.pttKeysPressed.clear();
  }

  updateShortcuts(config: HotkeyConfig): boolean {
    this.unregister();
    this.config = config;
    return this.register();
  }

  stopPushToTalk(): void {
    if (this.isPushToTalkActive) {
      this.isPushToTalkActive = false;
      if (this.pttTimer) {
        clearTimeout(this.pttTimer);
        this.pttTimer = null;
      }
      // Small delay to ensure recording has actually started
      setTimeout(() => {
        this.emit('push-to-talk-stopped');
      }, 200);
    }
  }
}
