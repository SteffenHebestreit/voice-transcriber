/**
 * IPC channel definitions for communication between main and renderer processes
 */

export const IPC_CHANNELS = {
  // Config
  GET_CONFIG: 'config:get',
  UPDATE_CONFIG: 'config:update',
  TEST_WHISPER_CONNECTION: 'whisper:test-connection',
  RESTART_SERVER: 'server:restart',

  // Recording
  START_RECORDING: 'recording:start',
  STOP_RECORDING: 'recording:stop',
  RECORDING_STATUS: 'recording:status',

  // Transcription
  TRANSCRIPTION_RESULT: 'transcription:result',
  TRANSCRIPTION_ERROR: 'transcription:error',

  // App control
  QUIT_APP: 'app:quit',
  SHOW_SETTINGS: 'app:show-settings',
  MINIMIZE_TO_TRAY: 'app:minimize-to-tray'
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
