# Whisper Model Guide

## How Model Selection Works

### Important: Two Different "Model" Settings

1. **Docker Server Model** (what actually matters)
   - Set in `docker-compose.yml`
   - Controls which model the server loads
   - Downloads automatically from Hugging Face when container starts

2. **App Settings Model** (just metadata)
   - The "Model" field in the Voice Transcriber UI
   - Sent to the API for compatibility
   - Does NOT control which model is used

## Changing Models

### Edit docker-compose.yml:

```yaml
services:
  whisper-server:
    # Change --model here:
    command: python whisper-server.py --host 0.0.0.0 --port 8000 --model large-v3 --device cpu --compute-type int8
```

### Available Models:

| Model | Size | Speed | Accuracy | Download Time |
|-------|------|-------|----------|---------------|
| `tiny` | ~75 MB | Very Fast | Low | ~5 seconds |
| `base` | ~145 MB | Fast | Good | ~10 seconds |
| `small` | ~466 MB | Medium | Better | ~30 seconds |
| `medium` | ~1.5 GB | Slow | High | ~2 minutes |
| `large-v2` | ~3 GB | Very Slow | Very High | ~5 minutes |
| `large-v3` | ~3 GB | Very Slow | Best | ~5 minutes |

*Download times vary based on internet speed*

### Restart After Changing:

```bash
cd server
docker-compose down
docker-compose up -d
```

## Model Download Process

1. **First Start**: Container starts → Downloads model from Hugging Face → Loads into memory → Server ready
2. **Subsequent Starts**: Uses cached model (much faster!)

### Where are models cached?

Models are stored in a Docker volume: `whisper-models`

This means:
- ✅ Downloaded only once
- ✅ Persists between restarts
- ✅ Shared if you run multiple containers

### Check Download Progress:

```bash
docker-compose logs -f
```

Look for:
- `Loading Whisper model: large-v3 on cpu with int8` - Starting download
- `Model loaded successfully` - Ready to use!

## Recommended Models

### For Testing / Development:
**`base`** - Good balance of speed and accuracy

### For Production:
**`small`** or **`medium`** - Better accuracy, acceptable speed

### For Best Quality:
**`large-v3`** - Best transcription, but slower (requires patience!)

## GPU Acceleration

To use GPU (much faster with large models):

1. Install nvidia-docker
2. Edit `docker-compose.yml`:

```yaml
services:
  whisper-server:
    command: python whisper-server.py --host 0.0.0.0 --port 8000 --model large-v3 --device cuda --compute-type float16
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

3. Restart: `docker-compose down && docker-compose up -d`

## Troubleshooting

### Model Download Stuck?

Check internet connection and try again:
```bash
docker-compose down
docker-compose up -d
```

### Out of Memory?

Try a smaller model (base or small) or increase Docker memory limit.

### Want to Clear Cache?

```bash
docker-compose down
docker volume rm server_whisper-models
docker-compose up -d
```

This will re-download all models next time.
