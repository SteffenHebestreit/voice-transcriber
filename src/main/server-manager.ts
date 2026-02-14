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
      await this.updateDockerCompose(model, device, computeType);

      // Restart the container
      await this.restartContainer();
    } catch (error: any) {
      throw new Error(`Failed to restart server: ${error.message}`);
    }
  }

  /**
   * Update the docker-compose.yml file with the new model, device, and compute type
   */
  private async updateDockerCompose(
    model: string,
    device: 'cpu' | 'cuda',
    computeType: 'int8' | 'float16' | 'float32'
  ): Promise<void> {
    const composeFile = path.join(this.serverPath, 'docker-compose.yml');

    if (!fs.existsSync(composeFile)) {
      throw new Error('docker-compose.yml not found');
    }

    let content = fs.readFileSync(composeFile, 'utf8');

    // Replace the model in the command line
    const modelRegex = /(--model\s+)(\S+)/;
    content = content.replace(modelRegex, `$1${model}`);

    // Replace the device in the command line
    const deviceRegex = /(--device\s+)(\S+)/;
    content = content.replace(deviceRegex, `$1${device}`);

    // Replace the compute-type in the command line
    const computeTypeRegex = /(--compute-type\s+)(\S+)/;
    content = content.replace(computeTypeRegex, `$1${computeType}`);

    // Enable or disable GPU deployment based on device selection
    if (device === 'cuda') {
      // Uncomment the deploy section for GPU
      content = content.replace(/# (deploy:)/g, '$1');
      content = content.replace(/#   (resources:)/g, '  $1');
      content = content.replace(/#     (reservations:)/g, '    $1');
      content = content.replace(/#       (devices:)/g, '      $1');
      content = content.replace(/#         - (driver: nvidia)/g, '        - $1');
      content = content.replace(/#           (count: 1)/g, '          $1');
      content = content.replace(/#           (capabilities: \[gpu\])/g, '          $1');
    } else {
      // Comment out the deploy section for CPU
      content = content.replace(/^(\s*)(deploy:)/gm, '$1# $2');
      content = content.replace(/^(\s*)(resources:)/gm, '$1# $2');
      content = content.replace(/^(\s*)(reservations:)/gm, '$1# $2');
      content = content.replace(/^(\s*)(devices:)/gm, '$1# $2');
      content = content.replace(/^(\s*)(- driver: nvidia)/gm, '$1# $2');
      content = content.replace(/^(\s*)(count: 1)/gm, '$1# $2');
      content = content.replace(/^(\s*)(capabilities: \[gpu\])/gm, '$1# $2');
    }

    fs.writeFileSync(composeFile, content);
  }

  /**
   * Restart the Docker container
   */
  private async restartContainer(): Promise<void> {
    const commands = [
      `cd "${this.serverPath}" && docker-compose down`,
      `cd "${this.serverPath}" && docker-compose up -d`
    ];

    for (const cmd of commands) {
      const { stdout, stderr } = await execAsync(cmd);
      if (stderr && !stderr.includes('warning')) {
        console.error('Docker command stderr:', stderr);
      }
    }
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
