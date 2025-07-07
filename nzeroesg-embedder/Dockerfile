FROM python:3.11-slim as runtime

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# pull model at build time - optional
ARG HUGGINGFACEHUB_API_TOKEN
ENV HUGGINGFACEHUB_API_TOKEN=${HUGGINGFACEHUB_API_TOKEN}
RUN python - <<'PY'
from sentence_transformers import SentenceTransformer
SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L6-v2")
PY

RUN find /usr/local/lib -name "*.a" -delete \
 && python -m compileall -q -f /usr/local/lib/python3.*/site-packages

# RUN find /usr/local/lib -name "*.a" -delete && \
#     python -m compileall -q -f /usr/local/lib/python3.*/site-packages && \
#     rm -rf /root/.cache/huggingface

# # adding curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY app.py .

EXPOSE 8002

# ---------- HEALTHCHECK ----------
# giving the model up to 60 s to load, then probe every 30 s
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -sf http://localhost:8002/health || exit 1


CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
