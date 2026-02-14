# 🚀 Quick Start - Voice Transcriber

## What Changed? ✨

**Good news!** The app now uses **built-in audio recording** - no sox or external dependencies needed!

## Prerequisites

1. **Docker Desktop** - For the Whisper server
2. **Node.js** - For building the app

That's it! No sox, no Python, no complicated setup.

## Setup (3 Easy Steps)

### 1️⃣ Install Node Dependencies

```bash
cd "d:\new project"
npm install
```

### 2️⃣ Start the Whisper Server

```bash
cd server
docker-compose up -d
```

The server will run at `http://localhost:8000`

### 3️⃣ Build and Run the App

```bash
npm run dev
```

## Configuration

Open the app settings and configure:

- **Endpoint URL:** `http://localhost:8000` ← IMPORTANT: Just the base URL!
- **API Key:** (leave empty)
- **Model:** `large-v3`

Click "Test Connection" - should show ✓ success!

## First Recording

1. Press `Ctrl+Shift+T` (default hotkey)
2. **Grant microphone permission** when prompted
3. Speak into your microphone
4. Press the hotkey again to stop
5. Wait for transcription
6. Text will be inserted automatically!

## Troubleshooting

### ❌ "Connection failed"

**Fix:** Make sure endpoint is `http://localhost:8000` (remove `/v1/audio/transcriptions`)

### ❌ No microphone prompt / recording fails

**Fix:**
1. Check system microphone permissions
2. Restart the app
3. Try clicking in the app window before pressing hotkey

### ❌ Docker server not starting

**Fix:**
```bash
cd server
docker-compose down
docker-compose up --build
```

## How It Works Now

### Before (Required sox) ❌
```
App → sox.exe → Record Audio → Save → Send to Whisper
```

### Now (Built-in) ✅
```
App → MediaRecorder API → Record Audio → Save → Send to Whisper
```

**Benefits:**
- ✅ No external dependencies
- ✅ Works on all platforms
- ✅ Easier to package and distribute
- ✅ No PATH configuration needed

## Need Help?

Check the full [SETUP.md](SETUP.md) for detailed troubleshooting.

## What's Running Where?

- **Whisper Server:** Docker container (port 8000)
- **Electron App:** Your desktop (uses system microphone)
- **Audio Recording:** Built into Electron (MediaRecorder API)

Everything is self-contained! 🎉
