---
title: 'Next.js 14 App Router 深度解析：从 Pages 到 App 的进化'
description: '全面理解Next.js 14 App Router架构，掌握Server Components、Streaming和嵌套布局'
date: '2026-02-20'
tags: ['Next.js', 'React', 'App Router', 'Server Components', '全栈']
authors: ['rownix']
draft: false
---

> **TL;DR**: 深入理解 Next.js 14 App Router 的架构变革，从 Pages Router 到 App Router 的全面升级指南。

## App Router vs Pages Router：核心差异

### 架构对比

```
Pages Router (传统)                    App Router (新时代)
┌─────────────────┐                   ┌─────────────────┐
│  pages/         │                   │  app/           │
│  ├── index.tsx  │  → URL: /         │  ├── page.tsx   │  → URL: /
│  ├── about.tsx  │  → URL: /about    │  ├── about/     │
│  └── blog/      │                   │  │   └── page.tsx│  → URL: /about
│      └── [id].tsx│ → URL: /blog/123 │  └── blog/      │
│                 │                   │      ├── page.tsx
└─────────────────┘                   │      └── [id]/  │
                                      │          └── page.tsx
                                      │  ├── layout.tsx │  ← 嵌套布局
                                      │  ├── loading.tsx│  ← 加载状态
                                      │  └── error.tsx  │  ← 错误处理
                                      └─────────────────┘
```

### 关键变化

| 特性 | Pages Router | App Router |
|------|-------------|-----------|
| 渲染模式 | CSR/SSR/SSG | RSC + Client Components |
| 数据获取 | `getServerSideProps` | 直接 `fetch` |
| 布局 | `_app.tsx` 全局 | `layout.tsx` 嵌套 |
| 加载状态 | 手动实现 | `loading.tsx` |
| 错误处理 | 手动实现 | `error.tsx` |

## Server Components：革命性变化

### 什么是 Server Component？

```tsx
// app/page.tsx - 默认就是 Server Component
// ✅ 直接在服务端运行，不打包到客户端

async function getData() {
  // 直接在服务端查询数据库！
  const res = await fetch('https://api.example.com/posts', {
    cache: 'force-cache' // 默认缓存
  })
  return res.json()
}

export default async function HomePage() {
  const posts = await getData() // 服务端直接获取数据
  
  return (
    <main>
      <h1>博客文章</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </main>
  )
}
```

### 零客户端Bundle

```tsx
// ❌ Pages Router - 数据获取在服务端，但组件仍发送到客户端
// pages/index.tsx
export async function getServerSideProps() {
  const posts = await db.query('SELECT * FROM posts')
  return { props: { posts } }
}

export default function Page({ posts }) {
  // 这个组件会打包到客户端bundle
  return <div>{/* ... */}</div>
}

// ✅ App Router - Server Component 不发送到客户端
// app/page.tsx
import { db } from '@/lib/db' // 只在服务端运行

export default async function Page() {
  const posts = await db.query('SELECT * FROM posts')
  // 这个组件只在服务端渲染，0 bytes 发送到客户端！
  return <div>{/* ... */}</div>
}
```

### 服务端直接访问资源

```tsx
// app/page.tsx
import { readdir } from 'fs/promises'
import { join } from 'path'

export default async function Page() {
  // ✅ 直接读取文件系统（只在服务端）
  const postsDirectory = join(process.cwd(), 'posts')
  const filenames = await readdir(postsDirectory)
  
  // ✅ 直接查询数据库
  // import { db } from '@/lib/db'
  // const users = await db.user.findMany()
  
  // ✅ 访问环境变量（不会暴露给客户端）
  const apiKey = process.env.API_KEY
  
  return (
    <div>
      <h1>文件列表</h1>
      <ul>
        {filenames.map(name => <li key={name}>{name}</li>)}
      </ul>
    </div>
  )
}
```

## Client Components：什么时候用？

### 使用场景

```tsx
'use client' // 标记为 Client Component

import { useState, useEffect } from 'react'

// ✅ 需要浏览器API
export default function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    // ✅ 只在客户端执行
    document.title = `Count: ${count}`
    localStorage.setItem('count', String(count))
  }, [count])
  
  const handleClick = () => {
    setCount(c => c + 1)
  }
  
  return (
    <button onClick={handleClick}>
      Count: {count}
    </button>
  )
}
```

### Server + Client 混合架构

```tsx
// app/page.tsx - Server Component
import { getPosts } from '@/lib/posts'
import LikeButton from './LikeButton' // Client Component

export default async function Page() {
  const posts = await getPosts() // 服务端获取数据
  
  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          {/* Client Component 只在需要交互的地方使用 */}
          <LikeButton postId={post.id} />
        </article>
      ))}
    </div>
  )
}
```

```tsx
// app/LikeButton.tsx - Client Component
'use client'

import { useState } from 'react'

export default function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false)
  
  return (
    <button 
      onClick={() => setLiked(!liked)}
      className={liked ? 'text-red-500' : ''}
    >
      {liked ? '❤️' : '🤍'}
    </button>
  )
}
```

## 嵌套布局：Layout 的强大之处

### 基础布局

```tsx
// app/layout.tsx - 根布局
export const metadata = {
  title: 'My Site',
  description: 'Welcome to my site'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <header>导航栏</header>
        {children}
        <footer>页脚</footer>
      </body>
    </html>
  )
}
```

### 嵌套布局示例

```tsx
// app/blog/layout.tsx - 博客专属布局
export default function BlogLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="blog-layout">
      <aside className="sidebar">
        <nav>
          <a href="/blog">全部文章</a>
          <a href="/blog/tech">技术</a>
          <a href="/blog/life">生活</a>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
```

```
URL: /blog/hello-world

渲染结果：
┌─────────────────────────────────────┐
│  Root Layout                        │
│  ┌───────────────────────────────┐  │
│  │  导航栏                        │  │
│  ├───────────────────────────────┤  │
│  │  Blog Layout                  │  │
│  │  ┌──────────┬───────────────┐ │  │
│  │  │ Sidebar  │ Content       │ │  │
│  │  │ - 全部    │ Hello World   │ │  │
│  │  │ - 技术    │ Article...    │ │  │
│  │  │ - 生活    │               │ │  │
│  │  └──────────┴───────────────┘ │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  页脚                          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 并行路由（Parallel Routes）

```tsx
// app/@modal/layout.tsx
export default function ModalLayout({
  children,
  modal
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal} {/* 并行渲染的模态框 */}
    </>
  )
}
```

## Loading 和 Error 处理

### Loading 状态

```tsx
// app/blog/loading.tsx
export default function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      <p>加载文章中...</p>
    </div>
  )
}
```

```tsx
// app/blog/page.tsx
import { Suspense } from 'react'
import PostList from './PostList'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PostList />
    </Suspense>
  )
}
```

### Error 边界

```tsx
// app/blog/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="error-container">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  )
}
```

## 数据获取新范式

### Fetch API 增强

```tsx
// app/page.tsx
export default async function Page() {
  // 自动去重和缓存
  const posts = await fetch('https://api.example.com/posts', {
    // 缓存策略
    cache: 'force-cache', // SSG - 构建时缓存
    // cache: 'no-store',   // SSR - 每次请求
    // next: { revalidate: 3600 }, // ISR - 1小时重新验证
  }).then(r => r.json())
  
  return <PostList posts={posts} />
}
```

### 增量静态再生成（ISR）

```tsx
// app/blog/[slug]/page.tsx
export const revalidate = 3600 // 1小时

export async function generateStaticParams() {
  const posts = await fetchPosts()
  return posts.map(post => ({
    slug: post.slug
  }))
}

export default async function Page({
  params: { slug }
}: {
  params: { slug: string }
}) {
  const post = await fetchPost(slug)
  return <Article post={post} />
}
```

## 实战：构建全栈博客

### 项目结构

```
my-blog/
├── app/
│   ├── (marketing)/           # 路由分组
│   │   ├── page.tsx           # 首页
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── blog/
│   │   ├── page.tsx           # 文章列表
│   │   ├── [slug]/
│   │   │   ├── page.tsx       # 文章详情
│   │   │   └── loading.tsx
│   │   ├── layout.tsx
│   │   └── error.tsx
│   ├── api/                   # API Routes
│   │   └── posts/
│   │       └── route.ts
│   ├── layout.tsx             # 根布局
│   └── globals.css
├── components/
│   ├── ui/                    # UI组件
│   └── posts/                 # 业务组件
├── lib/
│   ├── db.ts                  # 数据库
│   └── utils.ts
└── public/
```

### 数据库集成（Prisma）

```tsx
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

```tsx
// app/blog/page.tsx
import { prisma } from '@/lib/db'

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  return (
    <div className="container">
      <h1>最新文章</h1>
      <div className="grid">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
```

### API Routes（App Router 风格）

```ts
// app/api/posts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const posts = await prisma.post.findMany()
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  
  const post = await prisma.post.create({
    data: body
  })
  
  return NextResponse.json(post, { status: 201 })
}
```

## 性能优化技巧

### 1. 组件粒度的 SSR/CSR

```tsx
// ✅ 将交互部分提取为 Client Component
import AddToCart from './AddToCart' // Client Component

// Server Component
export default async function ProductPage({ id }: { id: string }) {
  const product = await getProduct(id) // 服务端获取
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* 只有按钮是 Client Component */}
      <AddToCart productId={product.id} />
    </div>
  )
}
```

### 2. 图片优化

```tsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/photo.jpg"
      alt="Photo"
      width={800}
      height={600}
      priority // 优先加载
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

### 3. 字体优化

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap' // 防止FOIT
})

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## 迁移指南：Pages → App

### 迁移清单

1. **创建 `app/` 目录**
2. **迁移 `_app.tsx` → `app/layout.tsx`**
3. **迁移 `_document.tsx` → 根 `layout.tsx`**
4. **迁移页面组件**
   - `pages/index.tsx` → `app/page.tsx`
   - `pages/about.tsx` → `app/about/page.tsx`
5. **更新数据获取**
   - 移除 `getServerSideProps` / `getStaticProps`
   - 改用直接 `fetch` 或数据库查询
6. **更新路由导航**
   - `useRouter` → `next/navigation`

### 路由 Hook 变化

```tsx
// ❌ Pages Router
import { useRouter } from 'next/router'

// ✅ App Router
import { useRouter } from 'next/navigation'
import { usePathname, useSearchParams } from 'next/navigation'

export default function Component() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // 导航
  router.push('/about')
  router.replace('/home')
  router.refresh() // 重新获取数据
}
```

## 总结

Next.js 14 App Router 带来了革命性的变化：

| 优势 | 说明 |
|------|------|
| 更小的客户端Bundle | Server Components 不发送到客户端 |
| 更好的性能 | 服务端直接渲染，减少 hydration |
| 更简单的数据获取 | 直接 `await fetch()` |
| 嵌套布局 | 更灵活的页面结构 |
| 内置 Loading/Error | 无需手动实现 |

---

**你已经开始使用 App Router 了吗？遇到什么问题？欢迎讨论！** 👇
