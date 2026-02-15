---
title: 'Redis Caching Strategies: From Basics to High-Concurrency Optimization'
description: 'Master Redis caching design patterns, solutions for cache penetration, breakdown, and avalanche, plus best practices for high-concurrency scenarios'
date: '2026-02-22'
tags: ['Redis', 'Caching', 'Performance', 'High Concurrency', 'Database']
authors: ['rownix']
draft: false
---

> **TL;DR**: Deep dive into Redis caching strategies, master solutions for three major caching problems, and build highly available, high-performance cache architectures.

## Why Do We Need Caching?

### Performance Comparison

```
Data Access Latency Comparison:
┌─────────────────┬─────────────────┐
│ Storage Medium  │ Latency         │
├─────────────────┼─────────────────┤
│ L1 Cache        │ 1ns             │
│ L2 Cache        │ 4ns             │
│ Memory (RAM)    │ 100ns           │
│ Redis           │ 1-5ms (network) │
│ SSD             │ 100μs           │
│ HDD             │ 10ms            │
│ Database Query  │ 20-100ms        │
└─────────────────┴─────────────────┘

Redis is 10-100x faster than MySQL
```

### The Value of Caching

```
┌─────────────────────────────────────────┐
│        Typical Web Application          │
├─────────────────────────────────────────┤
│  Request → API Gateway → App → Database │
└─────────────────────────────────────────┘
         ↓ With Cache
┌─────────────────────────────────────────┐
│  Request → API Gateway → Cache → Hit?   │
│                         ↓ No            │
│                      Database → Write Cache
└─────────────────────────────────────────┘

QPS Improvement: 1000 → 100,000+ (100x)
Database Load: 100% → 5%
```

## Redis Basics: Get Started in 5 Minutes

### Core Data Types

```bash
# String - Most commonly used
SET user:1001:name "Alice"
SET user:1001:age 25 EX 3600  # Expires in 1 hour
GET user:1001:name
MGET user:1001:name user:1001:age  # Batch get

# Hash - Object storage
HSET user:1001 name "Alice" age 25 city "Beijing"
HGET user:1001 name
HGETALL user:1001

# List - Queue/Stack
LPUSH queue:tasks "task1" "task2"
RPOP queue:tasks  # Consume task

# Set - Deduplication/Relationships
SADD user:1001:tags "developer" "blogger"
SISMEMBER user:1001:tags "developer"

# Sorted Set - Leaderboards
ZADD leaderboard 100 "player1" 85 "player2"
ZREVRANGE leaderboard 0 9 WITHSCORES  # Top 10
```

### Node.js Connection Example

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

// Connection events
redis.on('connect', () => console.log('Redis connected'))
redis.on('error', (err) => console.error('Redis error:', err))

export default redis
```

## Caching Strategy Patterns

### 1. Cache-Aside (Lazy Loading)

```typescript
// Most common strategy: Application manages cache
class CacheAsideService {
  async getUser(userId: string) {
    const cacheKey = `user:${userId}`
    
    // 1. Check cache first
    let user = await redis.get(cacheKey)
    if (user) {
      return JSON.parse(user)  // Cache hit
    }
    
    // 2. Cache miss, query database
    user = await db.user.findById(userId)
    if (!user) {
      return null  // Not in database either
    }
    
    // 3. Write to cache (with expiration)
    await redis.setex(cacheKey, 3600, JSON.stringify(user))
    
    return user
  }
  
  async updateUser(userId: string, data: any) {
    // 1. Update database
    const user = await db.user.update(userId, data)
    
    // 2. Delete cache (or update cache)
    await redis.del(`user:${userId}`)
    
    return user
  }
}
```

**Use Case**: Read-heavy workloads, eventual consistency acceptable

### 2. Read-Through (Transparent Cache)

```typescript
// Cache proxies data access
class ReadThroughService {
  async getUser(userId: string) {
    const cacheKey = `user:${userId}`
    
    // Use Redis getOrSet pattern
    const user = await redis.get(cacheKey)
    if (user) return JSON.parse(user)
    
    // Cache miss, automatically loaded by cache layer
    const dbUser = await this.loadFromDatabase(userId)
    await redis.setex(cacheKey, 3600, JSON.stringify(dbUser))
    
    return dbUser
  }
  
  private async loadFromDatabase(userId: string) {
    return db.user.findById(userId)
  }
}
```

### 3. Write-Through (Synchronous Write)

```typescript
// Synchronously update cache when writing
class WriteThroughService {
  async createUser(data: any) {
    // 1. Write to database
    const user = await db.user.create(data)
    
    // 2. Synchronously write to cache
    await redis.setex(
      `user:${user.id}`,
      3600,
      JSON.stringify(user)
    )
    
    return user
  }
}
```

### 4. Write-Behind (Asynchronous Write)

```typescript
// Write to cache first, async batch write to database
class WriteBehindService {
  async updateUser(userId: string, data: any) {
    // 1. Only update cache
    const cacheKey = `user:${userId}`
    await redis.setex(cacheKey, 3600, JSON.stringify(data))
    
    // 2. Add to async queue
    await redis.lpush('pending_updates', JSON.stringify({
      type: 'UPDATE_USER',
      userId,
      data,
      timestamp: Date.now()
    }))
    
    // 3. Background worker periodically batch writes to database
    return data
  }
}

// Background Worker
async function flushPendingUpdates() {
  const updates = await redis.lrange('pending_updates', 0, 99)
  
  if (updates.length === 0) return
  
  // Batch write to database
  await db.user.batchUpdate(updates.map(u => JSON.parse(u)))
  
  // Clear processed messages
  await redis.ltrim('pending_updates', updates.length, -1)
}

// Execute every 5 seconds
setInterval(flushPendingUpdates, 5000)
```

**Use Case**: High-concurrency writes, temporary inconsistency acceptable

## Three Major Caching Problems and Solutions

### Problem 1: Cache Penetration

**Scenario**: Querying non-existent data, accessing database every time

```
Attack Scenario:
GET /api/users/999999999  ← Non-existent ID
    ↓
Cache: Miss
    ↓
DB: SELECT * FROM users WHERE id = 999999999  ← Query every time
    ↓
Return null (not cached)

Attacker batch requests non-existent IDs → DB pressure spikes
```

**Solutions**:

```typescript
// Solution 1: Cache null values
async getUser(userId: string) {
  const cacheKey = `user:${userId}`
  const cached = await redis.get(cacheKey)
  
  // Special marker for null
  if (cached === '__NULL__') return null
  if (cached) return JSON.parse(cached)
  
  const user = await db.user.findById(userId)
  
  if (!user) {
    // Cache null with shorter expiration
    await redis.setex(cacheKey, 60, '__NULL__')
    return null
  }
  
  await redis.setex(cacheKey, 3600, JSON.stringify(user))
  return user
}

// Solution 2: Bloom Filter
import { BloomFilter } from 'bloom-filters'

const filter = new BloomFilter(10000, 4)  // Capacity 10k, 4 hash functions

// Warm up bloom filter
const allUserIds = await db.user.getAllIds()
allUserIds.forEach(id => filter.add(String(id)))

async getUser(userId: string) {
  // Check bloom filter first
  if (!filter.has(userId)) {
    return null  // Definitely doesn't exist
  }
  
  // Only query cache/database if might exist
  return cacheAsideGetUser(userId)
}
```

### Problem 2: Cache Breakdown

**Scenario**: Hot data expires, massive concurrent requests hit database

```
Scenario:
10:00:00  Cache expires
10:00:00  1000 concurrent requests arrive
          All find cache invalid
          All query database
          All write cache
          
DB Pressure: 1000x
```

**Solutions**:

```typescript
// Solution 1: Mutex Lock
async getUserWithLock(userId: string) {
  const cacheKey = `user:${userId}`
  const lockKey = `lock:user:${userId}`
  
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // Try to acquire lock
  const lock = await redis.set(lockKey, '1', 'EX', 10, 'NX')
  
  if (!lock) {
    // Lock failed, wait and retry
    await sleep(100)
    return this.getUserWithLock(userId)
  }
  
  try {
    // Double-check
    const cached2 = await redis.get(cacheKey)
    if (cached2) return JSON.parse(cached2)
    
    // Query database
    const user = await db.user.findById(userId)
    if (user) {
      await redis.setex(cacheKey, 3600, JSON.stringify(user))
    }
    return user
  } finally {
    await redis.del(lockKey)
  }
}

// Solution 2: Logical Expiration (Never Expire)
interface CacheData<T> {
  data: T
  expireTime: number  // Logical expiration time
}

async getUserWithLogicalExpire(userId: string) {
  const cacheKey = `user:${userId}`
  const cached = await redis.get(cacheKey)
  
  if (!cached) return null  // Truly doesn't exist
  
  const wrapper: CacheData<User> = JSON.parse(cached)
  
  // Not expired, return directly
  if (wrapper.expireTime > Date.now()) {
    return wrapper.data
  }
  
  // Expired, start async rebuild
  this.rebuildCache(userId).catch(console.error)
  
  // Return stale data (guarantees availability)
  return wrapper.data
}

async rebuildCache(userId: string) {
  const lockKey = `rebuild:user:${userId}`
  const lock = await redis.set(lockKey, '1', 'EX', 30, 'NX')
  if (!lock) return  // Another process is rebuilding
  
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

### Problem 3: Cache Avalanche

**Scenario**: Large amounts of cache expire simultaneously, or Redis goes down

```
Scenario 1: Batch set with same expiration
10:00:00  1000 keys expire simultaneously
          Database receives 1000 queries instantly

Scenario 2: Redis goes down
          All requests hit database
          DB crashes instantly
```

**Solutions**:

```typescript
// Solution 1: Random expiration time
async setWithRandomExpire(key: string, value: string, baseExpire: number) {
  // Base expiration + 0-300 seconds random
  const randomExpire = baseExpire + Math.floor(Math.random() * 300)
  await redis.setex(key, randomExpire, value)
}

// Use when batch caching
async cacheUsers(users: User[]) {
  const pipeline = redis.pipeline()
  
  users.forEach(user => {
    const expire = 3600 + Math.floor(Math.random() * 300)
    pipeline.setex(`user:${user.id}`, expire, JSON.stringify(user))
  })
  
  await pipeline.exec()
}

// Solution 2: Multi-level Cache
class MultiLevelCache {
  // L1: Local memory (Caffeine/node-cache)
  private localCache = new NodeCache({ stdTTL: 60 })
  
  // L2: Redis
  // L3: Database
  
  async get(key: string) {
    // Check L1
    let value = this.localCache.get(key)
    if (value) return value
    
    // Check L2
    value = await redis.get(key)
    if (value) {
      this.localCache.set(key, value)
      return value
    }
    
    // Check L3
    value = await db.get(key)
    if (value) {
      await redis.setex(key, 3600, value)
      this.localCache.set(key, value)
    }
    
    return value
  }
}

// Solution 3: Circuit Breaker
import CircuitBreaker from 'opossum'

const redisBreaker = new CircuitBreaker(
  async (operation) => operation(),
  {
    timeout: 3000,        // 3 second timeout
    errorThresholdPercentage: 50,  // Open at 50% error rate
    resetTimeout: 30000   // Try recovery after 30 seconds
  }
)

redisBreaker.on('open', () => {
  console.log('Redis circuit breaker open, direct database access')
})

async getWithCircuitBreaker(userId: string) {
  try {
    return await redisBreaker.fire(() => getFromRedis(userId))
  } catch (error) {
    // Circuit breaker open or error, fallback to database
    return await db.user.findById(userId)
  }
}
```

## High-Concurrency Best Practices

### 1. Connection Pool Management

```typescript
// ioredis automatically manages connection pool
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  // Connection pool config
  keepAlive: 30000,
  connectionName: 'api-server',
  // Cluster config
  enableOfflineQueue: false,  // Don't queue when offline
  enableReadyCheck: true
})

// Cluster mode
const cluster = new Redis.Cluster([
  { host: '192.168.1.1', port: 7000 },
  { host: '192.168.1.2', port: 7000 },
  { host: '192.168.1.3', port: 7000 }
], {
  redisOptions: {
    password: 'password'
  }
})
```

### 2. Pipeline Batch Operations

```typescript
// Non-Pipeline: 1000 network round trips
for (let i = 0; i < 1000; i++) {
  await redis.get(`key:${i}`)  // 1000 RTT
}

// Pipeline: 1 network round trip
const pipeline = redis.pipeline()
for (let i = 0; i < 1000; i++) {
  pipeline.get(`key:${i}`)
}
const results = await pipeline.exec()

// MGET is simpler
const keys = Array.from({ length: 1000 }, (_, i) => `key:${i}`)
const values = await redis.mget(...keys)
```

### 3. Big Key Management

```typescript
// Detect big keys
async function findBigKeys() {
  const stream = redis.scanStream({ match: '*', count: 100 })
  
  stream.on('data', async (keys) => {
    for (const key of keys) {
      const size = await redis.memory('usage', key)
      if (size > 1024 * 1024) {  // Larger than 1MB
        console.warn(`Big key found: ${key}, size: ${size}bytes`)
      }
    }
  })
}

// Split big keys
// Not recommended: HSET article:10001 content "10MB article content"
// Recommended: Shard storage
async function setBigContent(id: string, content: string) {
  const chunkSize = 1024  // 1KB shards
  const chunks = Math.ceil(content.length / chunkSize)
  
  for (let i = 0; i < chunks; i++) {
    const chunk = content.slice(i * chunkSize, (i + 1) * chunkSize)
    await redis.hset(`article:${id}:chunks`, String(i), chunk)
  }
  
  await redis.hset(`article:${id}:meta`, 'chunks', String(chunks))
}
```

### 4. Hot Key Detection

```typescript
// Use Redis 4.0 LFU algorithm
// redis.conf
// maxmemory-policy allkeys-lfu

// Monitor hot keys
async function getHotKeys() {
  // Method 1: redis-cli --hotkeys (requires redis-cli)
  // Method 2: via scan + object freq
  
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

// Local cache for hot keys
const localCache = new Map()

async getHotKeyWithLocalCache(key: string) {
  // Local cache first
  if (localCache.has(key)) {
    return localCache.get(key)
  }
  
  const value = await redis.get(key)
  if (value) {
    localCache.set(key, value)
    // Set local expiration
    setTimeout(() => localCache.delete(key), 5000)
  }
  
  return value
}
```

## Practical: Building a High-Performance Cache Layer

### Complete Example Code

```typescript
// lib/cache.ts
import { Redis } from 'ioredis'
import NodeCache from 'node-cache'

interface CacheConfig {
  redis: Redis
  localTTL: number      // Local cache TTL (seconds)
  redisTTL: number      // Redis TTL (seconds)
  nullTTL: number       // Null value TTL (seconds)
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
      checkperiod: 120 
    })
  }
  
  // Get from cache
  async get<T>(key: string, loader: () => Promise<T | null>): Promise<T | null> {
    // L1: Local cache
    const local = this.localCache.get<T>(key)
    if (local) return local
    
    // L2: Redis
    const redisValue = await this.redis.get(key)
    if (redisValue === '__NULL__') return null
    if (redisValue) {
      const parsed = JSON.parse(redisValue)
      this.localCache.set(key, parsed)
      return parsed
    }
    
    // L3: Database
    const data = await loader()
    
    if (data === null) {
      // Cache null value
      await this.redis.setex(key, this.config.nullTTL, '__NULL__')
    } else {
      // Cache data (random TTL prevents avalanche)
      const ttl = this.config.redisTTL + Math.floor(Math.random() * 300)
      await this.redis.setex(key, ttl, JSON.stringify(data))
      this.localCache.set(key, data)
    }
    
    return data
  }
  
  // Delete cache
  async del(key: string): Promise<void> {
    this.localCache.del(key)
    await this.redis.del(key)
  }
  
  // Batch get
  async mget<T>(keys: string[], loader: (ids: string[]) => Promise<Map<string, T>>): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    const missingKeys: string[] = []
    
    // Check cache
    for (const key of keys) {
      const local = this.localCache.get<T>(key)
      if (local) {
        result.set(key, local)
        continue
      }
      missingKeys.push(key)
    }
    
    if (missingKeys.length === 0) return result
    
    // Batch query Redis
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
    
    // Batch query database
    if (stillMissing.length > 0) {
      const dbData = await loader(stillMissing)
      
      // Backfill cache
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

// Usage example
const cache = new CacheLayer({
  redis: new Redis(),
  localTTL: 30,
  redisTTL: 3600,
  nullTTL: 60
})

// Get single user
const user = await cache.get(`user:${id}`, () => db.user.findById(id))

// Batch get users
const users = await cache.mget(
  ids.map(id => `user:${id}`),
  async (missingIds) => {
    const users = await db.user.findMany({ where: { id: { in: missingIds } } })
    return new Map(users.map(u => [u.id, u]))
  }
)
```

## Monitoring and Tuning

### Key Metrics

```bash
# Redis monitoring commands
redis-cli info stats

# Key metrics to watch:
keyspace_hits: Cache hit rate
keyspace_misses: Cache misses
evicted_keys: Evicted keys
expired_keys: Expired keys
connected_clients: Connected clients
used_memory: Memory usage

# Hit rate calculation
Hit Rate = keyspace_hits / (keyspace_hits + keyspace_misses)
Healthy: > 95%
```

### Slow Query Analysis

```bash
# Enable slow query log
redis-cli config set slowlog-log-slower-than 10000  # 10ms
redis-cli config set slowlog-max-len 1000

# View slow queries
redis-cli slowlog get 10
```

---

**What Redis pitfalls have you encountered? Share your experience!** 👇
