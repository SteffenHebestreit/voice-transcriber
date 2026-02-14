#!/bin/bash
# Start Faster-Whisper Server with Docker

echo "Starting Faster-Whisper Server with Docker..."
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    echo
    echo "Please install Docker from:"
    echo "  Ubuntu/Debian: https://docs.docker.com/engine/install/ubuntu/"
    echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
    exit 1
fi

echo "Building Docker image (first time only, may take a few minutes)..."
docker-compose up --build
