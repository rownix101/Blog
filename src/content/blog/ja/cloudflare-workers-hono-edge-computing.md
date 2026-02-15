---
title: 'Cloudflare Workers + Hono：エッジコンピューティングの黄金コンビ'
description: 'フルスクラッチで高性能エッジAPIを構築。Expressより10倍速い秘密であるHonoフレームワークを徹底解説。'
date: '2026-02-16'
tags: ['Cloudflare', 'Hono', 'Edge Computing', 'Serverless', 'TypeScript']
authors: ['rownix']
draft: false
---

> **要約**: Hono と Cloudflare Workers を組み合わせることで、エッジノードでの 0ms コールドスタートを実現できる。従来の Express + VPS 構成と比較して 10倍高速、かつコストを 90% 削減可能だ。

## なぜエッジコンピューティングなのか？

### 従来のアーキテクチャの課題

```
ユーザーのリクエスト → DNS 解決 → CDN → オリジンサーバー → データベース → レスポンス
               ↓
         レイテンシ: 200-500ms
```

問題点：

- **物理的な距離**: ユーザーが日本にいても、サーバーが米国にある。
- **遅いコールドスタート**: サーバーレス関数が起動するまでに 1〜3 秒かかる。
- **高コスト**: 高い可用性を維持するために複数のサーバーを管理する必要がある。

### エッジコンピューティングの利点

```
ユーザーのリクエスト → エッジノード（世界 300 以上の都市） → 即時レスポンス
               ↓
         レイテンシ: 50ms 未満
```

Cloudflare Workers ならではのメリット：

- ✅ **0ms コールドスタート**: V8 Isolate テクノロジーを採用。
- ✅ **グローバル展開**: 300 拠点以上のエッジノード。
- ✅ **無料枠**: 1 日 10 万リクエストまで無料。
- ✅ **標準 Web API**: ネイティブの Request/Response API を使用。

## Hono：エッジのために生まれたフレームワーク

### なぜ Hono を選ぶのか？

| フレームワーク | 起動時間 | ファイルサイズ | Workers 対応        | ルーティング性能 |
| -------------- | -------- | -------------- | ------------------- | ---------------- |
| **Hono**       | 0ms      | 12KB           | ✅ ネイティブ       | 最速             |
| Express        | 50ms以上 | 500KB          | ❌ アダプターが必要 | 標準的           |
| Fastify        | 30ms以上 | 300KB          | ❌ アダプターが必要 | 高速             |
| Itty Router    | 0ms      | 3KB            | ✅ ネイティブ       | 高速             |

Hono の設計思想：**軽量、高速、型安全**

### クイックスタート

```bash
# プロジェクトの作成
npm create cloudflare@latest my-hono-app -- --template hono

# ディレクトリへ移動
cd my-hono-app

# 依存関係のインストール
npm install

# 開発モード
npm run dev
```

### Hello World

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, name: 'User ' + id })
})

export default app
```

**Workers へのデプロイ**:

```bash
npm run deploy
# ✨ Successfully published your script
```

## 実践：REST API の構築

### プロジェクト構造

```
src/
├── index.ts           # エントリーポイント
├── routes/
│   ├── users.ts       # ユーザー関連ルート
│   ├── posts.ts       # 投稿関連ルート
│   └── index.ts       # ルート集約
├── middleware/
│   ├── auth.ts        # 認証ミドルウェア
│   ├── cors.ts        # CORS 処理
│   └── logger.ts      # ログ出力
├── types/
│   └── index.ts       # 型定義
└── utils/
    └── db.ts          # データベース接続
```

### コアコード

```typescript
// src/index.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { usersRoute } from './routes/users'
import { postsRoute } from './routes/posts'

const app = new Hono()

// グローバルミドルウェア
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['https://mydomain.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use('*', prettyJSON())

// ヘルスチェック
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// ルートのマウント
app.route('/api/users', usersRoute)
app.route('/api/posts', postsRoute)

// 404 ハンドラー
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

// エラーハンドラー
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
```

## パフォーマンスベンチマーク

```bash
wrk -t12 -c400 -d30s https://my-api.username.workers.dev/api/users
```

| 指標             | Express (VPS) | Hono (Workers) | 改善率     |
| ---------------- | ------------- | -------------- | ---------- |
| リクエスト数/秒  | 3,500         | 45,000         | **12.8倍** |
| P99 レイテンシ   | 450ms         | 18ms           | **25倍**   |
| コールドスタート | 2-5秒         | 0ms            | **∞**      |
| 月額コスト       | $20           | $0             | **無料**   |

## まとめ

### ユースケース

✅ **最適なケース**:

- REST API バックエンド
- GraphQL サーバー
- リアルタイムアプリケーション (WebSocket)
- ファイル処理サービス
- エッジレンダリング

⚠️ **注意が必要なケース**:

- 長時間の CPU 負荷がかかる処理 (50ms 以上)
- 大容量ファイルの処理 (100MB 以上)
- 特定の Node.js ネイティブモジュールが必要なプロジェクト

### コスト比較（月間 100 万リクエスト）

| ソリューション   | コンピューティング | データベース | 帯域幅 | 合計   |
| ---------------- | ------------------ | ------------ | ------ | ------ |
| VPS (2C4G)       | $20                | $15          | $10    | $45    |
| AWS Lambda       | $18                | $15          | $15    | $48    |
| **Workers + D1** | **$0**             | **$0**       | **$0** | **$0** |

**Cloudflare 無料枠**:

- 10 万リクエスト/日
- D1: 50 万行の読み取り/日
- R2: 10GB ストレージ

個人のプロジェクトや小規模なアプリケーションであれば、**完全に無料**で運用できる。

---

**あなたの API はエッジで動いていますか？どのような課題に直面しましたか？ぜひコメントで教えてください！** 👇
