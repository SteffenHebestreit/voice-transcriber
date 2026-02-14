/**
 * Docker server management for Whisper service
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export class ServerManager {
  private serverPath: string;

  constructor() {
    // Assume server folder is in the project root
    this.serverPath = path.join(__dirname, '..', '..', 'server');
  }

  /**
   * Restart the Docker container with a new model and device
   */
  async restartWithModel(
    model: string,
    device: 'cpu' | 'cuda' = 'cpu',
    computeType: 'int8' | 'float16' | 'float32' = 'int8'
  ): Promise<void> {
    try {
      // Update docker-compose.yml with the new model and device
      this.updateDockerCompose(model, device, computeType);

      // Rebuild and restart the container (rebuild needed when switching CPU/GPU)
      await this.rebuildAndRestart();
    } catch (error: any) {
      throw new Error(`Failed to restart server: ${error.message}`);
    }
  }

  /**
   * Rewrite docker-compose.yml with proper CPU or GPU configuration
   */
  private updateDockerCompose(
    model: string,
    device: 'cpu' | 'cuda',
    computeType: 'int8' | 'float16' | 'float32'
  ): void {
    const composeFile = path.join(this.serverPath, 'docker-compose.yml');

    if (!fs.existsSync(composeFile)) {
      throw new Error('docker-compose.yml not found');
    }

    const isGPU = device === 'cuda';
    const dockerfile = isGPU ? 'Dockerfile.gpu' : 'Dockerfile';
    const pythonCmd = isGPU ? 'python3' : 'python';

    let content: string;

    if (isGPU) {
      content = `version: '3.8'

services:
  whisper-server:
    build:
      context: .
      dockerfile: ${dockerfile}
    ports:
      - "8000:8000"
    restart: unless-stopped
    environment:
      - PYTHONUNBUFFERED=1
      - NVIDIA_VISIBLE_DEVICES=all
    command: ${pythonCmd} whisper-server.py --host 0.0.0.0 --port 8000 --model ${model} --device ${device} --compute-type ${computeType}
    volumes:
      - whisper-models:/root/.cache/huggingface
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  whisper-models:
`;
    } else {
      content = `version: '3.8'

services:
  whisper-server:
    build:
      context: .
      dockerfile: ${dockerfile}
    ports:
      - "8000:8000"
    restart: unless-stopped
    environment:
      - PYTHONUNBUFFERED=1
    command: ${pythonCmd} whisper-server.py --host 0.0.0.0 --port 8000 --model ${model} --device ${device} --compute-type ${computeType}
    volumes:
      - whisper-models:/root/.cache/huggingface

volumes:
  whisper-models:
`;
    }

    fs.writeFileSync(composeFile, content);
  }

  /**
   * Stop any container using port 8000
   */
  private async freePort(): Promise<void> {
    try {
      // Find any container using port 8000
      const { stdout } = await execAsync(
        'docker ps --format "{{.ID}}" --filter "publish=8000"'
      );
      const containerIds = stdout.trim().split('\n').filter(Boolean);
      for (const id of containerIds) {
        await execAsync(`docker stop ${id}`).catch(() => {});
        await execAsync(`docker rm ${id}`).catch(() => {});
      }
    } catch {
      // No containers found or docker not available
    }
  }

  /**
   * Rebuild and restart the Docker container
   */
  private async rebuildAndRestart(): Promise<void> {
    // Stop our own project's container first
    try {
      await execAsync(`cd "${this.serverPath}" && docker-compose down`, {
        timeout: 15000
      });
    } catch {
      // Container may not be running, that's fine
    }

    // Also stop any other container holding port 8000 (e.g. from a different project name)
    await this.freePort();

    // Rebuild with new Dockerfile and start
    await execAsync(`cd "${this.serverPath}" && docker-compose up -d --build`, {
      timeout: 300000 // 5 minute timeout for GPU image builds
    });
  }

  /**
   * Get the current model from docker-compose.yml
   */
  getCurrentModel(): string {
    try {
      const composeFile = path.join(this.serverPath, 'docker-compose.yml');
      const content = fs.readFileSync(composeFile, 'utf8');

      const modelMatch = content.match(/--model\s+(\S+)/);
      return modelMatch ? modelMatch[1] : 'base';
    } catch {
      return 'base';
    }
  }

  /**
   * Get the current device from docker-compose.yml
   */
  getCurrentDevice(): 'cpu' | 'cuda' {
    try {
      const composeFile = path.join(this.serverPath, 'docker-compose.yml');
      const content = fs.readFileSync(composeFile, 'utf8');

      const deviceMatch = content.match(/--device\s+(\S+)/);
      return (deviceMatch?.[1] === 'cuda') ? 'cuda' : 'cpu';
    } catch {
      return 'cpu';
    }
  }

  /**
   * Get the current compute type from docker-compose.yml
   */
  getCurrentComputeType(): string {
    try {
      const composeFile = path.join(this.serverPath, 'docker-compose.yml');
      const content = fs.readFileSync(composeFile, 'utf8');

      const match = content.match(/--compute-type\s+(\S+)/);
      return match ? match[1] : 'int8';
    } catch {
      return 'int8';
    }
  }

  /**
   * Check if Docker is running
   */
  async isDockerRunning(): Promise<boolean> {
    try {
      await execAsync('docker ps');
      return true;
    } catch {
      return false;
    }
  }
}
