FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir \
    torch==2.2.2+cpu \
    torchaudio==2.2.2+cpu \
    --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir \
    fastapi==0.115.0 \
    uvicorn==0.30.6 \
    librosa==0.10.2 \
    numpy==1.26.4 \
    scipy==1.13.1 \
    python-multipart==0.0.9 \
    soundfile==0.12.1 \
    torchcrepe==0.0.23 \
    matplotlib==3.9.2 \
    transformers==4.44.2 \
    einops==0.8.0 \
    resampy==0.4.3 \
    scikit-learn==1.5.2 \
    pandas==2.2.3 \
    tqdm==4.66.5 \
    python-dotenv==1.0.1 \
    noisereduce==3.0.3 \
    mir_eval==0.7.0 \
    seaborn==0.13.2

COPY . .
RUN mkdir -p /tmp/audio_uploads
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]