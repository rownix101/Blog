---
title: 'Complete Website Performance Optimization Guide: From 2s to 200ms'
description: 'Real case study: How I optimized my blog from LCP 2.5s to 200ms, achieving perfect Core Web Vitals scores'
date: '2026-02-17'
tags: ['Performance', 'Web Vitals', 'Cloudflare', 'Frontend Optimization', 'SEO']
authors: ['rownix']
draft: false
---

> **TL;DR**: Through 10 optimization techniques, I reduced my blog's LCP from 2.5s to 200ms, CLS from 0.25 to 0, achieving perfect Core Web Vitals scores.

## Why Optimize Performance?

### Performance = User Experience = Conversions

| Metric | Impact |
|--------|--------|
| Every 1s delay | 7% decrease in conversions |
| Bounce rate | 3x higher at 3s load time vs 1s |
| SEO ranking | Google uses Core Web Vitals as ranking factor |

### My Starting Point

Before optimization (PageSpeed Insights):

```
📱 Mobile:
• LCP (Largest Contentful Paint): 2.5s ❌
• FID (First Input Delay): 180ms ⚠️
• CLS (Cumulative Layout Shift): 0.25 ❌
• Overall: 42/100

💻 Desktop:
• LCP: 1.2s ⚠️
• FID: 50ms ✅
• CLS: 0.15 ⚠️
• Overall: 68/100
```

## Optimization Strategy Overview

```
Optimization Pyramid:

         ┌─────────────┐
         │  Code Optimization  │  ← JS/CSS/HTML minification
         ├─────────────┤
         │  Asset Optimization │  ← Images/Fonts/Compression
         ├─────────────┤
         │  Network Optimization│  ← CDN/Caching/HTTP2
         ├─────────────┤
         │ Architecture Optimization│  ← Edge Computing/Static
         └─────────────┘
```

## 10-Step Optimization Journey

### Step 1: Image Optimization (Biggest Impact)

**Problem**: Unoptimized PNGs, 500KB+ each

**Solution**:

```html
<!-- ❌ Before -->
<img src="hero.png" alt="Hero" />

<!-- ✅ After -->
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

**Cloudflare Image Optimization**:

```javascript
// Using Cloudflare Images service
const optimizedUrl = `https://imagedelivery.net/${accountHash}/${imageId}/w=1200,h=630,fit=cover`
```

**Impact**: LCP reduced by 800ms

---

### Step 2: Font Loading Optimization

**Problem**: Font files blocking render, causing FOIT (Flash of Invisible Text)

**Solution**:

```css
/* ✅ Optimized font loading */
@font-face {
  font-family: 'Geist';
  src: url('/fonts/GeistVF.woff2') format('woff2');
  font-display: swap; /* Key: use swap strategy */
  font-weight: 100 900;
  font-style: normal;
}

/* Preload critical fonts */
<link rel="preload" href="/fonts/GeistVF.woff2" as="font" type="font/woff2" crossorigin />

/* System font fallback to prevent layout shift */
body {
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Font Loading Strategies**:

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `auto` | Browser decides | Not recommended |
| `block` | Short FOIT | Brand fonts priority |
| `swap` | Show fallback first | ✅ Recommended |
| `fallback` | Short swap, long block | Compromise |
| `optional` | May not load | Non-critical fonts |

**Impact**: FID reduced by 100ms

---

### Step 3: JavaScript Optimization

**Problem**: Large unused JS bundles blocking main thread

**Code Splitting**:

```javascript
// ✅ Dynamic imports, load on demand
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Route-level splitting
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard'))
  },
  {
    path: '/analytics',
    component: lazy(() => import('./pages/Analytics'))
  }
]
```

**Tree Shaking**:

```javascript
// ❌ Import entire library
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ Import only needed functions
import debounce from 'lodash/debounce'

debounce(fn, 300)

// ✅ Better: use native alternatives
const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
```

**Script Loading Optimization**:

```html
<!-- ✅ Async load non-critical JS -->
<script src="analytics.js" async></script>

<!-- ✅ Defer until page parsed -->
<script src="chat-widget.js" defer></script>

<!-- ✅ Module scripts auto-defer -->
<script type="module" src="app.js"></script>
```

**Impact**: TTI (Time to Interactive) reduced by 1.2s

---

### Step 4: CSS Optimization

**Critical CSS Inlining**:

```html
<head>
  <!-- ✅ Inline critical CSS (above-fold styles) -->
  <style>
    /* Only above-fold critical styles */
    body { margin: 0; font-family: Geist, sans-serif; }
    .hero { min-height: 100vh; display: grid; place-items: center; }
    /* ... other critical styles */
  </style>
  
  <!-- Non-critical CSS async load -->
  <link rel="preload" href="/styles/non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="/styles/non-critical.css" /></noscript>
</head>
```

**CSS Minification**:

```javascript
// Use Lightning CSS instead of traditional minifiers
import { transform } from 'lightningcss'

const { code } = transform({
  filename: 'style.css',
  code: Buffer.from(css),
  minify: true,
  targets: {
    // Target modern browsers
    chrome: 90 << 16
  }
})
```

**Impact**: First Paint reduced by 400ms

---

### Step 5: Compression & CDN

**Brotli Compression**:

```nginx
# Nginx config
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/javascript application/json;
```

**Cloudflare Auto Compression**:

```
Dashboard → Speed → Optimization → Auto Minify
✅ JavaScript
✅ CSS
✅ HTML

Brotli Compression: ON
```

**Compression Results**:

| Asset Type | Original | Gzip | Brotli | Savings |
|------------|----------|------|--------|---------|
| main.js | 245KB | 68KB | 52KB | 78% |
| styles.css | 45KB | 12KB | 9KB | 80% |
| index.html | 28KB | 8KB | 6KB | 78% |

**Impact**: Total transfer size reduced by 75%

---

### Step 6: Caching Strategy

**Service Worker Caching**:

```javascript
// sw.js
const CACHE_NAME = 'blog-v1'
const STATIC_ASSETS = [
  '/',
  '/styles/main.css',
  '/scripts/app.js',
  '/fonts/GeistVF.woff2'
]

// Pre-cache on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Intercept requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version
        if (response) return response
        
        // Fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Cache new assets
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone)
            })
            return networkResponse
          })
      })
  )
})
```

**HTTP Cache Headers**:

```javascript
// Static assets - long-term cache
Cache-Control: public, max-age=31536000, immutable

// HTML documents - short cache
Cache-Control: public, max-age=0, must-revalidate

// API responses
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

**Impact**: Repeat visits load in < 100ms

---

### Step 7: Preloading & Hints

**Resource Hints**:

```html
<head>
  <!-- DNS prefetch -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
  
  <!-- Preconnect (DNS + TCP + TLS) -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  
  <!-- Preload critical resources -->
  <link rel="preload" href="/fonts/GeistVF.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/images/hero.avif" as="image" type="image/avif" />
  
  <!-- Prefetch next page -->
  <link rel="prefetch" href="/about" />
  
  <!-- Prerender high-probability links -->
  <link rel="prerender" href="/blog" />
</head>
```

**Impact**: LCP reduced by 150ms

---

### Step 8: Edge Computing

**Cloudflare Workers Optimization**:

```typescript
// _worker.ts
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    
    // Long-term cache for static assets
    if (url.pathname.match(/\.(js|css|woff2|avif)$/)) {
      const response = await env.ASSETS.fetch(request)
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      return new Response(response.body, { headers })
    }
    
    // Security headers for HTML
    if (url.pathname.endsWith('.html') || url.pathname === '/') {
      const response = await env.ASSETS.fetch(request)
      const headers = new Headers(response.headers)
      headers.set('X-Frame-Options', 'DENY')
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      return new Response(response.body, { headers })
    }
    
    return env.ASSETS.fetch(request)
  }
}
```

**Impact**: Global access latency < 50ms

---

### Step 9: Layout Stability (CLS)

**Prevent Layout Shifts**:

```html
<!-- ❌ Wrong: Image without dimensions -->
<img src="photo.jpg" alt="Photo" />

<!-- ✅ Correct: Specify dimensions -->
<img src="photo.jpg" alt="Photo" width="800" height="600" />

<!-- ✅ Or use aspect-ratio -->
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

**Font Reserved Space**:

```css
/* ✅ Prevent FOIT/FOUT CLS */
@font-face {
  font-family: 'Geist';
  src: url('GeistVF.woff2') format('woff2');
  font-display: optional;
  size-adjust: 100%;
  ascent-override: 90%;
  descent-override: 20%;
}
```

**Impact**: CLS reduced from 0.25 to 0 ✅

---

### Step 10: Monitoring & Continuous Optimization

**Web Vitals Monitoring**:

```javascript
// Real User Monitoring (RUM)
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric)
  // Use navigator.sendBeacon to ensure data is sent
  (navigator.sendBeacon && navigator.sendBeacon('/analytics', body)) ||
    fetch('/analytics', { body, method: 'POST', keepalive: true })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

**Lighthouse CI**:

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

## Final Results

### PageSpeed Insights Final Scores

```
📱 Mobile:
• LCP: 200ms ✅ (92% improvement)
• FID: 45ms ✅ (75% improvement)
• CLS: 0 ✅ (100% improvement)
• Overall: 98/100

💻 Desktop:
• LCP: 120ms ✅ (90% improvement)
• FID: 25ms ✅ (50% improvement)
• CLS: 0 ✅ (100% improvement)
• Overall: 100/100 🎉
```

### Real User Data (CrUX)

```
Good CWV Experience: 96% of users

LCP Distribution:
┌─────────────────────────────────────┐
│ Good (<2.5s)    ████████████ 96%   │
│ Needs Improvement  ██ 3%           │
│ Poor (>4s)          █ 1%           │
└─────────────────────────────────────┘
```

## Summary: Performance Optimization Checklist

### Must-Do (High ROI)
- [ ] WebP/AVIF images + lazy loading
- [ ] font-display: swap
- [ ] JS code splitting + tree shaking
- [ ] Brotli compression
- [ ] CDN deployment

### Advanced (Medium ROI)
- [ ] Critical CSS inlining
- [ ] Service Worker caching
- [ ] Resource preloading
- [ ] CLS optimization

### Continuous Monitoring
- [ ] Web Vitals RUM monitoring
- [ ] Lighthouse CI integration
- [ ] Performance budgets

---

## References

- [Web Vitals](https://web.dev/vitals/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**How is your website performing? What optimization challenges have you faced? Share your experience!** 👇
