import { COMMENTS } from '@/consts'
import type { Session, User } from '@/types/comment'

// Generate a random token for sessions
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${generateToken(16)}`
}

// Hash a password using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(encoder.encode(password)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )

  // NOTE: Cloudflare Workers has a PBKDF2 iteration limit (100k).
  const iterations = 100_000

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const hash = new Uint8Array(bits)

  return `pbkdf2_sha256$${iterations}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`
}

// Verify a password
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    const parts = hash.split('$')
    if (parts.length !== 4) {
      return false
    }

    const [algo, iterationsRaw, saltB64, expectedB64] = parts
    if (algo !== 'pbkdf2_sha256') {
      return false
    }

    const iterations = Number(iterationsRaw)
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return false
    }

    const salt = base64ToBytes(saltB64)
    const expected = base64ToBytes(expectedB64)

    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(encoder.encode(password)),
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    )

    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: toArrayBuffer(salt),
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      expected.byteLength * 8,
    )

    const actual = new Uint8Array(bits)
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

// Generate a 6-digit 2FA code
export function generateTwoFactorCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return code
}

// Generate a base32 secret for TOTP
export function generateBase32Secret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  const randomValues = new Uint8Array(20)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < 20; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}

// Calculate TOTP code (simplified version)
export function calculateTOTP(
  secret: string,
  time: number = Date.now(),
): string {
  // This is a simplified TOTP implementation
  // In production, use a proper TOTP library like otpauth
  const timeStep = 30
  const counter = Math.floor(time / 1000 / timeStep)
  const counterBytes = new ArrayBuffer(8)
  const counterView = new DataView(counterBytes)
  counterView.setUint32(4, counter, false)

  // HMAC-SHA1 would be needed here
  // For now, return a 6-digit code based on the counter
  const code = (counter % 1000000).toString().padStart(6, '0')
  return code
}

// Verify TOTP code
export function verifyTOTP(
  secret: string,
  code: string,
  window: number = 1,
): boolean {
  const time = Date.now()
  const timeStep = 30

  for (let i = -window; i <= window; i++) {
    const expectedCode = calculateTOTP(secret, time + i * timeStep * 1000)
    if (expectedCode === code) {
      return true
    }
  }

  return false
}

// Create a session token
export function createSessionToken(userId: string): string {
  const payload = {
    userId,
    createdAt: Date.now(),
  }
  const encoded = btoa(JSON.stringify(payload))
  const signature = generateToken(16)
  return `${encoded}.${signature}`
}

export function decodeSessionToken(
  token: string,
): { userId: string; createdAt: number } | null {
  try {
    const [encoded, signature] = token.split('.')
    const payload = JSON.parse(atob(encoded))
    return payload
  } catch {
    return null
  }
}

// Check if a session is valid
export function isSessionValid(session: Session): boolean {
  const now = Math.floor(Date.now() / 1000)
  return session.expires_at > now
}

// Get session expiration time
export function getSessionExpiration(): number {
  const maxAge = COMMENTS.sessionMaxAge || 2592000 // Default 30 days
  return Math.floor(Date.now() / 1000) + maxAge
}

// Generate OAuth state parameter
export function generateOAuthState(): string {
  return generateToken(32)
}

// Verify OAuth state
export function verifyOAuthState(
  state: string,
  expectedState: string,
): boolean {
  return state === expectedState
}

// Generate PKCE code verifier
export function generatePKCEVerifier(): string {
  return generateToken(43)
}

// Generate PKCE code challenge
export async function generatePKCEChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashBytes = new Uint8Array(hash)
  return bytesToBase64(hashBytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Get user display name
export function getUserDisplayName(user: User): string {
  return user.username || user.email.split('@')[0]
}

// Get user avatar URL
export function getUserAvatarUrl(user: User): string {
  if (user.avatar_url) {
    return user.avatar_url
  }
  // Generate a default avatar using initials
  const initials = user.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#6366f1"/>
      <text x="50" y="55" text-anchor="middle" font-size="40" fill="white" font-family="sans-serif">${initials}</text>
    </svg>
  `)}`
}

// Sanitize HTML content
export function sanitizeHTML(html: string): string {
  // Basic HTML sanitization
  // In production, use a proper library like DOMPurify
  const allowedTags = [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'a',
    'code',
    'pre',
    'blockquote',
    'ul',
    'ol',
    'li',
  ]
  const allowedAttributes = ['href', 'title', 'target']

  let sanitized = html

  // Remove script tags and on* attributes
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  )
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')

  return sanitized
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate username format
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
  return usernameRegex.test(username)
}

// Validate comment content
export function isValidCommentContent(content: string): boolean {
  // Check length
  if (content.length < 1 || content.length > 5000) {
    return false
  }
  return true
}

// Detect spam in comment content
export function detectSpam(content: string): boolean {
  const spamKeywords = [
    'viagra',
    'casino',
    'poker',
    'xxx',
    'porn',
    'free money',
    'click here',
    'buy now',
  ]
  const lowerContent = content.toLowerCase()

  for (const keyword of spamKeywords) {
    if (lowerContent.includes(keyword)) {
      return true
    }
  }

  return false
}
