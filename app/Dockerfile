FROM python:3.11-slim
WORKDIR /app
# Install system dependencies (curl required for Docker health check)
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*
# Copy requirements first for better caching
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy application code
COPY app/ .
COPY frontend/ ./frontend/
# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1
EXPOSE 5000
CMD ["python", "app.py"]
