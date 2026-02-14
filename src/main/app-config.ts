/**
 * Configuration manager for persistent app settings
 */
import Store from 'electron-store';
import { AppConfig } from '../shared/types';

export class ConfigManager {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      defaults: this.getDefaultConfig()
    });
  }

  private getDefaultConfig(): AppConfig {
    return {
      whisper: {
        endpoint: 'http://localhost:8000',
        timeout: 30000,
        model: 'whisper-1',
        serverModel: 'base',
        device: 'cpu',
        computeType: 'int8'
      },
      hotkeys: {
        toggleMode: 'CommandOrControl+Shift+T',
        pushToTalk: 'CommandOrControl+Shift+Space'
      },
      audio: {
        sampleRate: 16000,
        channels: 1,
        encoding: 'LINEAR16'
      },
      ui: {
        showOverlay: true,
        showNotifications: true,
        startMinimized: false
      },
      advanced: {
        autoInsertText: true,
        insertDelay: 100
      }
    };
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key);
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value);
  }

  getAll(): AppConfig {
    return this.store.store;
  }

  setAll(config: Partial<AppConfig>): void {
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        this.store.set(key as keyof AppConfig, config[key as keyof AppConfig] as any);
      }
    }
  }

  reset(): void {
    this.store.clear();
  }
}
