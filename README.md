# Local Faster-Whisper Server

This is a self-contained Whisper transcription server that runs locally on your machine (CPU or GPU).

## Features

- ✅ **CPU-optimized** - Runs on any computer without GPU
- ⚡ **Fast** - Uses faster-whisper (4x faster than openai-whisper)
- 🔒 **Private** - All processing happens locally
- 🎯 **OpenAI-compatible** - Works with any OpenAI Whisper API client
- 🎚️ **Multiple models** - Choose from tiny to large-v3

## Quick Start

### Windows

1. **Install:**
   ```cmd
   install.bat
   ```

2. **Start Server:**
   ```cmd
   start-server.bat
   ```

3. **Configure Voice Transcriber:**
   - Endpoint: `http://127.0.0.1:8000/v1/audio/transcriptions`
   - Click "Test Connection" to verify

### Linux/Mac

1. **Install:**
   ```bash
   chmod +x install.sh start-server.sh
   ./install.sh
   ```

2. **Start Server:**
   ```bash
   ./start-server.sh
   ```

3. **Configure Voice Transcriber:**
   - Endpoint: `http://127.0.0.1:8000/v1/audio/transcriptions`
   - Click "Test Connection" to verify

## Model Selection

Choose a model based on your needs:

| Model | Size | Speed | Accuracy | RAM Usage |
|-------|------|-------|----------|-----------|
| tiny | 39 MB | Fastest | Low | ~1 GB |
| base | 74 MB | Fast | Good | ~1 GB |
| small | 244 MB | Medium | Better | ~2 GB |
| medium | 769 MB | Slow | Great | ~5 GB |
| large-v3 | 1550 MB | Slowest | Best | ~10 GB |

**Recommended for CPU:** `base` (good balance of speed and accuracy)

To use a different model:
```bash
# Windows
venv\Scripts\activate.bat
python whisper-server.py --model small

# Linux/Mac
source venv/bin/activate
python whisper-server.py --model small
```

## Advanced Usage

### Custom Port
```bash
python whisper-server.py --port 9000
```

### GPU Support (if you have CUDA)
```bash
# First install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Then run with GPU
python whisper-server.py --device cuda --compute-type float16 --model large-v3
```

### All Options
```bash
python whisper-server.py --help
```

Options:
- `--model`: Model size (tiny, base, small, medium, large-v2, large-v3)
- `--device`: Device (cpu, cuda, auto)
- `--compute-type`: Precision (int8, int8_float16, int16, float16, float32)
- `--host`: Host address (default: 127.0.0.1)
- `--port`: Port number (default: 8000)

## Troubleshooting

### "Python is not installed"
- **Windows:** Download from https://python.org/downloads/
- **Linux:** `sudo apt install python3 python3-pip python3-venv`
- **Mac:** `brew install python3`

### "Module not found" errors
Run the install script again:
```bash
./install.sh    # Linux/Mac
install.bat     # Windows
```

### Server won't start
1. Check if port 8000 is already in use
2. Try a different port: `python whisper-server.py --port 9000`
3. Check Python version (needs 3.8+): `python --version`

### Slow transcription
- Use a smaller model (tiny or base)
- Make sure you're using CPU optimizations (int8)
- Close other applications to free up RAM

### Out of memory
- Use a smaller model
- Close other applications
- For `large` models, you need at least 8GB RAM

## Testing the Server

### Using curl:
```bash
curl -X POST http://127.0.0.1:8000/v1/audio/transcriptions \
  -F "file=@test.wav" \
  -F "model=whisper-1"
```

### Health check:
```bash
curl http://127.0.0.1:8000/health
```

### Using Voice Transcriber:
1. Open Settings
2. Set endpoint to `http://127.0.0.1:8000/v1/audio/transcriptions`
3. Click "Test Connection"

## Performance Tips

### For Best Speed (CPU):
```bash
python whisper-server.py --model base --device cpu --compute-type int8
```

### For Best Accuracy (CPU):
```bash
python whisper-server.py --model medium --device cpu --compute-type int8
```

### For Best Speed (GPU):
```bash
python whisper-server.py --model large-v3 --device cuda --compute-type float16
```

## Running as Background Service

### Windows (Task Scheduler):
1. Create a batch file that activates venv and runs the server
2. Use Task Scheduler to run it at startup

### Linux (systemd):
Create `/etc/systemd/system/whisper-server.service`:
```ini
[Unit]
Description=Faster-Whisper Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/voice-transcriber/server
ExecStart=/path/to/voice-transcriber/server/venv/bin/python whisper-server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable whisper-server
sudo systemctl start whisper-server
```

## Uninstall

Simply delete the `server` directory. The virtual environment and all dependencies are contained within.

## Need Help?

Check the main project [README.md](../README.md) or [QUICKSTART.md](../QUICKSTART.md)
