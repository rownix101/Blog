---
title: 'Redis缓存策略实战：从基础到高并发优化'
description: '全面掌握Redis缓存设计模式，缓存穿透、击穿、雪崩解决方案，以及高并发场景下的最佳实践'
date: '2026-02-22'
tags: ['Redis', '缓存', '性能优化', '高并发', '数据库']
authors: ['rownix']
draft: false
---

> **TL;DR**: 深入理解Redis缓存策略，掌握缓存三大问题解决方案，构建高可用高性能的缓存架构。

## 为什么需要缓存？

### 性能对比

```
数据访问延迟对比：
┌─────────────────┬─────────────────┐
│ 存储介质         │ 延迟            │
├─────────────────┼─────────────────┤
│ L1缓存          │ 1ns             │
│ L2缓存          │ 4ns             │
│ 内存(RAM)       │ 100ns           │
│ Redis           │ 1-5ms (网络)     │
│ SSD硬盘         │ 100μs           │
│ 机械硬盘         │ 10ms            │
│ 数据库查询       │ 20-100ms        │
└─────────────────┴─────────────────┘

Redis比MySQL快: 10-100倍
```

### 缓存的价值

```
┌─────────────────────────────────────────┐
│           典型Web应用架构               │
├─────────────────────────────────────────┤
│  用户请求 → API网关 → 应用服务器 → 数据库  │
└─────────────────────────────────────────┘
         ↓ 加入缓存后
┌─────────────────────────────────────────┐
│  用户请求 → API网关 → 缓存 → 命中?       │
│                         ↓ 否            │
│                      数据库 → 写入缓存    │
└─────────────────────────────────────────┘

QPS提升: 1000 → 100,000+ (100倍)
数据库负载: 100% → 5%
```

## Redis基础：5分钟上手

### 核心数据类型

```bash
# 字符串 (String) - 最常用
SET user:1001:name "Alice"
SET user:1001:age 25 EX 3600  # 1小时过期
GET user:1001:name
MGET user:1001:name user:1001:age  # 批量获取

# 哈希 (Hash) - 对象存储
HSET user:1001 name "Alice" age 25 city "Beijing"
HGET user:1001 name
HGETALL user:1001

# 列表 (List) - 队列/栈
LPUSH queue:tasks "task1" "task2"
RPOP queue:tasks  # 消费任务

# 集合 (Set) - 去重/关系
SADD user:1001:tags "developer" "blogger"
SISMEMBER user:1001:tags "developer"

# 有序集合 (Sorted Set) - 排行榜
ZADD leaderboard 100 "player1" 85 "player2"
ZREVRANGE leaderboard 0 9 WITHSCORES  # Top 10
```

### Node.js连接示例

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

// 连接事件
redis.on('connect', () => console.log('Redis connected'))
redis.on('error', (err) => console.error('Redis error:', err))

export default redis
```

## 缓存策略模式

### 1. Cache-Aside (旁路缓存)

```typescript
// 最常用的策略：应用负责读写缓存
class CacheAsideService {
  async getUser(userId: string) {
    const cacheKey = `user:${userId}`
    
    // 1. 先查缓存
    let user = await redis.get(cacheKey)
    if (user) {
      return JSON.parse(user)  // 缓存命中
    }
    
    // 2. 缓存未命中，查数据库
    user = await db.user.findById(userId)
    if (!user) {
      return null  // 数据库也没有
    }
    
    // 3. 写入缓存（设置过期时间）
    await redis.setex(cacheKey, 3600, JSON.stringify(user))
    
    return user
  }
  
  async updateUser(userId: string, data: any) {
    // 1. 更新数据库
    const user = await db.user.update(userId, data)
    
    // 2. 删除缓存（或更新缓存）
    await redis.del(`user:${userId}`)
    
    return user
  }
}
```

**适用场景**：读多写少，对一致性要求不严格

### 2. Read-Through (直读缓存)

```typescript
// 缓存代理数据访问
class ReadThroughService {
  async getUser(userId: string) {
    const cacheKey = `user:${userId}`
    
    // 使用Redis的getOrSet模式
    const user = await redis.get(cacheKey)
    if (user) return JSON.parse(user)
    
    // 缓存未命中，由缓存层自动加载
    const dbUser = await this.loadFromDatabase(userId)
    await redis.setex(cacheKey, 3600, JSON.stringify(dbUser))
    
    return dbUser
  }
  
  private async loadFromDatabase(userId: string) {
    return db.user.findById(userId)
  }
}
```

### 3. Write-Through (直写缓存)

```typescript
// 写入时同步更新缓存
class WriteThroughService {
  async createUser(data: any) {
    // 1. 写入数据库
    const user = await db.user.create(data)
    
    // 2. 同步写入缓存
    await redis.setex(
      `user:${user.id}`,
      3600,
      JSON.stringify(user)
    )
    
    return user
  }
}
```

### 4. Write-Behind (异步写回)

```typescript
// 先写缓存，异步批量写入数据库
class WriteBehindService {
  async updateUser(userId: string, data: any) {
    // 1. 只更新缓存
    const cacheKey = `user:${userId}`
    await redis.setex(cacheKey, 3600, JSON.stringify(data))
    
    // 2. 加入异步队列
    await redis.lpush('pending_updates', JSON.stringify({
      type: 'UPDATE_USER',
      userId,
      data,
      timestamp: Date.now()
    }))
    
    // 3. 后台Worker定期批量写入数据库
    return data
  }
}

// 后台Worker
async function flushPendingUpdates() {
  const updates = await redis.lrange('pending_updates', 0, 99)
  
  if (updates.length === 0) return
  
  // 批量写入数据库
  await db.user.batchUpdate(updates.map(u => JSON.parse(u)))
  
  // 清除已处理的消息
  await redis.ltrim('pending_updates', updates.length, -1)
}

// 每5秒执行一次
setInterval(flushPendingUpdates, 5000)
```

**适用场景**：高并发写入，可接受短暂不一致

## 缓存三大问题与解决方案

### 问题1：缓存穿透 (Cache Penetration)

**现象**：查询不存在的数据，每次都要访问数据库

```
攻击场景：
GET /api/users/999999999  ← 不存在的ID
    ↓
Cache: Miss
    ↓
DB: SELECT * FROM users WHERE id = 999999999  ← 每次都查
    ↓
返回 null (不缓存)

攻击者批量请求不存在ID → DB压力剧增
```

**解决方案**：

```typescript
// 方案1：缓存空值
async getUser(userId: string) {
  const cacheKey = `user:${userId}`
  const cached = await redis.get(cacheKey)
  
  // 特殊标记空值
  if (cached === '__NULL__') return null
  if (cached) return JSON.parse(cached)
  
  const user = await db.user.findById(userId)
  
  if (!user) {
    // 空值也缓存，但设置较短的过期时间
    await redis.setex(cacheKey, 60, '__NULL__')
    return null
  }
  
  await redis.setex(cacheKey, 3600, JSON.stringify(user))
  return user
}

// 方案2：布隆过滤器
import { BloomFilter } from 'bloom-filters'

const filter = new BloomFilter(10000, 4)  // 容量1万，4个哈希函数

// 预热布隆过滤器
const allUserIds = await db.user.getAllIds()
allUserIds.forEach(id => filter.add(String(id)))

async getUser(userId: string) {
  // 先查布隆过滤器
  if (!filter.has(userId)) {
    return null  // 肯定不存在
  }
  
  // 可能存在的才查缓存/数据库
  return cacheAsideGetUser(userId)
}
```

### 问题2：缓存击穿 (Cache Breakdown)

**现象**：热点数据过期，瞬间大量请求打到数据库

```
场景：
10:00:00  缓存过期
10:00:00  1000个并发请求同时到达
          都发现缓存失效
          都查数据库
          都写缓存
          
DB压力: 1000倍
```

**解决方案**：

```typescript
// 方案1：互斥锁 (Mutex)
async getUserWithLock(userId: string) {
  const cacheKey = `user:${userId}`
  const lockKey = `lock:user:${userId}`
  
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // 尝试获取锁
  const lock = await redis.set(lockKey, '1', 'EX', 10, 'NX')
  
  if (!lock) {
    // 获取锁失败，等待后重试
    await sleep(100)
    return this.getUserWithLock(userId)
  }
  
  try {
    // 双重检查
    const cached2 = await redis.get(cacheKey)
    if (cached2) return JSON.parse(cached2)
    
    // 查询数据库
    const user = await db.user.findById(userId)
    if (user) {
      await redis.setex(cacheKey, 3600, JSON.stringify(user))
    }
    return user
  } finally {
    await redis.del(lockKey)
  }
}

// 方案2：逻辑过期 (永不过期)
interface CacheData<T> {
  data: T
  expireTime: number  // 逻辑过期时间
}

async getUserWithLogicalExpire(userId: string) {
  const cacheKey = `user:${userId}`
  const cached = await redis.get(cacheKey)
  
  if (!cached) return null  // 真的不存在
  
  const wrapper: CacheData<User> = JSON.parse(cached)
  
  // 未过期，直接返回
  if (wrapper.expireTime > Date.now()) {
    return wrapper.data
  }
  
  // 已过期，启动异步重建
  this.rebuildCache(userId).catch(console.error)
  
  // 返回旧数据（保证可用性）
  return wrapper.data
}

async rebuildCache(userId: string) {
  const lockKey = `rebuild:user:${userId}`
  const lock = await redis.set(lockKey, '1', 'EX', 30, 'NX')
  if (!lock) return  // 其他进程正在重建
  
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

### 问题3：缓存雪崩 (Cache Avalanche)

**现象**：大量缓存同时过期，或Redis宕机

```
场景1：批量设置相同过期时间
10:00:00  1000个key同时过期
          数据库瞬间接收1000个查询

场景2：Redis宕机
          所有请求打到数据库
          DB瞬间崩溃
```

**解决方案**：

```typescript
// 方案1：过期时间加随机值
async setWithRandomExpire(key: string, value: string, baseExpire: number) {
  // 基础过期时间 + 0-300秒随机值
  const randomExpire = baseExpire + Math.floor(Math.random() * 300)
  await redis.setex(key, randomExpire, value)
}

// 批量缓存时使用
async cacheUsers(users: User[]) {
  const pipeline = redis.pipeline()
  
  users.forEach(user => {
    const expire = 3600 + Math.floor(Math.random() * 300)
    pipeline.setex(`user:${user.id}`, expire, JSON.stringify(user))
  })
  
  await pipeline.exec()
}

// 方案2：多级缓存
class MultiLevelCache {
  // L1: 本地内存 (Caffeine/node-cache)
  private localCache = new NodeCache({ stdTTL: 60 })
  
  // L2: Redis
  // L3: 数据库
  
  async get(key: string) {
    // 查L1
    let value = this.localCache.get(key)
    if (value) return value
    
    // 查L2
    value = await redis.get(key)
    if (value) {
      this.localCache.set(key, value)
      return value
    }
    
    // 查L3
    value = await db.get(key)
    if (value) {
      await redis.setex(key, 3600, value)
      this.localCache.set(key, value)
    }
    
    return value
  }
}

// 方案3：熔断降级
import CircuitBreaker from 'opossum'

const redisBreaker = new CircuitBreaker(
  async (operation) => operation(),
  {
    timeout: 3000,        // 3秒超时
    errorThresholdPercentage: 50,  // 50%错误率触发熔断
    resetTimeout: 30000   // 30秒后尝试恢复
  }
)

redisBreaker.on('open', () => {
  console.log('Redis熔断器打开，直接访问数据库')
})

async getWithCircuitBreaker(userId: string) {
  try {
    return await redisBreaker.fire(() => getFromRedis(userId))
  } catch (error) {
    // 熔断或错误，降级到数据库
    return await db.user.findById(userId)
  }
}
```

## 高并发场景最佳实践

### 1. 连接池管理

```typescript
// ioredis自动管理连接池
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  // 连接池配置
  keepAlive: 30000,
  connectionName: 'api-server',
  // 集群配置
  enableOfflineQueue: false,  // 离线时不排队
  enableReadyCheck: true
})

// 集群模式
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

### 2. Pipeline批量操作

```typescript
// 非Pipeline: 1000次网络往返
for (let i = 0; i < 1000; i++) {
  await redis.get(`key:${i}`)  // 1000次RTT
}

// Pipeline: 1次网络往返
const pipeline = redis.pipeline()
for (let i = 0; i < 1000; i++) {
  pipeline.get(`key:${i}`)
}
const results = await pipeline.exec()

// MGET更简洁
const keys = Array.from({ length: 1000 }, (_, i) => `key:${i}`)
const values = await redis.mget(...keys)
```

### 3. 大Key治理

```typescript
// 检测大Key
async function findBigKeys() {
  const stream = redis.scanStream({ match: '*', count: 100 })
  
  stream.on('data', async (keys) => {
    for (const key of keys) {
      const size = await redis.memory('usage', key)
      if (size > 1024 * 1024) {  // 大于1MB
        console.warn(`大Key发现: ${key}, 大小: ${size}bytes`)
      }
    }
  })
}

// 大Key拆分
// 不推荐：HSET article:10001 content "10MB的文章内容"
// 推荐：分片存储
async function setBigContent(id: string, content: string) {
  const chunkSize = 1024  // 1KB分片
  const chunks = Math.ceil(content.length / chunkSize)
  
  for (let i = 0; i < chunks; i++) {
    const chunk = content.slice(i * chunkSize, (i + 1) * chunkSize)
    await redis.hset(`article:${id}:chunks`, String(i), chunk)
  }
  
  await redis.hset(`article:${id}:meta`, 'chunks', String(chunks))
}
```

### 4. 热点Key探测

```typescript
// 使用Redis 4.0的LFU算法
// redis.conf
// maxmemory-policy allkeys-lfu

// 监控热点Key
async function getHotKeys() {
  // 方法一：redis-cli --hotkeys (需要redis-cli)
  // 方法二：通过scan + object freq
  
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

// 本地缓存热点Key
const localCache = new Map()

async getHotKeyWithLocalCache(key: string) {
  // 本地缓存优先
  if (localCache.has(key)) {
    return localCache.get(key)
  }
  
  const value = await redis.get(key)
  if (value) {
    localCache.set(key, value)
    // 设置本地过期
    setTimeout(() => localCache.delete(key), 5000)
  }
  
  return value
}
```

## 实战：构建高性能缓存层

### 完整示例代码

```typescript
// lib/cache.ts
import { Redis } from 'ioredis'
import NodeCache from 'node-cache'

interface CacheConfig {
  redis: Redis
  localTTL: number      // 本地缓存过期时间(秒)
  redisTTL: number      // Redis过期时间(秒)
  nullTTL: number       // 空值缓存时间(秒)
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
  
  // 获取缓存
  async get<T>(key: string, loader: () => Promise<T | null>): Promise<T | null> {
    // L1: 本地缓存
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
    
    // L3: 数据库
    const data = await loader()
    
    if (data === null) {
      // 缓存空值
      await this.redis.setex(key, this.config.nullTTL, '__NULL__')
    } else {
      // 缓存数据（随机过期时间防雪崩）
      const ttl = this.config.redisTTL + Math.floor(Math.random() * 300)
      await this.redis.setex(key, ttl, JSON.stringify(data))
      this.localCache.set(key, data)
    }
    
    return data
  }
  
  // 删除缓存
  async del(key: string): Promise<void> {
    this.localCache.del(key)
    await this.redis.del(key)
  }
  
  // 批量获取
  async mget<T>(keys: string[], loader: (ids: string[]) => Promise<Map<string, T>>): Promise<Map<string, T>> {
    const result = new Map<string, T>()
    const missingKeys: string[] = []
    
    // 查缓存
    for (const key of keys) {
      const local = this.localCache.get<T>(key)
      if (local) {
        result.set(key, local)
        continue
      }
      missingKeys.push(key)
    }
    
    if (missingKeys.length === 0) return result
    
    // 批量查Redis
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
    
    // 批量查数据库
    if (stillMissing.length > 0) {
      const dbData = await loader(stillMissing)
      
      // 回填缓存
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

// 使用示例
const cache = new CacheLayer({
  redis: new Redis(),
  localTTL: 30,
  redisTTL: 3600,
  nullTTL: 60
})

// 获取单个用户
const user = await cache.get(`user:${id}`, () => db.user.findById(id))

// 批量获取用户
const users = await cache.mget(
  ids.map(id => `user:${id}`),
  async (missingIds) => {
    const users = await db.user.findMany({ where: { id: { in: missingIds } } })
    return new Map(users.map(u => [u.id, u]))
  }
)
```

## 监控与调优

### 关键指标

```bash
# Redis监控命令
redis-cli info stats

# 关注指标:
keyspace_hits: 缓存命中率
keyspace_misses: 缓存未命中
evicted_keys: 被淘汰的key
expired_keys: 过期的key
connected_clients: 连接数
used_memory: 内存使用

# 命中率计算
命中率 = keyspace_hits / (keyspace_hits + keyspace_misses)
健康指标: > 95%
```

### 慢查询分析

```bash
# 启用慢查询日志
redis-cli config set slowlog-log-slower-than 10000  # 10ms
redis-cli config set slowlog-max-len 1000

# 查看慢查询
redis-cli slowlog get 10
```

---

**你在使用Redis时遇到过哪些坑？欢迎分享经验！** 👇
