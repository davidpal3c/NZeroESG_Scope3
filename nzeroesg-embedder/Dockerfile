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

COPY app.py .

EXPOSE 8002
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
