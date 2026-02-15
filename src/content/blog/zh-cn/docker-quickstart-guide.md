---
title: 'Docker 极简入门：从安装到部署的完全指南'
description: '15分钟掌握Docker核心概念与实战技巧，容器化你的应用'
date: '2026-02-19'
tags: ['Docker', '容器', 'DevOps', '部署', '教程']
authors: ['rownix']
draft: false
---

> **TL;DR**: 15分钟掌握Docker核心概念，从安装到生产部署的完整实战指南。

## 为什么需要Docker？

### 开发环境噩梦

```bash
# 经典问题："在我电脑上能跑"
$ python app.py
Error: ModuleNotFoundError: No module named 'xyz'

# 依赖版本冲突
$ pip install package-a  # 需要 requests==2.25
$ pip install package-b  # 需要 requests==2.30
# 💥 冲突！
```

### Docker解决方案

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
         ↓ 打包成镜像
    一次构建，到处运行
```

## 核心概念：3分钟理解Docker

### 1. 镜像 (Image) = 模板

```dockerfile
# Dockerfile - 定义镜像的"食谱"
FROM python:3.11-alpine  # 基础镜像

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt  # 安装依赖

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]  # 启动命令
```

### 2. 容器 (Container) = 运行实例

```bash
# 从镜像创建容器
$ docker run -d -p 5000:5000 my-app

# 查看运行中的容器
$ docker ps
CONTAINER ID   IMAGE     STATUS   PORTS
abc123         my-app    Up 5s    0.0.0.0:5000->5000/tcp
```

### 3. 仓库 (Registry) = 镜像存储

```bash
# 从Docker Hub拉取官方镜像
$ docker pull nginx:latest

# 推送自己的镜像
$ docker push username/my-app:v1.0
```

## 实战：容器化一个Web应用

### 步骤1：准备应用

```python
# app.py - Flask应用
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

### 步骤2：编写Dockerfile

```dockerfile
# 使用官方Python基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 先复制依赖文件（利用Docker缓存层）
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户（安全最佳实践）
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
```

### 步骤3：构建与运行

```bash
# 构建镜像（注意最后的点）
$ docker build -t my-flask-app:v1.0 .

# 查看本地镜像
$ docker images
REPOSITORY       TAG       SIZE
my-flask-app     v1.0      145MB

# 运行容器
$ docker run -d \
    --name my-app \
    -p 5000:5000 \
    -e ENV=production \
    my-flask-app:v1.0

# 测试
$ curl http://localhost:5000
{"message":"Hello from Docker!","env":"production"}
```

## Docker Compose：多容器编排

### 场景：Web应用 + 数据库 + Redis

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

  # 可选：Nginx反向代理
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
# 一键启动所有服务
$ docker-compose up -d

# 查看日志
$ docker-compose logs -f web

# 扩展Web服务到3个实例
$ docker-compose up -d --scale web=3

# 停止所有服务
$ docker-compose down

# 停止并删除数据卷
$ docker-compose down -v
```

## 生产部署最佳实践

### 1. 镜像优化

```dockerfile
# ❌ 优化前：1.2GB
FROM python:3.11
RUN apt-get update && apt-get install -y gcc

# ✅ 优化后：145MB
FROM python:3.11-alpine  # 使用Alpine基础镜像
RUN apk add --no-cache gcc musl-dev

# ✅ 更优：多阶段构建
FROM python:3.11-alpine AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-alpine
WORKDIR /app
# 只复制已安装的依赖
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "app.py"]
```

### 2. 安全加固

```dockerfile
# 使用非root用户
RUN useradd -m -u 1000 appuser
USER appuser

# 只读文件系统
$ docker run --read-only my-app

# 限制资源
$ docker run \
    --memory=512m \
    --cpus=1.0 \
    --pids-limit=100 \
    my-app
```

### 3. CI/CD集成

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

## 常用命令速查表

```bash
# 镜像管理
docker build -t name:tag .      # 构建镜像
docker images                    # 列出镜像
docker rmi image_id             # 删除镜像
docker pull image:tag           # 拉取镜像
docker push image:tag           # 推送镜像

# 容器管理
docker run -d -p 80:80 nginx    # 后台运行
docker ps                        # 运行中的容器
docker ps -a                     # 所有容器
docker stop container_id        # 停止容器
docker rm container_id          # 删除容器
docker logs -f container_id     # 查看日志
docker exec -it container bash  # 进入容器

# 数据卷
docker volume ls                # 列出卷
docker volume rm volume_name    # 删除卷
docker system prune             # 清理未使用资源

# 网络
docker network ls               # 列出网络
docker network create my-net    # 创建网络
```

## 常见问题排查

### 问题1：端口被占用

```bash
# 错误：bind: address already in use
$ docker run -p 5000:5000 my-app

# 解决：查找占用进程
$ lsof -i :5000
# 或更换端口
$ docker run -p 5001:5000 my-app
```

### 问题2：权限 denied

```bash
# Linux下需要sudo
$ sudo usermod -aG docker $USER
$ newgrp docker
```

### 问题3：镜像太大

```bash
# 使用dive工具分析
$ dive my-app:latest

# 优化建议
# 1. 使用alpine基础镜像
# 2. 多阶段构建
# 3. 合并RUN指令
# 4. 清理缓存
```

## 下一步学习

- **Kubernetes**: 容器编排平台
- **Docker Swarm**: Docker原生集群
- **Helm**: Kubernetes包管理器
- **Prometheus + Grafana**: 容器监控

---

**你开始使用Docker了吗？遇到什么坑？欢迎分享！** 👇
