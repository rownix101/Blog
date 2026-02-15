---
title: '完全版 ウェブサイト・パフォーマンス最適化ガイド：2秒から200msへの挑戦'
description: '実践的なケーススタディ：ブログのLCPを2.5秒から200msに短縮し、Core Web Vitalsで満点を獲得した方法を解説します'
date: '2026-02-17'
tags:
  ['Performance', 'Web Vitals', 'Cloudflare', 'Frontend Optimization', 'SEO']
authors: ['rownix']
draft: false
---

> **まとめ**: 10の最適化テクニックを駆使して、ブログのLCPを2.5秒から200msに、CLSを0.25から0に改善しました。Core Web Vitalsで完璧なスコアを達成した全行程を紹介します。

## なぜパフォーマンスを最適化するのか？

### パフォーマンス ＝ ユーザー体験 ＝ コンバージョン

| 指標            | 影響                                                  |
| --------------- | ----------------------------------------------------- |
| 1秒の遅延につき | コンバージョンが7%減少                                |
| 直帰率          | 読み込みに3秒かかると、1秒の場合に比べて3倍に増加     |
| SEO順位         | GoogleはCore Web Vitalsを検索順位の決定要因として採用 |

### 最適化前の状態

最適化前（PageSpeed Insights）の数値は以下の通りでした。

```
📱 モバイル:
• LCP (Largest Contentful Paint): 2.5s ❌
• FID (First Input Delay): 180ms ⚠️
• CLS (Cumulative Layout Shift): 0.25 ❌
• 総合スコア: 42/100

💻 デスクトップ:
• LCP: 1.2s ⚠️
• FID: 50ms ✅
• CLS: 0.15 ⚠️
• 総合スコア: 68/100
```

## 最適化戦略の全体像

```
最適化ピラミッド:

         ┌─────────────┐
         │  コードの最適化   │  ← JS/CSS/HTMLの圧縮
         ├─────────────┤
         │ アセットの最適化  │  ← 画像/フォント/圧縮
         ├─────────────┤
         │ ネットワーク最適化 │  ← CDN/キャッシュ/HTTP2
         ├─────────────┤
         │アーキテクチャ最適化 │  ← エッジコンピューティング/静的配信
         └─────────────┘
```

## 10段階の最適化プロセス

### ステップ1：画像の最適化（最大の影響）

**課題**: 未最適化のPNGファイル、1枚あたり500KB以上。

**解決策**:

```html
<!-- ❌ 以前 -->
<img src="hero.png" alt="Hero" />

<!-- ✅ 改善後 -->
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img
    src="hero.jpg"
    alt="Hero"
    loading="lazy"
    decoding="async"
    width="1200"
    height="630"
  />
</picture>
```

**Cloudflareによる画像最適化**:

```javascript
// Cloudflare Images サービスの活用
const optimizedUrl = `https://imagedelivery.net/${accountHash}/${imageId}/w=1200,h=630,fit=cover`
```

**効果**: LCPを800ms短縮。

---

### ステップ2：フォント読み込みの最適化

**課題**: フォントファイルがレンダリングをブロックし、FOIT（テキストが一瞬消える現象）が発生。

**解決策**:

```css
/* ✅ 最適化されたフォント読み込み */
@font-face {
  font-family: 'Geist';
  src: url('/fonts/GeistVF.woff2') format('woff2');
  font-display: swap; /* 重要：swap戦略を使用 */
  font-weight: 100 900;
  font-style: normal;
}

/* クリティカルフォントのプリロード */
<link rel="preload" href="/fonts/GeistVF.woff2" as="font" type="font/woff2" crossorigin />

/* レイアウトシフトを防ぐためのシステムフォントへのフォールバック */
body {
  font-family:
    'Geist',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}
```

**フォント読み込み戦略の比較**:

| 戦略       | 動作                     | ユースケース           |
| ---------- | ------------------------ | ---------------------- |
| `auto`     | ブラウザに依存           | 非推奨                 |
| `block`    | 短いFOITを許容           | ブランドフォントを優先 |
| `swap`     | 代替フォントを先に表示   | ✅ 推奨                |
| `fallback` | 短いswap、長いblock      | 妥協案                 |
| `optional` | 読み込まれない場合がある | 重要度の低いフォント   |

**効果**: FIDを100ms短縮。

---

### ステップ3：JavaScriptの最適化

**課題**: 未使用の巨大なJSバンドルがメインスレッドを占有。

**コード分割**:

```javascript
// ✅ 動的インポートにより、必要時にのみ読み込む
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// ルートレベルでの分割
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard')),
  },
  {
    path: '/analytics',
    component: lazy(() => import('./pages/Analytics')),
  },
]
```

**Tree Shaking**:

```javascript
// ❌ ライブラリ全体をインポート
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ 必要な関数のみをインポート
import debounce from 'lodash/debounce'

debounce(fn, 300)

// ✅ さらに良い方法：ネイティブの代替実装を使用
const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
```

**スクリプト読み込みの最適化**:

```html
<!-- ✅ 重要でないJSは非同期で読み込む -->
<script src="analytics.js" async></script>

<!-- ✅ ページの解析が終わるまで遅延させる -->
<script src="chat-widget.js" defer></script>

<!-- ✅ Moduleスクリプトは自動的にdeferされる -->
<script type="module" src="app.js"></script>
```

**効果**: TTI (Time to Interactive) を1.2秒短縮。

---

### ステップ4：CSSの最適化

**クリティカルCSSのインライン化**:

```html
<head>
  <!-- ✅ クリティカルCSS（ファーストビュー用）のインライン化 -->
  <style>
    /* ファーストビューに必要なスタイルのみ */
    body {
      margin: 0;
      font-family: Geist, sans-serif;
    }
    .hero {
      min-height: 100vh;
      display: grid;
      place-items: center;
    }
    /* ... その他の重要スタイル */
  </style>

  <!-- それ以外のCSSを非同期で読み込む -->
  <link
    rel="preload"
    href="/styles/non-critical.css"
    as="style"
    onload="this.onload=null;this.rel='stylesheet'"
  />
  <noscript><link rel="stylesheet" href="/styles/non-critical.css" /></noscript>
</head>
```

**CSSの最小化**:

```javascript
// 従来のツールの代わりに Lightning CSS を使用
import { transform } from 'lightningcss'

const { code } = transform({
  filename: 'style.css',
  code: Buffer.from(css),
  minify: true,
  targets: {
    // モダンブラウザをターゲットに設定
    chrome: 90 << 16,
  },
})
```

**効果**: First Paint を400ms短縮。

---

### ステップ5：圧縮とCDN

**Brotli圧縮**:

```nginx
# Nginxの設定例
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/javascript application/json;
```

**Cloudflareの自動圧縮設定**:

```
Dashboard → Speed → Optimization → Auto Minify
✅ JavaScript
✅ CSS
✅ HTML

Brotli Compression: ON
```

**圧縮結果**:

| アセット形式 | 元のサイズ | Gzip | Brotli | 削減率 |
| ------------ | ---------- | ---- | ------ | ------ |
| main.js      | 245KB      | 68KB | 52KB   | 78%    |
| styles.css   | 45KB       | 12KB | 9KB    | 80%    |
| index.html   | 28KB       | 8KB  | 6KB    | 78%    |

**効果**: 総転送サイズを75%削減。

---

### ステップ6：キャッシュ戦略

**Service Worker によるキャッシュ**:

```javascript
// sw.js
const CACHE_NAME = 'blog-v1'
const STATIC_ASSETS = [
  '/',
  '/styles/main.css',
  '/scripts/app.js',
  '/fonts/GeistVF.woff2',
]

// インストール時にキャッシュを生成
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// リクエストのインターセプト
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュがあればそれを返す
      if (response) return response

      // なければネットワークから取得
      return fetch(event.request).then((networkResponse) => {
        // 新しいアセットをキャッシュに保存
        const clone = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone)
        })
        return networkResponse
      })
    }),
  )
})
```

**HTTP キャッシュヘッダー**:

```javascript
// 静的アセット - 長期キャッシュ
Cache-Control: public, max-age=31536000, immutable

// HTMLドキュメント - 短期キャッシュ
Cache-Control: public, max-age=0, must-revalidate

// APIレスポンス
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

**効果**: 再訪問時の読み込みが100ms未満に。

---

### ステップ7：プリロードとヒント

**リソースヒントの活用**:

```html
<head>
  <!-- DNSの事前解決 -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

  <!-- 事前接続 (DNS + TCP + TLS) -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

  <!-- 重要リソースのプリロード -->
  <link
    rel="preload"
    href="/fonts/GeistVF.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
  <link rel="preload" href="/images/hero.avif" as="image" type="image/avif" />

  <!-- 次のページの事前読み込み -->
  <link rel="prefetch" href="/about" />

  <!-- 遷移確率の高いリンクの事前レンダリング -->
  <link rel="prerender" href="/blog" />
</head>
```

**効果**: LCPを150ms短縮。

---

### ステップ8：エッジコンピューティング

**Cloudflare Workers による最適化**:

```typescript
// _worker.ts
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    // 静的アセットへの長期キャッシュ適用
    if (url.pathname.match(/\.(js|css|woff2|avif)$/)) {
      const response = await env.ASSETS.fetch(request)
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      return new Response(response.body, { headers })
    }

    // HTMLへのセキュリティヘッダー付与
    if (url.pathname.endsWith('.html') || url.pathname === '/') {
      const response = await env.ASSETS.fetch(request)
      const headers = new Headers(response.headers)
      headers.set('X-Frame-Options', 'DENY')
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      return new Response(response.body, { headers })
    }

    return env.ASSETS.fetch(request)
  },
}
```

**効果**: グローバルなアクセス遅延が50ms未満に。

---

### ステップ9：レイアウトの安定性 (CLS)

**レイアウトシフトの防止**:

```html
<!-- ❌ 誤り：寸法の指定がない画像 -->
<img src="photo.jpg" alt="Photo" />

<!-- ✅ 正解：寸法を明示する -->
<img src="photo.jpg" alt="Photo" width="800" height="600" />

<!-- ✅ または aspect-ratio を使用する -->
<div class="image-container">
  <img src="photo.jpg" alt="Photo" />
</div>

<style>
  .image-container {
    aspect-ratio: 4 / 3;
  }
  .image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
```

**フォントの予約スペース**:

```css
/* ✅ FOIT/FOUT による CLS を防ぐ */
@font-face {
  font-family: 'Geist';
  src: url('GeistVF.woff2') format('woff2');
  font-display: optional;
  size-adjust: 100%;
  ascent-override: 90%;
  descent-override: 20%;
}
```

**効果**: CLSを0.25から0へ改善 ✅

---

### ステップ10：モニタリングと継続的な最適化

**Web Vitals の監視**:

```javascript
// 実際のユーザーによる計測 (RUM)
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  const body =
    JSON.stringify(metric)(
      // データの確実な送信のために navigator.sendBeacon を使用
      navigator.sendBeacon && navigator.sendBeacon('/analytics', body),
    ) || fetch('/analytics', { body, method: 'POST', keepalive: true })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

**Lighthouse CI の導入**:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://blog.rownix.me/
            https://blog.rownix.me/zh-cn/blog/
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

---

## 最終結果

### PageSpeed Insights の最終スコア

```
📱 モバイル:
• LCP: 200ms ✅ (92% 改善)
• FID: 45ms ✅ (75% 改善)
• CLS: 0 ✅ (100% 改善)
• 総合スコア: 98/100

💻 デスクトップ:
• LCP: 120ms ✅ (90% 改善)
• FID: 25ms ✅ (50% 改善)
• CLS: 0 ✅ (100% 改善)
• 総合スコア: 100/100 🎉
```

### 実際のユーザーデータ (CrUX)

```
快適な CWV 体験を得られたユーザー: 96%

LCP の分布:
┌─────────────────────────────────────┐
│ 良好 (<2.5s)    ████████████ 96%   │
│ 改善が必要         ██ 3%           │
│ 不十分 (>4s)          █ 1%           │
└─────────────────────────────────────┘
```

## 最適化チェックリスト

### 必須項目（高い費用対効果）

- [ ] WebP/AVIF画像と遅延読み込み（lazy loading）
- [ ] font-display: swap の適用
- [ ] JSのコード分割とTree Shaking
- [ ] Brotli圧縮の有効化
- [ ] CDNへのデプロイ

### 応用項目（中程度の費用対効果）

- [ ] クリティカルCSSのインライン化
- [ ] Service Worker によるキャッシュ
- [ ] リソースのプリロード
- [ ] CLSの徹底的な最適化

### 継続的なモニタリング

- [ ] Web Vitals の RUM 監視
- [ ] Lighthouse CI の統合
- [ ] パフォーマンス予算（Performance Budget）の設定

---

**あなたのウェブサイトのパフォーマンスはいかがですか？どのような最適化に苦労されていますか？ぜひ皆さんの経験をコメントで教えてください！** 👇
