---
title: 'Dockerクイックスタートガイド：インストールからデプロイまで'
description: '15分でDockerの核心概念と実践スキルをマスターし、アプリケーションのコンテナ化を始めましょう'
date: '2026-02-19'
tags: ['Docker', 'Container', 'DevOps', 'Deployment', 'Tutorial']
authors: ['rownix']
draft: false
---

> **要約**: インストールから本番環境へのデプロイまで、この完全ガイドでDockerの主要概念を15分でマスターしましょう。

## なぜDockerが必要なのか？

### 開発環境の構築という悪夢

```bash
# よくある問題：「自分のマシンでは動くのに」
$ python app.py
Error: ModuleNotFoundError: No module named 'xyz'

# 依存パッケージのバージョン競合
$ pip install package-a  # requests==2.25 が必要
$ pip install package-b  # requests==2.30 が必要
# 💥 競合発生！
```

### Dockerによる解決策

```
┌─────────────────────────────────────┐
│  Dockerコンテナ                      │
│  ┌───────────────────────────────┐  │
│  │  アプリ + 依存関係             │  │
│  │  ├── Python 3.11              │  │
│  │  ├── Flask 2.0                │  │
│  │  └── requirements.txt         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Alpine Linux (5MB)           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ↓ イメージとしてパッケージ化
    一度ビルドすれば、どこでも動く
```

## 主要コンセプト：3分で理解するDocker

### 1. イメージ = テンプレート

```dockerfile
# Dockerfile - イメージをビルドするための「レシピ」
FROM python:3.11-alpine  # ベースイメージ

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt  # 依存関係のインストール

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]  # 起動コマンド
```

### 2. コンテナ = 実行インスタンス

```bash
# イメージからコンテナを作成
$ docker run -d -p 5000:5000 my-app

# 実行中のコンテナを確認
$ docker ps
CONTAINER ID   IMAGE     STATUS   PORTS
abc123         my-app    Up 5s    0.0.0.0:5000->5000/tcp
```

### 3. レジストリ = イメージの保存場所

```bash
# Docker Hubから公式イメージを取得
$ docker pull nginx:latest

# 自分のイメージをプッシュ
$ docker push username/my-app:v1.0
```

## ハンズオン：Webアプリケーションのコンテナ化

### ステップ 1：アプリケーションの準備

```python
# app.py - Flaskアプリケーション
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

### ステップ 2：Dockerfileの作成

```dockerfile
# 公式のPythonベースイメージを使用
FROM python:3.11-slim

# 作業ディレクトリの設定
WORKDIR /app

# 依存関係ファイルを先にコピー（Dockerのキャッシュレイヤーを活用）
COPY requirements.txt .

# 依存関係のインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# 非ルートユーザーの作成（セキュリティのベストプラクティス）
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# ポートの公開
EXPOSE 5000

# アプリケーションの起動
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
```

### ステップ 3：ビルドと実行

```bash
# イメージのビルド（末尾のドットを忘れずに）
$ docker build -t my-flask-app:v1.0 .

# ローカルイメージの確認
$ docker images
REPOSITORY       TAG       SIZE
my-flask-app     v1.0      145MB

# コンテナの実行
$ docker run -d \
    --name my-app \
    -p 5000:5000 \
    -e ENV=production \
    my-flask-app:v1.0

# テスト
$ curl http://localhost:5000
{"message":"Hello from Docker!","env":"production"}
```

## Docker Compose：マルチコンテナのオーケストレーション

### シナリオ：Webアプリ + データベース + Redis

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - '5000:5000'
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

  # オプション：Nginxリバースプロキシ
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
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
# 全サービスを一つのコマンドで起動
$ docker-compose up -d

# ログを表示
$ docker-compose logs -f web

# Webサービスを3つのインスタンスにスケール
$ docker-compose up -d --scale web=3

# 全サービスを停止
$ docker-compose down

# 停止してデータボリュームも削除
$ docker-compose down -v
```

## 本番環境デプロイのベストプラクティス

### 1. イメージの最適化

```dockerfile
# ❌ 最適化前：1.2GB
FROM python:3.11
RUN apt-get update && apt-get install -y gcc

# ✅ 最適化後：145MB
FROM python:3.11-alpine  # Alpineベースイメージを使用
RUN apk add --no-cache gcc musl-dev

# ✅ さらに推奨：マルチステージビルド
FROM python:3.11-alpine AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-alpine
WORKDIR /app
# インストール済みの依存関係のみをコピー
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "app.py"]
```

### 2. セキュリティの強化

```dockerfile
# 非ルートユーザーを使用
RUN useradd -m -u 1000 appuser
USER appuser

# 読み取り専用のファイルシステム
$ docker run --read-only my-app

# リソース制限
$ docker run \
    --memory=512m \
    --cpus=1.0 \
    --pids-limit=100 \
    my-app
```

### 3. CI/CDとの統合

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

## よく使うコマンドのチートシート

```bash
# イメージ管理
docker build -t name:tag .      # イメージをビルド
docker images                    # イメージ一覧
docker rmi image_id             # イメージを削除
docker pull image:tag           # イメージを取得
docker push image:tag           # イメージを送信

# コンテナ管理
docker run -d -p 80:80 nginx    # バックグラウンドで実行
docker ps                        # 実行中のコンテナ
docker ps -a                     # 全コンテナ（停止中も含む）
docker stop container_id        # コンテナを停止
docker rm container_id          # コンテナを削除
docker logs -f container_id     # ログを確認
docker exec -it container bash  # コンテナ内でシェルを実行

# ボリューム
docker volume ls                # ボリューム一覧
docker volume rm volume_name    # ボリュームを削除
docker system prune             # 未使用のリソースをクリーンアップ

# ネットワーク
docker network ls               # ネットワーク一覧
docker network create my-net    # ネットワークを作成
```

## よくある問題のトラブルシューティング

### 問題 1：ポートが既に使用されている

```bash
# エラー: bind: address already in use
$ docker run -p 5000:5000 my-app

# 解決策：ポートを使用しているプロセスを見つける
$ lsof -i :5000
# または、別のポートを使用する
$ docker run -p 5001:5000 my-app
```

### 問題 2：権限エラー（Permission Denied）

```bash
# Linuxではsudoが必要な場合があります
$ sudo usermod -aG docker $USER
$ newgrp docker
```

### 問題 3：イメージが大きすぎる

```bash
# diveツールを使用して分析
$ dive my-app:latest

# 最適化のヒント
# 1. alpineベースイメージを使用する
# 2. マルチステージビルドを活用する
# 3. RUNコマンドをまとめる
# 4. キャッシュをクリーンアップする
```

## 次のステップ

- **Kubernetes**: コンテナオーケストレーションプラットフォーム
- **Docker Swarm**: Docker標準のクラスタリングツール
- **Helm**: Kubernetesのパッケージマネージャー
- **Prometheus + Grafana**: コンテナのモニタリング

---

**Dockerを使い始めましたか？どのような課題に直面しましたか？ぜひあなたの経験を共有してください！** 👇
