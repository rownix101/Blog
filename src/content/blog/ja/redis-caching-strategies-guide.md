---
title: 'Redis キャッシュ戦略：基本から高並列最適化まで'
description: 'Redis キャッシュのデザインパターン、キャッシュペネトレーション・ブレイクダウン・アバランシェ対策、そして高並列シナリオにおけるベストプラクティスをマスターしましょう。'
date: '2026-02-22'
tags: ['Redis', 'Caching', 'Performance', 'High Concurrency', 'Database']
authors: ['rownix']
draft: false
---

> **TL;DR**: Redis キャッシュ戦略を深掘りし、3大キャッシュ問題を解決する方法を学びます。可用性とパフォーマンスに優れたキャッシュアーキテクチャを構築しましょう。

## なぜキャッシュが必要なのか？

### パフォーマンス比較

```
データアクセスのレイテンシ比較:
┌─────────────────┬─────────────────┐
│ ストレージ媒体  │ レイテンシ      │
├─────────────────┼─────────────────┤
│ L1 キャッシュ   │ 1ns             │
│ L2 キャッシュ   │ 4ns             │
│ メモリ (RAM)    │ 100ns           │
│ Redis           │ 1-5ms (ネットワーク) │
│ SSD             │ 100μs           │
│ HDD             │ 10ms            │
│ DB クエリ       │ 20-100ms        │
└─────────────────┴─────────────────┘

Redis は MySQL より 10〜100 倍高速です
```

### キャッシュの価値

```
┌─────────────────────────────────────────┐
│        一般的な Web アプリケーション          │
├─────────────────────────────────────────┤
│  リクエスト → API ゲートウェイ → アプリ → データベース │
└─────────────────────────────────────────┘
         ↓ キャッシュあり
┌─────────────────────────────────────────┐
│  リクエスト → API ゲートウェイ → キャッシュ → ヒット？ │
│                         ↓ いいえ          │
│                      データベース → キャッシュへの書き込み
└─────────────────────────────────────────┘

QPS の向上: 1000 → 100,000+ (100倍)
データベースの負荷: 100% → 5%
```

## Redis の基本：5分で始める

### 主要なデータ型

```bash
# String（文字列） - 最も一般的に使用されます
SET user:1001:name "Alice"
SET user:1001:age 25 EX 3600  # 1時間で期限切れ
GET user:1001:name
MGET user:1001:name user:1001:age  # 一括取得

# Hash（ハッシュ） - オブジェクトの保存
HSET user:1001 name "Alice" age 25 city "Beijing"
HGET user:1001 name
HGETALL user:1001

# List（リスト） - キューやスタック
LPUSH queue:tasks "task1" "task2"
RPOP queue:tasks  # タスクを消費

# Set（セット） - 重複排除や関係性の管理
SADD user:1001:tags "developer" "blogger"
SISMEMBER user:1001:tags "developer"

# Sorted Set（ソート済みセット） - ランキング
ZADD leaderboard 100 "player1" 85 "player2"
ZREVRANGE leaderboard 0 9 WITHSCORES  # 上位 10 名
```

### Node.js での接続例

```typescript
// lib/redis.ts
import { Redis } from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
})

// 接続イベント
redis.on('connect', () => console.log('Redis connected'))
redis.on('error', (err) => console.error('Redis error:', err))

export default redis
```

## キャッシュ戦略のパターン

### 1. Cache-Aside（遅延読み込み）

```typescript
// 最も一般的な戦略：アプリケーションがキャッシュを管理します
class CacheAsideService {
  async getUser(userId: string) {
    const cacheKey = `user:${userId}`

    // 1. まずキャッシュを確認
    let user = await redis.get(cacheKey)
    if (user) {
      return JSON.parse(user) // キャッシュヒット
    }

    // 2. キャッシュミス、データベースに問い合わせ
    user = await db.user.findById(userId)
    if (!user) {
      return null // データベースにも存在しない
    }

    // 3. キャッシュに書き込み（有効期限付き）
    await redis.setex(cacheKey, 3600, JSON.stringify(user))

    return user
  }

  async updateUser(userId: string, data: any) {
    // 1. データベースを更新
    const user = await db.user.update(userId, data)

    // 2. キャッシュを削除（または更新）
    await redis.del(`user:${userId}`)

    return user
  }
}
```

**ユースケース**: 読み取り負荷が高く、結果整合性が許容される場合

### 2. Read-Through（透過的キャッシュ）

```typescript
// キャッシュがデータアクセスをプロキシします
class ReadThroughService {
  async getUser(userId: string) {
    const cacheKey = `user:${userId}`

    // Redis の getOrSet パターンを使用
    const user = await redis.get(cacheKey)
    if (user) return JSON.parse(user)

    // キャッシュミス時、キャッシュレイヤーが自動的にロード
    const dbUser = await this.loadFromDatabase(userId)
    await redis.setex(cacheKey, 3600, JSON.stringify(dbUser))

    return dbUser
  }

  private async loadFromDatabase(userId: string) {
    return db.user.findById(userId)
  }
}
```

### 3. Write-Through（同期書き込み）

```typescript
// 書き込み時にキャッシュを同期的に更新
class WriteThroughService {
  async createUser(data: any) {
    // 1. データベースに書き込み
    const user = await db.user.create(data)

    // 2. キャッシュに同期的に書き込み
    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(user))

    return user
  }
}
```

### 4. Write-Behind（非同期書き込み）

```typescript
// まずキャッシュに書き込み、後でデータベースに一括で非同期書き込み
class WriteBehindService {
  async updateUser(userId: string, data: any) {
    // 1. キャッシュのみ更新
    const cacheKey = `user:${userId}`
    await redis.setex(cacheKey, 3600, JSON.stringify(data))

    // 2. 非同期キューに追加
    await redis.lpush(
      'pending_updates',
      JSON.stringify({
        type: 'UPDATE_USER',
        userId,
        data,
        timestamp: Date.now(),
      }),
    )

    // 3. バックグラウンドワーカーが定期的にデータベースへ一括書き込み
    return data
  }
}

// バックグラウンドワーカー
async function flushPendingUpdates() {
  const updates = await redis.lrange('pending_updates', 0, 99)

  if (updates.length === 0) return

  // データベースへ一括書き込み
  await db.user.batchUpdate(updates.map((u) => JSON.parse(u)))

  // 処理済みのメッセージを削除
  await redis.ltrim('pending_updates', updates.length, -1)
}

// 5秒ごとに実行
setInterval(flushPendingUpdates, 5000)
```

**ユースケース**: 高並列な書き込みがあり、一時的な不整合が許容される場合

## 3大キャッシュ問題とその解決策

### 問題 1：キャッシュペネトレーション（空振り）

**シナリオ**: 存在しないデータを照会し、毎回データベースにアクセスしてしまう

```
攻撃シナリオ:
GET /api/users/999999999  ← 存在しない ID
    ↓
キャッシュ: ミス
    ↓
DB: SELECT * FROM users WHERE id = 999999999  ← 毎回クエリを実行
    ↓
null を返す (キャッシュされない)

攻撃者が存在しない ID を大量にリクエスト → DB の負荷が急増
```

**解決策**:

```typescript
// 解決策 1：Null 値をキャッシュする
async getUser(userId: string) {
  const cacheKey = `user:${userId}`
  const cached = await redis.get(cacheKey)

  // Null を示す特別なマーカー
  if (cached === '__NULL__') return null
  if (cached) return JSON.parse(cached)

  const user = await db.user.findById(userId)

  if (!user) {
    // 短い有効期限で Null をキャッシュ
    await redis.setex(cacheKey, 60, '__NULL__')
    return null
  }

  await redis.setex(cacheKey, 3600, JSON.stringify(user))
  return user
}

// 解決策 2：ブルームフィルタ
import { BloomFilter } from 'bloom-filters'

const filter = new BloomFilter(10000, 4)  // 容量 10k, ハッシュ関数 4つ

// ブルームフィルタを準備（ウォームアップ）
const allUserIds = await db.user.getAllIds()
allUserIds.forEach(id => filter.add(String(id)))

async getUser(userId: string) {
  // まずブルームフィルタを確認
  if (!filter.has(userId)) {
    return null  // 確実に存在しない
  }

  // 存在する可能性がある場合のみ、キャッシュやデータベースを照会
  return cacheAsideGetUser(userId)
}
```

### 問題 2：キャッシュブレイクダウン（ホットキーの消失）

**シナリオ**: アクセスが集中するデータ（ホットデータ）が期限切れになり、大量の同時リクエストがデータベースに到達する

```
シナリオ:
10:00:00  キャッシュが期限切れ
10:00:00  1000 件の同時リクエストが到着
          全員がキャッシュを無効と判断
          全員がデータベースに問い合わせ
          全員がキャッシュを書き込み

DB への負荷: 1000倍
```

**解決策**:

```typescript
// 解決策 1：ミューテックスロック（排他制御）
async getUserWithLock(userId: string) {
  const cacheKey = `user:${userId}`
  const lockKey = `lock:user:${userId}`

  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // ロックの取得を試行
  const lock = await redis.set(lockKey, '1', 'EX', 10, 'NX')

  if (!lock) {
    // ロック失敗、待機して再試行
    await sleep(100)
    return this.getUserWithLock(userId)
  }

  try {
    // 二重チェック（Double-check locking）
    const cached2 = await redis.get(cacheKey)
    if (cached2) return JSON.parse(cached2)

    // データベースに問い合わせ
    const user = await db.user.findById(userId)
    if (user) {
      await redis.setex(cacheKey, 3600, JSON.stringify(user))
    }
    return user
  } finally {
    await redis.del(lockKey)
  }
}

// 解決策 2：論理的な有効期限（物理的には削除しない）
interface CacheData<T> {
  data: T
  expireTime: number  // 論理的な有効期限
}

async getUserWithLogicalExpire(userId: string) {
  const cacheKey = `user:${userId}`
  const cached = await redis.get(cacheKey)

  if (!cached) return null  // 本当に存在しない

  const wrapper: CacheData<User> = JSON.parse(cached)

  // 期限内であれば直接返す
  if (wrapper.expireTime > Date.now()) {
    return wrapper.data
  }

  // 期限切れの場合、非同期で再構築を開始
  this.rebuildCache(userId).catch(console.error)

  // 古いデータを返す（可用性を確保）
  return wrapper.data
}

async rebuildCache(userId: string) {
  const lockKey = `rebuild:user:${userId}`
  const lock = await redis.set(lockKey, '1', 'EX', 30, 'NX')
  if (!lock) return  // 他のプロセスが再構築中

  try {
    const user = await db.user.findById(userId)
    if (user) {
      const wrapper: CacheData<User> = {
        data: user,
        expireTime: Date.now() + 3600 * 1000
      }
      await redis.set(cacheKey, JSON.stringify(wrapper))
    }
  } finally {
    await redis.del(lockKey)
  }
}
```

### 問題 3：キャッシュアバランシェ（雪崩）

**シナリオ**: 大量のキャッシュが同時に期限切れになる、または Redis 自体がダウンする

```
シナリオ 1：同じ有効期限で一括設定
10:00:00  1000 個のキーが同時に期限切れ
          データベースが瞬時に 1000 件のクエリを受け取る

シナリオ 2：Redis がダウン
          すべてのリクエストがデータベースに到達
          DB が即座にクラッシュ
```

**解決策**:

```typescript
// 解決策 1：有効期限にランダムな値を加える
async setWithRandomExpire(key: string, value: string, baseExpire: number) {
  // 基本の有効期限 + 0〜300 秒のランダム値
  const randomExpire = baseExpire + Math.floor(Math.random() * 300)
  await redis.setex(key, randomExpire, value)
}

// 一括キャッシュ時に使用
async cacheUsers(users: User[]) {
  const pipeline = redis.pipeline()

  users.forEach(user => {
    const expire = 3600 + Math.floor(Math.random() * 300)
    pipeline.setex(`user:${user.id}`, expire, JSON.stringify(user))
  })

  await pipeline.exec()
}

// 解決策 2：マルチレベルキャッシュ
class MultiLevelCache {
  // L1：ローカルメモリ (Caffeine/node-cache)
  private localCache = new NodeCache({ stdTTL: 60 })

  // L2：Redis
  // L3：データベース

  async get(key: string) {
    // L1 を確認
    let value = this.localCache.get(key)
    if (value) return value

    // L2 を確認
    value = await redis.get(key)
    if (value) {
      this.localCache.set(key, value)
      return value
    }

    // L3 を確認
    value = await db.get(key)
    if (value) {
      await redis.setex(key, 3600, value)
      this.localCache.set(key, value)
    }

    return value
  }
}

// 解決策 3：サーキットブレーカー
import CircuitBreaker from 'opossum'

const redisBreaker = new CircuitBreaker(
  async (operation) => operation(),
  {
    timeout: 3000,        // 3秒のタイムアウト
    errorThresholdPercentage: 50,  // エラー率 50% でオープン
    resetTimeout: 30000   // 30秒後に復旧を試行
  }
)

redisBreaker.on('open', () => {
  console.log('Redis circuit breaker open, direct database access')
})

async getWithCircuitBreaker(userId: string) {
  try {
    return await redisBreaker.fire(() => getFromRedis(userId))
  } catch (error) {
    // サーキットブレーカーがオープン中またはエラー発生、データベースにフォールバック
    return await db.user.findById(userId)
  }
}
```

## 高並列環境でのベストプラクティス

### 1. コネクションプールの管理

```typescript
// ioredis は自動的にコネクションプールを管理します
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  // コネクションプールの設定
  keepAlive: 30000,
  connectionName: 'api-server',
  // クラスター設定
  enableOfflineQueue: false, // オフライン時にキューに入れない
  enableReadyCheck: true,
})

// クラスターモード
const cluster = new Redis.Cluster(
  [
    { host: '192.168.1.1', port: 7000 },
    { host: '192.168.1.2', port: 7000 },
    { host: '192.168.1.3', port: 7000 },
  ],
  {
    redisOptions: {
      password: 'password',
    },
  },
)
```

### 2. パイプラインによる一括操作

```typescript
// パイプラインなし：1000 回のネットワーク往復
for (let i = 0; i < 1000; i++) {
  await redis.get(`key:${i}`) // 1000 RTT
}

// パイプラインあり：1 回のネットワーク往復
const pipeline = redis.pipeline()
for (let i = 0; i < 1000; i++) {
  pipeline.get(`key:${i}`)
}
const results = await pipeline.exec()

// MGET の方がよりシンプルです
const keys = Array.from({ length: 1000 }, (_, i) => `key:${i}`)
const values = await redis.mget(...keys)
```

### 3. Big Key（巨大なキー）の管理

```typescript
// Big Key の検出
async function findBigKeys() {
  const stream = redis.scanStream({ match: '*', count: 100 })

  stream.on('data', async (keys) => {
    for (const key of keys) {
      const size = await redis.memory('usage', key)
      if (size > 1024 * 1024) {
        // 1MB を超える場合
        console.warn(`Big key found: ${key}, size: ${size}bytes`)
      }
    }
  })
}

// Big Key の分割
// 非推奨：HSET article:10001 content "10MB の記事内容"
// 推奨：シャード（断片）化して保存
async function setBigContent(id: string, content: string) {
  const chunkSize = 1024 // 1KB のシャード
  const chunks = Math.ceil(content.length / chunkSize)

  for (let i = 0; i < chunks; i++) {
    const chunk = content.slice(i * chunkSize, (i + 1) * chunkSize)
    await redis.hset(`article:${id}:chunks`, String(i), chunk)
  }

  await redis.hset(`article:${id}:meta`, 'chunks', String(chunks))
}
```

### 4. Hot Key（アクセス集中キー）の検出

```typescript
// Redis 4.0 の LFU アルゴリズムを使用
// redis.conf
// maxmemory-policy allkeys-lfu

// Hot Key の監視
async function getHotKeys() {
  // 方法 1：redis-cli --hotkeys（redis-cli が必要）
  // 方法 2：scan と object freq を使用

  const hotKeys = []
  const stream = redis.scanStream()

  stream.on('data', async (keys) => {
    for (const key of keys) {
      const freq = await redis.object('freq', key)
      if (freq > 100) {
        hotKeys.push({ key, freq })
      }
    }
  })

  return hotKeys.sort((a, b) => b.freq - a.freq).slice(0, 100)
}

// Hot Key 用のローカルキャッシュ
const localCache = new Map()

async getHotKeyWithLocalCache(key: string) {
  // まずローカルキャッシュを確認
  if (localCache.has(key)) {
    return localCache.get(key)
  }

  const value = await redis.get(key)
  if (value) {
    localCache.set(key, value)
    // ローカルの有効期限を設定
    setTimeout(() => localCache.delete(key), 5000)
  }

  return value
}
```

## 実践：高性能キャッシュレイヤーの構築

### 完全なサンプルコード

```typescript
// lib/cache.ts
import { Redis } from 'ioredis'
import NodeCache from 'node-cache'

interface CacheConfig {
  redis: Redis
  localTTL: number // ローカルキャッシュの TTL（秒）
  redisTTL: number // Redis の TTL（秒）
  nullTTL: number // Null 値の TTL（秒）
}

export class CacheLayer {
  private localCache: NodeCache
  private redis: Redis
  private config: CacheConfig

  constructor(config: CacheConfig) {
    this.redis = config.redis
    this.config = config
    this.localCache = new NodeCache({
      stdTTL: config.localTTL,
      checkperiod: 120,
    })
  }

  // キャッシュから取得
  async get<T>(
    key: string,
    loader: () => Promise<T | null>,
  ): Promise<T | null> {
    // L1：ローカルキャッシュ
    const local = this.localCache.get<T>(key)
    if (local) return local

    // L2：Redis
    const redisValue = await this.redis.get(key)
    if (redisValue === '__NULL__') return null
    if (redisValue) {
      const parsed = JSON.parse(redisValue)
      this.localCache.set(key, parsed)
      return parsed
    }

    // L3：データベース
    const data = await loader()

    if (data === null) {
      // Null 値をキャッシュ
      await this.redis.setex(key, this.config.nullTTL, '__NULL__')
    } else {
      // データをキャッシュ（ランダムな TTL で雪崩を防止）
      const ttl = this.config.redisTTL + Math.floor(Math.random() * 300)
      await this.redis.setex(key, ttl, JSON.stringify(data))
      this.localCache.set(key, data)
    }

    return data
  }

  // キャッシュを削除
  async del(key: string): Promise<void> {
    this.localCache.del(key)
    await this.redis.del(key)
  }

  // 一括取得
  async mget<T>(
    keys: string[],
    loader: (ids: string[]) => Promise<Map<string, T>>,
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    const missingKeys: string[] = []

    // キャッシュを確認
    for (const key of keys) {
      const local = this.localCache.get<T>(key)
      if (local) {
        result.set(key, local)
        continue
      }
      missingKeys.push(key)
    }

    if (missingKeys.length === 0) return result

    // Redis に一括照会
    const redisValues = await this.redis.mget(...missingKeys)
    const stillMissing: string[] = []

    missingKeys.forEach((key, index) => {
      const value = redisValues[index]
      if (value === '__NULL__') {
        result.set(key, null as any)
      } else if (value) {
        const parsed = JSON.parse(value)
        result.set(key, parsed)
        this.localCache.set(key, parsed)
      } else {
        stillMissing.push(key)
      }
    })

    // データベースに一括照会
    if (stillMissing.length > 0) {
      const dbData = await loader(stillMissing)

      // キャッシュへの書き戻し
      const pipeline = this.redis.pipeline()
      for (const [key, value] of dbData) {
        result.set(key, value)
        if (value === null) {
          pipeline.setex(key, this.config.nullTTL, '__NULL__')
        } else {
          const ttl = this.config.redisTTL + Math.floor(Math.random() * 300)
          pipeline.setex(key, ttl, JSON.stringify(value))
          this.localCache.set(key, value)
        }
      }
      await pipeline.exec()
    }

    return result
  }
}

// 使用例
const cache = new CacheLayer({
  redis: new Redis(),
  localTTL: 30,
  redisTTL: 3600,
  nullTTL: 60,
})

// ユーザーを1件取得
const user = await cache.get(`user:${id}`, () => db.user.findById(id))

// ユーザーを一括取得
const users = await cache.mget(
  ids.map((id) => `user:${id}`),
  async (missingIds) => {
    const users = await db.user.findMany({ where: { id: { in: missingIds } } })
    return new Map(users.map((u) => [u.id, u]))
  },
)
```

## 監視とチューニング

### 重要なメトリクス

```bash
# Redis 監視コマンド
redis-cli info stats

# 注目すべき重要メトリクス:
keyspace_hits: キャッシュヒット数
keyspace_misses: キャッシュミス数
evicted_keys: 追い出されたキー数
expired_keys: 期限切れのキー数
connected_clients: 接続中のクライアント数
used_memory: メモリ使用量

# ヒット率の計算式
ヒット率 = keyspace_hits / (keyspace_hits + keyspace_misses)
健全な状態: > 95%
```

### スロークエリの分析

```bash
# スロークエリログを有効にする
redis-cli config set slowlog-log-slower-than 10000  # 10ms
redis-cli config set slowlog-max-len 1000

# スロークエリを表示
redis-cli slowlog get 10
```

---

**これまでにどのような Redis の落とし穴に遭遇しましたか？ぜひあなたの経験を共有してください！** 👇
