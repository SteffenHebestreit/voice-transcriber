# Using Docker (No Python Installation Required)

If you don't want to install Python, you can use Docker instead!

## Prerequisites

Install Docker Desktop:
- Windows: https://www.docker.com/products/docker-desktop/
- Make sure to enable WSL 2 backend during installation

## Quick Start

1. **Start the Server:**
   ```cmd
   cd "d:\new project\server"
   docker-compose up
   ```

   Or use the batch file:
   ```cmd
   start-docker.bat
   ```

2. **Configure Voice Transcriber:**
   - Endpoint: `http://localhost:8000` (NOT the full path!)
   - API Key: (leave empty)
   - Model: any value (e.g., "large-v3")
   - Click "Test Connection"

3. **Stop the Server:**
   - Press `Ctrl+C` in the terminal
   - Or run: `docker-compose down`

## Advantages

✅ No Python installation needed
✅ Isolated environment (no conflicts)
✅ Same experience on all platforms
✅ Easy to remove (just delete the image)

## Different Models

Edit `docker-compose.yml` and change the `CMD` line:

```yaml
CMD ["python", "whisper-server.py", "--model", "small", ...]
```

Available models: tiny, base, small, medium, large-v3

## Run in Background

```cmd
docker-compose up -d
```

To stop:
```cmd
docker-compose down
```

## Check Logs

```cmd
docker-compose logs -f
```
