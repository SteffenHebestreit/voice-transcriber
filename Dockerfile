FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY whisper-server.py .

# Expose port
EXPOSE 8000

# Run server
CMD ["python", "whisper-server.py", "--host", "0.0.0.0", "--port", "8000", "--model", "base", "--device", "cpu", "--compute-type", "int8"]
