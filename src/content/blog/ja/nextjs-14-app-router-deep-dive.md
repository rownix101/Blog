---
title: 'Next.js 14 App Router 徹底解説：Pages から App への進化'
description: 'Next.js 14 App Router のアーキテクチャを包括的に理解し、Server Components、ストリーミング、ネストされたレイアウトをマスターしましょう。'
date: '2026-02-20'
tags: ['Next.js', 'React', 'App Router', 'Server Components', 'Full Stack']
authors: ['rownix']
draft: false
---

> **要約**: Next.js 14 App Router のアーキテクチャの進化を深掘りし、Pages Router から App Router への包括的なアップグレードガイドを提供します。

## App Router と Pages Router：主な違い

### アーキテクチャの比較

```
Pages Router (従来)                   App Router (次世代)
┌─────────────────┐                   ┌─────────────────┐
│  pages/         │                   │  app/           │
│  ├── index.tsx  │  → URL: /         │  ├── page.tsx   │  → URL: /
│  ├── about.tsx  │  → URL: /about    │  ├── about/     │
│  └── blog/      │                   │  │   └── page.tsx│  → URL: /about
│      └── [id].tsx│ → URL: /blog/123 │  └── blog/      │
│                 │                   │      ├── page.tsx
└─────────────────┘                   │      └── [id]/  │
                                      │          └── page.tsx
                                      │  ├── layout.tsx │  ← ネストされたレイアウト
                                      │  ├── loading.tsx│  ← ローディング状態
                                      │  └── error.tsx  │  ← エラーハンドリング
                                      └─────────────────┘
```

### 主な変更点

| 機能               | Pages Router             | App Router                 |
| ------------------ | ------------------------ | -------------------------- |
| レンダリング       | CSR/SSR/SSG              | RSC + Client Components    |
| データ取得         | `getServerSideProps`     | 直接 `fetch`               |
| レイアウト         | `_app.tsx`（グローバル） | `layout.tsx`（ネスト可能） |
| ローディング状態   | 手動                     | `loading.tsx`              |
| エラーハンドリング | 手動                     | `error.tsx`                |

## Server Components：革命的な変化

### Server Component とは？

```tsx
// app/page.tsx - デフォルトで Server Component
// ✅ サーバー上で直接実行され、クライアントにはバンドルされません

async function getData() {
  // サーバー上でデータベースに直接クエリを投げられます！
  const res = await fetch('https://api.example.com/posts', {
    cache: 'force-cache', // デフォルトのキャッシュ
  })
  return res.json()
}

export default async function HomePage() {
  const posts = await getData() // サーバー側でデータを取得

  return (
    <main>
      <h1>Blog Posts</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </main>
  )
}
```

### クライアント側のバンドルサイズ ゼロ

```tsx
// ❌ Pages Router - データはサーバー側だが、コンポーネントはクライアントに送信される
// pages/index.tsx
export async function getServerSideProps() {
  const posts = await db.query('SELECT * FROM posts')
  return { props: { posts } }
}

export default function Page({ posts }) {
  // このコンポーネントはクライアント側にバンドルされます
  return <div>{/* ... */}</div>
}

// ✅ App Router - Server Component はクライアントに送信されない
// app/page.tsx
import { db } from '@/lib/db' // サーバー側専用

export default async function Page() {
  const posts = await db.query('SELECT * FROM posts')
  // このコンポーネントはサーバー側でのみレンダリングされ、クライアントへの送信は 0 バイトです！
  return <div>{/* ... */}</div>
}
```

### サーバーリソースへの直接アクセス

```tsx
// app/page.tsx
import { readdir } from 'fs/promises'
import { join } from 'path'

export default async function Page() {
  // ✅ ファイルシステムへの直接アクセス（サーバー側のみ）
  const postsDirectory = join(process.cwd(), 'posts')
  const filenames = await readdir(postsDirectory)

  // ✅ 直接のデータベースクエリ
  // import { db } from '@/lib/db'
  // const users = await db.user.findMany()

  // ✅ 環境変数（クライアントには公開されません）
  const apiKey = process.env.API_KEY

  return (
    <div>
      <h1>File List</h1>
      <ul>
        {filenames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Client Components：いつ使うべきか？

### 主なユースケース

```tsx
'use client' // Client Component としてマーク

import { useState, useEffect } from 'react'

// ✅ ブラウザ API が必要な場合
export default function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // ✅ クライアント側でのみ実行されます
    document.title = `Count: ${count}`
    localStorage.setItem('count', String(count))
  }, [count])

  const handleClick = () => {
    setCount((c) => c + 1)
  }

  return <button onClick={handleClick}>Count: {count}</button>
}
```

### サーバーとクライアントのハイブリッドアーキテクチャ

```tsx
// app/page.tsx - Server Component
import { getPosts } from '@/lib/posts'
import LikeButton from './LikeButton' // Client Component

export default async function Page() {
  const posts = await getPosts() // サーバー側でのデータ取得

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          {/* インタラクティブ性が必要な部分のみ Client Component を使用 */}
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

## ネストされたレイアウト：Layout の強力な機能

### 基本的なレイアウト

```tsx
// app/layout.tsx - ルートレイアウト
export const metadata = {
  title: 'My Site',
  description: 'Welcome to my site',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header>Navigation</header>
        {children}
        <footer>Footer</footer>
      </body>
    </html>
  )
}
```

### ネストされたレイアウトの例

```tsx
// app/blog/layout.tsx - ブログ専用レイアウト
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="blog-layout">
      <aside className="sidebar">
        <nav>
          <a href="/blog">All Posts</a>
          <a href="/blog/tech">Tech</a>
          <a href="/blog/life">Life</a>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
```

```
URL: /blog/hello-world

レンダリング結果:
┌─────────────────────────────────────┐
│  Root Layout                        │
│  ┌───────────────────────────────┐  │
│  │  Navigation                    │  │
│  ├───────────────────────────────┤  │
│  │  Blog Layout                  │  │
│  │  ┌──────────┬───────────────┐ │  │
│  │  │ Sidebar  │ Content       │ │  │
│  │  │ - All    │ Hello World   │ │  │
│  │  │ - Tech   │ Article...    │ │  │
│  │  │ - Life   │               │ │  │
│  │  └──────────┴───────────────┘ │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Footer                        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### パラレルルート

```tsx
// app/@modal/layout.tsx
export default function ModalLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal} {/* パラレルレンダリングされるモーダル */}
    </>
  )
}
```

## Loading とエラーハンドリング

### ローディング状態

```tsx
// app/blog/loading.tsx
export default function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      <p>Loading posts...</p>
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

### エラー境界 (Error Boundaries)

```tsx
// app/blog/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## 新しいデータ取得のパラダイム

### 拡張された Fetch API

```tsx
// app/page.tsx
export default async function Page() {
  // 自動的なリクエスト重複排除とキャッシュ
  const posts = await fetch('https://api.example.com/posts', {
    // キャッシュ戦略
    cache: 'force-cache', // SSG - ビルド時にキャッシュ
    // cache: 'no-store',   // SSR - リクエストごとに取得
    // next: { revalidate: 3600 }, // ISR - 1時間ごとに再検証
  }).then((r) => r.json())

  return <PostList posts={posts} />
}
```

### インクリメンタル静的再生成 (ISR)

```tsx
// app/blog/[slug]/page.tsx
export const revalidate = 3600 // 1時間

export async function generateStaticParams() {
  const posts = await fetchPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function Page({
  params: { slug },
}: {
  params: { slug: string }
}) {
  const post = await fetchPost(slug)
  return <Article post={post} />
}
```

## 実践：フルスタックブログの構築

### プロジェクト構造

```
my-blog/
├── app/
│   ├── (marketing)/           # ルートグループ
│   │   ├── page.tsx           # ホームページ
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── blog/
│   │   ├── page.tsx           # 投稿一覧
│   │   ├── [slug]/
│   │   │   ├── page.tsx       # 投稿詳細
│   │   │   └── loading.tsx
│   │   ├── layout.tsx
│   │   └── error.tsx
│   ├── api/                   # API ルート
│   │   └── posts/
│   │       └── route.ts
│   ├── layout.tsx             # ルートレイアウト
│   └── globals.css
├── components/
│   ├── ui/                    # UI コンポーネント
│   └── posts/                 # ビジネスロジック用コンポーネント
│   ├── db.ts                  # データベース設定
│   └── utils.ts
└── public/
```

### データベース統合 (Prisma)

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
    take: 10,
  })

  return (
    <div className="container">
      <h1>Latest Posts</h1>
      <div className="grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
```

### API ルート (App Router スタイル)

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
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const body = await request.json()

  const post = await prisma.post.create({
    data: body,
  })

  return NextResponse.json(post, { status: 201 })
}
```

## パフォーマンス最適化のヒント

### 1. コンポーネントレベルの SSR/CSR

```tsx
// ✅ インタラクティブな部分は Client Component として切り出す
import AddToCart from './AddToCart' // Client Component

// Server Component
export default async function ProductPage({ id }: { id: string }) {
  const product = await getProduct(id) // サーバー側でのデータ取得

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* ボタンのみが Client Component */}
      <AddToCart productId={product.id} />
    </div>
  )
}
```

### 2. 画像の最適化

```tsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/photo.jpg"
      alt="Photo"
      width={800}
      height={600}
      priority // 優先読み込み
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

### 3. フォントの最適化

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // FOIT を防止
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## 移行ガイド：Pages から App へ

### 移行チェックリスト

1. **`app/` ディレクトリを作成する**
2. **`_app.tsx` を `app/layout.tsx` に移行する**
3. **`_document.tsx` をルートの `layout.tsx` に移行する**
4. **ページコンポーネントを移行する**
   - `pages/index.tsx` → `app/page.tsx`
   - `pages/about.tsx` → `app/about/page.tsx`
5. **データ取得方法を更新する**
   - `getServerSideProps` / `getStaticProps` を削除
   - 直接 `fetch` またはデータベースクエリを使用する
6. **ルーティングのナビゲーションを更新する**
   - `useRouter` を `next/navigation` からインポートするように変更

### ルーティング用フックの変更

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

  // ナビゲーション
  router.push('/about')
  router.replace('/home')
  router.refresh() // データの再取得
}
```

## まとめ

Next.js 14 App Router は革命的な変化をもたらします：

| 利点                   | 説明                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| バンドルサイズの削減   | Server Components はクライアントに送信されません                 |
| パフォーマンスの向上   | サーバー側での直接レンダリングによりハイドレーションが減少します |
| データ取得の簡素化     | `await fetch()` を直接使用できます                               |
| ネストされたレイアウト | より柔軟なページ構造が可能です                                   |
| 標準の Loading/Error   | 手動での実装が不要になります                                     |

---

**App Router を使い始めましたか？ どのような課題に直面しましたか？ ぜひコメントで議論しましょう！** 👇
