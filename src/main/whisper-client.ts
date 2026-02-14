/**
 * Whisper API client for transcription
 */
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { WhisperConfig, TranscriptionResponse } from '../shared/types';

export class WhisperClient {
  private client: AxiosInstance;

  constructor(private config: WhisperConfig) {
    this.client = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      headers: {
        ...this.config.customHeaders,
        ...(this.config.apiKey
          ? { Authorization: `Bearer ${this.config.apiKey}` }
          : {})
      }
    });
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));

    if (this.config.model) {
      formData.append('model', this.config.model);
    }

    try {
      const response = await this.client.post('/v1/audio/transcriptions', formData, {
        headers: formData.getHeaders()
      });

      return {
        text: response.data.text || response.data.transcription,
        language: response.data.language,
        duration: response.data.duration
      };
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Whisper API error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      } else if (error.request) {
        throw new Error(
          'Whisper API unreachable - check endpoint URL and server status'
        );
      } else {
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try the health endpoint
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch {
      // Fall back to root endpoint
      try {
        await this.client.get('/', { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  updateConfig(config: Partial<WhisperConfig>): void {
    this.config = { ...this.config, ...config };
    this.client.defaults.timeout = this.config.timeout;
    this.client.defaults.headers = {
      ...this.config.customHeaders,
      ...(this.config.apiKey
        ? { Authorization: `Bearer ${this.config.apiKey}` }
        : {})
    };
  }
}
