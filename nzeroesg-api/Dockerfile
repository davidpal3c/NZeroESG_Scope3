FROM python:3.12-slim AS builder

WORKDIR /app

# install build tools for any wheels requiring compilation 
RUN apt-get update && apt-get install -y gcc build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

# final runtime image
FROM python:3.12-slim AS runtime

WORKDIR /app

COPY --from=builder /install /usr/local
COPY main.py .
COPY config.py .
COPY agent/ ./agent/
COPY api/ ./api/
COPY data/ ./data/
COPY rag/ ./rag/
COPY scripts/ ./scripts/   

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]



### ----------------------

# # backend/Dockerfile
# FROM python:3.11-slim

# # Set working directory
# WORKDIR /app

# ARG NZEROESG_CLIENT_URL
# ENV NZEROESG_CLIENT_URL=${NZEROESG_CLIENT_URL}

# # Install system dependencies
# RUN apt-get update && apt-get install -y gcc build-essential && rm -rf /var/lib/apt/lists/*

# # Install dependencies
# COPY requirements.txt .  
# RUN pip install --no-cache-dir -r requirements.txt

# # Copy application code
# COPY . .

# # Expose FastAPI port
# EXPOSE 8000

# # Start the app
# # CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
