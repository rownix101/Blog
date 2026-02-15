---
title: 'Tailwind CSS v4 新機能ガイド：より速く、よりスマートなアトミックCSS'
description: 'Tailwind CSS v4の革新的な変更、@importによる設定、ネイティブCSS変数の活用、そしてパフォーマンスの最適化について詳しく解説します。'
date: '2026-02-21'
tags: ['Tailwind CSS', 'CSS', 'Frontend', 'v4', 'Atomic CSS']
authors: ['rownix']
draft: false
---

> **要約**: Tailwind CSS v4は、ネイティブCSS設定、超高速なビルド、そしてよりスマートになったクラス名エンジンにより、アーキテクチャレベルの革新をもたらします。

## v4 vs v3: なぜアップグレードすべきか？

### パフォーマンス比較

```
ビルド速度の比較 (1000コンポーネント以上のプロジェクト)
┌─────────────────┬─────────────────┐
│ Tailwind v3     │ Tailwind v4     │
│ 2.8秒           │ 0.3秒           │
│ (PostCSSベース)  │ (Rustベース)     │
└─────────────────┴─────────────────┘
              ↓ 9.3倍高速化
```

### 主な変更点の概要

| 機能               | v3                   | v4                   |
| ------------------ | -------------------- | -------------------- |
| 設定方法           | `tailwind.config.js` | CSS `@import`        |
| ビルドエンジン     | PostCSS              | Lightning CSS (Rust) |
| テーマ定義         | JSオブジェクト       | CSS変数              |
| プラグインシステム | JS関数               | CSSファースト        |
| 起動速度           | 約3秒                | 約100ms              |

## 新しい設定方法：CSSファースト

### v3の設定を振り返る

```javascript
// ❌ v3: tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      spacing: {
        128: '32rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
```

### v4のCSSファースト設定

```css
/* ✅ v4: styles.css - 純粋なCSSによる設定 */
@import 'tailwindcss';

/* テーマ設定 */
@theme {
  /* カスタムカラー */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;

  /* カスタムスペーシング */
  --spacing-128: 32rem;

  /* カスタムフォント */
  --font-family-display: 'Inter', system-ui, sans-serif;

  /* カスタムブレークポイント */
  --breakpoint-3xl: 1920px;
}

/* CSSのネストを使用したコンポーネント定義 */
@layer components {
  .btn-primary {
    @apply bg-primary-500 rounded-lg px-4 py-2 text-white;

    &:hover {
      @apply bg-primary-600;
    }

    &:disabled {
      @apply cursor-not-allowed opacity-50;
    }
  }
}

/* ネイティブCSSのカスケードレイヤーを使用 */
@layer utilities {
  .text-shadow-sm {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}
```

### 動的なテーマの切り替え

```css
/* styles.css */
@import 'tailwindcss';

/* デフォルトテーマ */
@theme {
  --color-bg: #ffffff;
  --color-text: #1f2937;
  --color-primary: #3b82f6;
}

/* ダークモード */
@theme dark {
  --color-bg: #111827;
  --color-text: #f9fafb;
  --color-primary: #60a5fa;
}
```

```html
<!-- システムのテーマに自動対応 -->
<body class="bg-bg text-text">
  <button class="bg-primary px-4 py-2 text-white">テーマ対応ボタン</button>
</body>
```

## Lightning CSSエンジン：超高速ビルド

### なぜこれほど速いのか？

```
アーキテクチャの比較:

v3 (PostCSSチェーン)              v4 (Lightning CSS)
┌──────────────┐           ┌──────────────────┐
│ PostCSS      │           │ Lightning CSS    │
│ ├─ tailwind  │           │ (Rustバイナリ)    │
│ ├─ autoprefix│    →      │                  │
│ ├─ cssnano   │           │ シングルパス      │
│ └─ postcss-* │           │ ダイレクト出力     │
└──────────────┘           └──────────────────┘
    約2〜3秒                     約100〜300ms
```

### ビルド時間のベンチマーク

```bash
# v3 ビルド
$ time npm run build:css
Processed 850 utilities in 2847ms

# v4 ビルド
$ time npm run build:css
Processed 850 utilities in 287ms

# 改善率: 9.9倍
```

### 開発体験

```bash
# HMR (ホットリロード) のレイテンシ比較

v3: CSS編集 → 2.1秒後にブラウザが更新
v4: CSS編集 → 180ms後にブラウザが更新

# v4: ほぼ瞬時のフィードバック
```

## スマートなクラス名エンジン

### 任意の値の簡略化

```html
<!-- v3: 角括弧が必要 -->
<div class="top-[67px] h-[45px] w-[123px]"></div>

<!-- v4: よりスマートな推論 -->
<div class="w-123px h-45px top-67px"></div>

<!-- v4: CSS関数のサポート -->
<div class="w-calc(100%-2rem)"></div>
<div class="grid-cols-repeat(3,minmax(0,1fr))"></div>
```

### 任意のプロパティのサポート

```html
<!-- v4: CSSプロパティを直接記述 -->
<div class="[mask-image:linear-gradient(to_bottom,black,transparent)]"></div>

<!-- v4: 複雑なアニメーション -->
<div class="[@keyframes_slide]:animate-[slide_1s_ease-in-out]"></div>
```

### よりスマートなバリアント

```html
<!-- v4: 論理的な組み合わせの簡略化 -->
<button class="hover:focus:bg-blue-600">
  <!-- v3では hover:bg-blue-600 focus:bg-blue-600 と記述が必要でした -->
</button>

<!-- v4: メディアクエリのネスト -->
<div class="md:lg:xl:p-8">
  <!-- すべてのブレークポイントに同時に適用 -->
</div>

<!-- v4: 子要素のクイック選択 -->
<ul class="*:border-b *:p-2 last:*:border-b-0">
  <!-- 最後の子要素以外すべてに適用 -->
  <li>アイテム 1</li>
  <li>アイテム 2</li>
  <li>アイテム 3</li>
</ul>
```

## コンテナクエリ：ネイティブサポート

### コンテナの定義

```html
<!-- v4: ネイティブの @container サポート -->
<div class="@container">
  <!-- コンテナクエリのコンテキスト -->
  <div class="@sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4">
    <!-- レスポンシブグリッド -->
  </div>
</div>
```

### 実践例：カードコンポーネント

```html
<!-- カードコンポーネント - ビューポートではなくコンテナ基準 -->
<div class="card @container">
  <div class="grid gap-4 @sm:grid-cols-2">
    <img
      src="photo.jpg"
      class="h-48 w-full rounded-lg object-cover @sm:h-full"
    />
    <div class="p-4">
      <h2 class="text-xl font-bold @lg:text-2xl">タイトル</h2>
      <p class="mt-2 text-sm @lg:text-base">説明文...</p>
      <button class="mt-4 rounded bg-blue-500 px-4 py-2 text-white @lg:px-6">
        詳細を見る
      </button>
    </div>
  </div>
</div>
```

```css
/* カードをコンテナ化 */
.card {
  container-type: inline-size;
  container-name: card;
}

/* Tailwind v4 の @container バリアントを使用 */
@container card (min-width: 400px) {
  /* 自動生成されるスタイル */
}
```

## 進化したグラデーションとシャドウ

### 線形グラデーションの簡略化

```html
<!-- v3: カスタム設定が必要 -->
<div class="bg-gradient-to-r from-blue-500 to-purple-600"></div>

<!-- v4: 組み込みのプリセットが充実 -->
<div class="bg-linear-45 from-blue-500 via-purple-500 to-pink-500"></div>
<div class="bg-linear-to-r from-red-500 to-orange-500"></div>

<!-- v4: 複雑なグラデーション -->
<div class="bg-[conic-gradient(from_90deg_at_50%_50%,#fff_0%,#000_100%)]"></div>
```

### シャドウレイヤー

```html
<!-- v4: セマンティックなシャドウ -->
<div class="shadow-xs">
  <!-- 極薄のシャドウ -->
  <div class="shadow-sm">
    <!-- 小さなシャドウ (v3にも存在) -->
    <div class="shadow">
      <!-- デフォルトのシャドウ -->
      <div class="shadow-md">
        <!-- 中くらいのシャドウ -->
        <div class="shadow-lg">
          <!-- 大きなシャドウ -->
          <div class="shadow-xl">
            <!-- 特大のシャドウ -->
            <div class="shadow-2xl">
              <!-- 最大のシャドウ -->

              <!-- v4: カラーシャドウ -->
              <div class="shadow-lg shadow-blue-500/50"></div>
              <div class="shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 最適化されたフォームとインタラクション

### ネイティブなフォームスタイリング

```html
<!-- v4: @tailwindcss/forms が標準で統合 -->
<form class="space-y-4">
  <label class="block">
    <span class="text-sm font-medium">メールアドレス</span>
    <input
      type="email"
      class="form-input mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
      placeholder="you@example.com"
    />
  </label>

  <label class="flex items-center">
    <input type="checkbox" class="form-checkbox rounded text-blue-600" />
    <span class="ml-2">ログイン状態を保持する</span>
  </label>

  <button
    class="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
  >
    送信
  </button>
</form>
```

### フォーカスと無効化状態

```html
<!-- v4: より充実した疑似クラス -->
<input
  class="placeholder:text-gray-400 invalid:border-red-500 invalid:text-red-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
/>

<!-- v4: 入力状態のインジケーター -->
<div class="group">
  <input class="peer" type="text" placeholder=" " required />
  <label class="peer-focus:scale-90 peer-[:not(:placeholder-shown)]:scale-90">
    ユーザー名
  </label>
  <p class="peer-invalid:text-red-500">有効なユーザー名を入力してください</p>
</div>
```

## 進化したダークモード

### ストラテジーの比較

```css
/* v4: より柔軟なダークモード設定 */
@import 'tailwindcss';

/* ストラテジー 1: メディアクエリ (デフォルト) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f172a;
    --color-text: #f8fafc;
  }
}

/* ストラテジー 2: クラスの切り替え */
.dark {
  --color-bg: #0f172a;
  --color-text: #f8fafc;
}

/* ストラテジー 3: データ属性 */
[data-theme='dark'] {
  --color-bg: #0f172a;
  --color-text: #f8fafc;
}
```

### 実践例：ダークモードの切り替え

```html
<!DOCTYPE html>
<html class="antialiased">
  <body
    class="bg-white text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100"
  >
    <nav class="border-b border-slate-200 dark:border-slate-800">
      <button
        onclick="document.documentElement.classList.toggle('dark')"
        class="rounded-lg bg-slate-100 p-2 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <span class="dark:hidden">🌙</span>
        <span class="hidden dark:inline">☀️</span>
      </button>
    </nav>

    <main class="prose dark:prose-invert">
      <h1 class="text-3xl font-bold">アダプティブテーマ</h1>
      <p class="text-slate-600 dark:text-slate-400">
        Tailwind v4でダークモードの実装がより簡単になります
      </p>
    </main>
  </body>
</html>
```

## v3からv4への移行

### 移行の手順

```bash
# 1. 依存関係のアップグレード
npm install tailwindcss@next

# 2. 設定ファイルのリネーム
mv tailwind.config.js tailwind.config.js.backup

# 3. 新しいCSSエントリポイントの作成
# styles.css (上記の設定例を参照)

# 4. ビルドスクリプトの更新
# package.json
{
  "scripts": {
    "build:css": "tailwindcss -i ./styles.css -o ./dist/output.css --minify"
  }
}
```

### 互換性の維持

```css
/* styles.css */
@import 'tailwindcss';

/* v3 プラグインのインポート (互換モード) */
@plugin '@tailwindcss/typography';
@plugin '@tailwindcss/forms';
@plugin '@tailwindcss/aspect-ratio';

/* v3 のカスタム設定を保持 */
@theme {
  /* v3 の theme.extend 内容を直接コピー */
  --color-brand: #ff6b6b;
  --font-family-mono: 'Fira Code', monospace;

  /* v3 の screens は CSS 変数になります */
  --breakpoint-xs: 475px;
  --breakpoint-2xl: 1400px;
}
```

### よくある問題

```javascript
// ❌ v3: JavaScript による設定
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // ...
}

// ✅ v4: CSS による設定
// styles.css
@import "tailwindcss" source("./src");
// または glob を使用
@import "tailwindcss" source(npm: "./src/**/*.{js,ts,jsx,tsx}");
```

## パフォーマンスのベストプラクティス

### 1. オンデマンド生成

```css
/* v4 はデフォルトでオンデマンド生成を行いますが、さらに最適化可能です */
@import 'tailwindcss';

/* source を使用してスキャン範囲を制限 */
@import 'tailwindcss' source('./src');

/* テストファイルを除外 */
@import 'tailwindcss' source('./src') not source('./src/**/*.test.*');
```

### 2. セーフリストの最適化

```css
/* v4: CSS ベースのセーフリスト */
@import "tailwindcss";

@layer base {
  /* 明示的に保持するクラス名 */
  .btn-primary {}
  .card {}
  .modal {}
}

/* または新しい構文を使用 */
@safe {
  btn-primary;
  card;
  modal;
}
```

### 3. プロダクション環境の最適化

```bash
# 開発モード (高速)
tailwindcss -i styles.css -o output.css --watch

# プロダクションモード (圧縮済み)
tailwindcss -i styles.css -o output.css --minify

# v4 には最適化機能が組み込まれているため、別途 cssnano の設定は不要です
```

## まとめ

Tailwind CSS v4 の主な利点:

| 機能                       | 改善点                    |
| -------------------------- | ------------------------- |
| 設定方法                   | CSSファーストでより直感的 |
| ビルド速度                 | 10倍の高速化              |
| 開発体験                   | HMRの高速化               |
| クラス名のインテリジェンス | 任意の値の記述が簡略化    |
| コンテナクエリ             | 標準でサポート            |
| テーマシステム             | CSS変数駆動               |

---

**Tailwind v4 を使い始めましたか？ 移行の際に直面した課題などがあれば、ぜひ教えてください！** 👇
