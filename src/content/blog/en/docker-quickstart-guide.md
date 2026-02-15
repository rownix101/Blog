---
title: 'Docker Quickstart Guide: From Installation to Deployment'
description: 'Master Docker core concepts and practical skills in 15 minutes, containerize your applications'
date: '2026-02-19'
tags: ['Docker', 'Container', 'DevOps', 'Deployment', 'Tutorial']
authors: ['rownix']
draft: false
---

> **TL;DR**: Master Docker core concepts in 15 minutes with this complete guide from installation to production deployment.

## Why Do You Need Docker?

### The Development Environment Nightmare

```bash
# Classic problem: "It works on my machine"
$ python app.py
Error: ModuleNotFoundError: No module named 'xyz'

# Dependency version conflicts
$ pip install package-a  # requires requests==2.25
$ pip install package-b  # requires requests==2.30
# 💥 Conflict!
```

### The Docker Solution

```
┌─────────────────────────────────────┐
│  Docker Container                    │
│  ┌───────────────────────────────┐  │
│  │  Your App + Dependencies      │  │
│  │  ├── Python 3.11              │  │
│  │  ├── Flask 2.0                │  │
│  │  └── requirements.txt         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Alpine Linux (5MB)           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ↓ Package as Image
    Build once, run anywhere
```

## Core Concepts: Understand Docker in 3 Minutes

### 1. Image = Template

```dockerfile
# Dockerfile - The "recipe" for building an image
FROM python:3.11-alpine  # Base image

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt  # Install dependencies

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]  # Startup command
```

### 2. Container = Running Instance

```bash
# Create a container from an image
$ docker run -d -p 5000:5000 my-app

# View running containers
$ docker ps
CONTAINER ID   IMAGE     STATUS   PORTS
abc123         my-app    Up 5s    0.0.0.0:5000->5000/tcp
```

### 3. Registry = Image Storage

```bash
# Pull official image from Docker Hub
$ docker pull nginx:latest

# Push your own image
$ docker push username/my-app:v1.0
```

## Hands-on: Containerize a Web Application

### Step 1: Prepare the Application

```python
# app.py - Flask application
from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def hello():
    return {
        'message': 'Hello from Docker!',
        'env': os.environ.get('ENV', 'development')
    }

@app.route('/health')
def health():
    return {'status': 'healthy'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

```txt
# requirements.txt
flask==3.0.0
gunicorn==21.2.0
```

### Step 2: Write the Dockerfile

```dockerfile
# Use official Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy dependency file first (leverage Docker cache layer)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user (security best practice)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Start application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
```

### Step 3: Build and Run

```bash
# Build image (note the trailing dot)
$ docker build -t my-flask-app:v1.0 .

# View local images
$ docker images
REPOSITORY       TAG       SIZE
my-flask-app     v1.0      145MB

# Run container
$ docker run -d \
    --name my-app \
    -p 5000:5000 \
    -e ENV=production \
    my-flask-app:v1.0

# Test
$ curl http://localhost:5000
{"message":"Hello from Docker!","env":"production"}
```

## Docker Compose: Multi-Container Orchestration

### Scenario: Web App + Database + Redis

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - web
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

```bash
# Start all services with one command
$ docker-compose up -d

# View logs
$ docker-compose logs -f web

# Scale web service to 3 instances
$ docker-compose up -d --scale web=3

# Stop all services
$ docker-compose down

# Stop and remove data volumes
$ docker-compose down -v
```

## Production Deployment Best Practices

### 1. Image Optimization

```dockerfile
# ❌ Before optimization: 1.2GB
FROM python:3.11
RUN apt-get update && apt-get install -y gcc

# ✅ After optimization: 145MB
FROM python:3.11-alpine  # Use Alpine base image
RUN apk add --no-cache gcc musl-dev

# ✅ Better: Multi-stage build
FROM python:3.11-alpine AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-alpine
WORKDIR /app
# Only copy installed dependencies
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "app.py"]
```

### 2. Security Hardening

```dockerfile
# Use non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Read-only filesystem
$ docker run --read-only my-app

# Resource limits
$ docker run \
    --memory=512m \
    --cpus=1.0 \
    --pids-limit=100 \
    my-app
```

### 3. CI/CD Integration

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Common Commands Cheat Sheet

```bash
# Image management
docker build -t name:tag .      # Build image
docker images                    # List images
docker rmi image_id             # Remove image
docker pull image:tag           # Pull image
docker push image:tag           # Push image

# Container management
docker run -d -p 80:80 nginx    # Run in background
docker ps                        # Running containers
docker ps -a                     # All containers
docker stop container_id        # Stop container
docker rm container_id          # Remove container
docker logs -f container_id     # View logs
docker exec -it container bash  # Enter container

# Volumes
docker volume ls                # List volumes
docker volume rm volume_name    # Remove volume
docker system prune             # Clean up unused resources

# Networks
docker network ls               # List networks
docker network create my-net    # Create network
```

## Troubleshooting Common Issues

### Issue 1: Port Already in Use

```bash
# Error: bind: address already in use
$ docker run -p 5000:5000 my-app

# Solution: Find the process using the port
$ lsof -i :5000
# Or use a different port
$ docker run -p 5001:5000 my-app
```

### Issue 2: Permission Denied

```bash
# On Linux, you may need sudo
$ sudo usermod -aG docker $USER
$ newgrp docker
```

### Issue 3: Image Too Large

```bash
# Use dive tool to analyze
$ dive my-app:latest

# Optimization tips
# 1. Use alpine base image
# 2. Multi-stage build
# 3. Merge RUN commands
# 4. Clean up cache
```

## Next Steps

- **Kubernetes**: Container orchestration platform
- **Docker Swarm**: Docker-native clustering
- **Helm**: Kubernetes package manager
- **Prometheus + Grafana**: Container monitoring

---

**Have you started using Docker? What challenges did you face? Share your experience!** 👇
