/**
 * Shared TypeScript types and interfaces for the Voice Transcriber application
 */

export interface AppConfig {
  whisper: WhisperConfig;
  hotkeys: HotkeyConfig;
  audio: AudioConfig;
  ui: UIConfig;
  advanced: AdvancedConfig;
}

export interface WhisperConfig {
  endpoint: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
  timeout: number;
  model?: string;
  serverModel?: 'tiny' | 'base' | 'small' | 'medium' | 'large-v2' | 'large-v3';
  device?: 'cpu' | 'cuda';
  computeType?: 'int8' | 'float16' | 'float32';
}

export interface HotkeyConfig {
  toggleMode: string;
  pushToTalk: string;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  encoding: string;
  device?: string;
}

export interface UIConfig {
  showOverlay: boolean;
  showNotifications: boolean;
  startMinimized: boolean;
}

export interface AdvancedConfig {
  autoInsertText: boolean;
  insertDelay: number;
  language?: string;
}

export enum RecordingState {
  IDLE = 'idle',
  RECORDING_TOGGLE = 'recording-toggle',
  RECORDING_PTT = 'recording-ptt',
  PROCESSING = 'processing',
  ERROR = 'error'
}

export interface AppState {
  recordingState: RecordingState;
  currentMode: 'toggle' | 'ptt' | null;
  lastError: string | null;
  lastTranscription: string | null;
  recordingStartTime: number | null;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
}

export enum HotkeyMode {
  TOGGLE = 'toggle',
  PUSH_TO_TALK = 'push-to-talk'
}
