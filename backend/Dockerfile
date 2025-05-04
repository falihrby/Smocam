# File: backend/Dockerfile

FROM python:3.11-slim-bullseye

WORKDIR /app

COPY . .

# Gunakan venv terisolasi & update sistem keamanan
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libglib2.0-0 libsm6 libxext6 libxrender1 && \
    python -m venv /opt/venv && \
    . /opt/venv/bin/activate && \
    pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt && \
    apt-get remove -y gcc && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8000

ENV PATH="/opt/venv/bin:$PATH"

CMD ["python", "app.py"]
