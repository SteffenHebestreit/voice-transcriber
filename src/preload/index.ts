/**
 * Preload script - secure IPC bridge
 */
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import { AppConfig, AppState } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Config operations
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG),

  updateConfig: (config: Partial<AppConfig>): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CONFIG, config),

  testWhisperConnection: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.TEST_WHISPER_CONNECTION),

  restartServer: (config: {
    model: string;
    device: 'cpu' | 'cuda';
    computeType: 'int8' | 'float16' | 'float32';
  }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.RESTART_SERVER, config),

  // Recording operations
  startRecording: (mode: 'toggle' | 'ptt'): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.START_RECORDING, mode),

  stopRecording: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.STOP_RECORDING),

  // Event listeners
  onRecordingStatus: (callback: (status: AppState) => void) => {
    const listener = (_: any, status: AppState) => callback(status);
    ipcRenderer.on(IPC_CHANNELS.RECORDING_STATUS, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_STATUS, listener);
  },

  onTranscriptionResult: (callback: (text: string) => void) => {
    const listener = (_: any, text: string) => callback(text);
    ipcRenderer.on(IPC_CHANNELS.TRANSCRIPTION_RESULT, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TRANSCRIPTION_RESULT, listener);
  },

  onTranscriptionError: (callback: (error: string) => void) => {
    const listener = (_: any, error: string) => callback(error);
    ipcRenderer.on(IPC_CHANNELS.TRANSCRIPTION_ERROR, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TRANSCRIPTION_ERROR, listener);
  },

  onOverlayStatus: (callback: (status: 'recording' | 'processing') => void) => {
    const listener = (_: any, status: 'recording' | 'processing') => callback(status);
    ipcRenderer.on('overlay:status', listener);
    return () => ipcRenderer.removeListener('overlay:status', listener);
  },

  // MediaRecorder API (for built-in audio recording)
  onMediaRecorderStart: (callback: (config: any) => void) => {
    const listener = (_: any, config: any) => callback(config);
    ipcRenderer.on('media-recorder:start', listener);
    return () => ipcRenderer.removeListener('media-recorder:start', listener);
  },

  onMediaRecorderStop: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('media-recorder:stop', listener);
    return () => ipcRenderer.removeListener('media-recorder:stop', listener);
  },

  sendMediaRecorderStarted: () => {
    ipcRenderer.send('media-recorder:started');
  },

  sendMediaRecorderData: (buffer: Buffer) => {
    ipcRenderer.send('media-recorder:data', buffer);
  },

  sendMediaRecorderError: (error: string) => {
    ipcRenderer.send('media-recorder:error', error);
  }
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<AppConfig>;
      updateConfig: (config: Partial<AppConfig>) => Promise<{ success: boolean; error?: string }>;
      testWhisperConnection: () => Promise<{ success: boolean; error?: string }>;
      restartServer: (config: {
        model: string;
        device: 'cpu' | 'cuda';
        computeType: 'int8' | 'float16' | 'float32';
      }) => Promise<{ success: boolean; error?: string }>;
      startRecording: (mode: 'toggle' | 'ptt') => Promise<{ success: boolean; error?: string }>;
      stopRecording: () => Promise<{ success: boolean; error?: string }>;
      onRecordingStatus: (callback: (status: AppState) => void) => () => void;
      onTranscriptionResult: (callback: (text: string) => void) => () => void;
      onTranscriptionError: (callback: (error: string) => void) => () => void;
      onOverlayStatus: (callback: (status: 'recording' | 'processing') => void) => () => void;
      onMediaRecorderStart: (callback: (config: any) => void) => () => void;
      onMediaRecorderStop: (callback: () => void) => () => void;
      sendMediaRecorderStarted: () => void;
      sendMediaRecorderData: (buffer: Buffer) => void;
      sendMediaRecorderError: (error: string) => void;
    };
  }
}
