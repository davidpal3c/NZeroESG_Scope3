## build
FROM python:3.12-slim AS builder

# Install OS deps needed for wheels that still require compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp/build

# cpu-only torch
ARG TORCH_VERSION=2.2.2
RUN pip install --no-cache-dir \
        --index-url=https://download.pytorch.org/whl/cpu \
        torch==${TORCH_VERSION}


## runtime
FROM python:3.12-slim AS runtime

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

ARG HUGGINGFACEHUB_API_TOKEN
ENV HUGGINGFACEHUB_API_TOKEN=${HUGGINGFACEHUB_API_TOKEN}

# copy pre-built wheels & core libs from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages/ \
                    /usr/local/lib/python3.12/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# pull model at build time to warm up the cache
RUN python - <<'PY'
from sentence_transformers import SentenceTransformer
SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L6-v2")
PY

RUN find /usr/local/lib -name "*.a" -delete \
 && python -m compileall -q -f /usr/local/lib/python3.12/site-packages \
 && rm -rf /root/.cache/huggingface

COPY app.py .

EXPOSE 8002
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD \
  curl -sf http://localhost:8002/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]





### ------ original ----
# FROM python:3.11-slim as runtime

# WORKDIR /app
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt


# # pull model at build time - optional
# ARG HUGGINGFACEHUB_API_TOKEN
# ENV HUGGINGFACEHUB_API_TOKEN=${HUGGINGFACEHUB_API_TOKEN}
# RUN python - <<'PY'
# from sentence_transformers import SentenceTransformer
# SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L6-v2")
# PY

# RUN find /usr/local/lib -name "*.a" -delete \
#  && python -m compileall -q -f /usr/local/lib/python3.*/site-packages

# # RUN find /usr/local/lib -name "*.a" -delete && \
# #     python -m compileall -q -f /usr/local/lib/python3.*/site-packages && \
# #     rm -rf /root/.cache/huggingface

# COPY app.py .

# EXPOSE 8002
# CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
