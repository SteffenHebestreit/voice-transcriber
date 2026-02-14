/**
 * Application state manager
 */
import { EventEmitter } from 'events';
import { RecordingState, AppState } from '../shared/types';

export class StateManager extends EventEmitter {
  private state: AppState = {
    recordingState: RecordingState.IDLE,
    currentMode: null,
    lastError: null,
    lastTranscription: null,
    recordingStartTime: null
  };

  getState(): Readonly<AppState> {
    return { ...this.state };
  }

  startRecording(mode: 'toggle' | 'ptt'): void {
    this.state = {
      ...this.state,
      recordingState:
        mode === 'toggle'
          ? RecordingState.RECORDING_TOGGLE
          : RecordingState.RECORDING_PTT,
      currentMode: mode,
      recordingStartTime: Date.now(),
      lastError: null
    };
    this.emit('state-changed', this.state);
  }

  stopRecording(): void {
    this.state = {
      ...this.state,
      recordingState: RecordingState.PROCESSING,
      recordingStartTime: null
    };
    this.emit('state-changed', this.state);
  }

  setTranscription(text: string): void {
    this.state = {
      ...this.state,
      recordingState: RecordingState.IDLE,
      currentMode: null,
      lastTranscription: text
    };
    this.emit('state-changed', this.state);
    this.emit('transcription-complete', text);
  }

  setError(error: string): void {
    this.state = {
      ...this.state,
      recordingState: RecordingState.ERROR,
      currentMode: null,
      lastError: error,
      recordingStartTime: null
    };
    this.emit('state-changed', this.state);
    this.emit('error', error);
  }

  reset(): void {
    this.state = {
      recordingState: RecordingState.IDLE,
      currentMode: null,
      lastError: null,
      lastTranscription: null,
      recordingStartTime: null
    };
    this.emit('state-changed', this.state);
  }

  isRecording(): boolean {
    return (
      this.state.recordingState === RecordingState.RECORDING_TOGGLE ||
      this.state.recordingState === RecordingState.RECORDING_PTT
    );
  }
}
