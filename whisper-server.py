#!/usr/bin/env python3
"""
Simple Whisper API server using faster-whisper
Compatible with OpenAI's Whisper API format
"""

import argparse
import logging
import os
from typing import Optional

try:
    from fastapi import FastAPI, File, UploadFile, Form, HTTPException
    from fastapi.responses import JSONResponse
    import uvicorn
    from faster_whisper import WhisperModel
except ImportError as e:
    print("ERROR: Required packages not installed.")
    print("\nPlease install dependencies:")
    print("  pip install faster-whisper fastapi uvicorn python-multipart")
    print("\nOptional for better performance:")
    print("  pip install torch  # For GPU support")
    exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Faster-Whisper API Server")

# Global model instance
model: Optional[WhisperModel] = None
model_size: str = "base"
device: str = "cpu"
compute_type: str = "int8"


def load_model(size: str, dev: str, comp_type: str):
    """Load the Whisper model"""
    global model, model_size, device, compute_type

    model_size = size
    device = dev
    compute_type = comp_type

    logger.info(f"Loading Whisper model: {model_size} on {device} with {compute_type}")

    try:
        model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type
        )
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model": model_size,
        "device": device,
        "compute_type": compute_type
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/v1/audio/transcriptions")
async def transcribe_audio(
    file: UploadFile = File(...),
    model: str = Form(default="whisper-1"),
    language: Optional[str] = Form(default=None),
    prompt: Optional[str] = Form(default=None),
    response_format: str = Form(default="json"),
    temperature: float = Form(default=0.0)
):
    """
    Transcribe audio file
    Compatible with OpenAI Whisper API format
    """
    if not globals()['model']:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # Save uploaded file temporarily
        temp_file = f"/tmp/whisper_upload_{os.getpid()}.{file.filename.split('.')[-1]}"

        with open(temp_file, "wb") as f:
            content = await file.read()
            f.write(content)

        logger.info(f"Processing audio file: {file.filename} ({len(content)} bytes)")

        # Transcribe
        segments, info = globals()['model'].transcribe(
            temp_file,
            language=language,
            initial_prompt=prompt,
            temperature=temperature,
            beam_size=5
        )

        # Collect all segments
        transcription = " ".join([segment.text for segment in segments])

        # Clean up temp file
        try:
            os.remove(temp_file)
        except:
            pass

        logger.info(f"Transcription complete: {len(transcription)} characters")

        # Return in OpenAI format
        return JSONResponse({
            "text": transcription.strip(),
            "language": info.language,
            "duration": info.duration,
            "segments": info.all_language_probs if hasattr(info, 'all_language_probs') else None
        })

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def main():
    parser = argparse.ArgumentParser(description="Faster-Whisper API Server")
    parser.add_argument(
        "--model",
        type=str,
        default="base",
        choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        help="Whisper model size (default: base)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cpu",
        choices=["cpu", "cuda", "auto"],
        help="Device to use (default: cpu)"
    )
    parser.add_argument(
        "--compute-type",
        type=str,
        default="int8",
        choices=["int8", "int8_float16", "int16", "float16", "float32"],
        help="Compute type (default: int8 for CPU)"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Host to bind to (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to (default: 8000)"
    )

    args = parser.parse_args()

    # Load model
    load_model(args.model, args.device, args.compute_type)

    # Start server
    logger.info(f"Starting server on {args.host}:{args.port}")
    logger.info(f"API endpoint: http://{args.host}:{args.port}/v1/audio/transcriptions")

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info"
    )


if __name__ == "__main__":
    main()
