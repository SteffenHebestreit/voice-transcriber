/**
 * MediaRecorder handler for the renderer process
 * Handles audio recording using the browser's built-in MediaRecorder API
 */

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioStream: MediaStream | null = null;

// Initialize when DOM is ready
if (typeof window !== 'undefined' && window.electronAPI) {

  // Listen for recording commands from the main process
  window.electronAPI.onMediaRecorderStart(async (config: any) => {
    try {
      // Request microphone access
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: config.channels || 1,
          sampleRate: config.sampleRate || 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioChunks = [];

      // Create MediaRecorder
      // Try to use WAV if supported, otherwise use WebM
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }

      mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: mimeType
      });

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Combine all chunks into a single blob
        const audioBlob = new Blob(audioChunks, { type: mimeType });

        // Convert blob to array buffer (browser-compatible)
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Send to main process (IPC will convert Uint8Array to Buffer)
        window.electronAPI.sendMediaRecorderData(uint8Array as any);

        // Stop and release the audio stream
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          audioStream = null;
        }
      };

      mediaRecorder.onerror = (event: Event) => {
        const error = (event as any).error || new Error('MediaRecorder error');
        console.error('MediaRecorder error:', error);
        window.electronAPI.sendMediaRecorderError(error.message);

        // Cleanup on error
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          audioStream = null;
        }
      };

      // Start recording
      mediaRecorder.start();
      window.electronAPI.sendMediaRecorderStarted();

    } catch (error: any) {
      window.electronAPI.sendMediaRecorderError(error.message);

      // Cleanup on error
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }
    }
  });

  window.electronAPI.onMediaRecorderStop(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });
}
