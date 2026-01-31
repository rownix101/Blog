import type { APIRoute } from 'astro'
import { COMMENTS } from '@/consts'
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
  createSession,
} from '@/lib/db'
import {
  generateId,
  hashPassword,
  sanitizeHTML,
  createSessionToken,
  getSessionExpiration,
} from '@/lib/auth'
import { getVerificationCode, deleteVerificationCode } from '@/lib/kv'
import {
  validateEmail,
  validateUsername,
  validatePassword,
  RateLimiter,
} from '@/lib/validation'

// Rate limiter for registration attempts
const registerRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
})

export const prerender = false

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  // Rate limiting
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'unknown'
  const rateLimitCheck = registerRateLimiter.check(clientIp)

  if (!rateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(
            (rateLimitCheck.resetTime - Date.now()) / 1000,
          ).toString(),
        },
      },
    )
  }

  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { email, username, password, code, acceptedTerms } = body

    // Validate input presence
    if (!email || !username || !password || !code) {
      return new Response(
        JSON.stringify({
          error:
            'Email, username, password, and verification code are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (acceptedTerms !== true) {
      return new Response(
        JSON.stringify({
          error: 'You must accept the Terms of Service and Privacy Policy',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return new Response(JSON.stringify({ error: emailValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate username
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      return new Response(JSON.stringify({ error: usernameValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return new Response(JSON.stringify({ error: passwordValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get D1 database and KV
    const db = locals.runtime?.env.DB
    const kv = locals.runtime?.env.COMMENT_KV

    if (!db || !kv) {
      return new Response(
        JSON.stringify({ error: 'Database or KV not available' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const hasPasswordHash = await hasUsersPasswordHashColumn(db)
    if (!hasPasswordHash) {
      return new Response(
        JSON.stringify({
          error:
            'Database schema outdated: missing users.password_hash. Run: ALTER TABLE users ADD COLUMN password_hash TEXT;',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Check if user already exists
    const existingUserByEmail = await getUserByEmail(db, email)
    if (existingUserByEmail) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const existingUserByUsername = await getUserByUsername(db, username)
    if (existingUserByUsername) {
      return new Response(JSON.stringify({ error: 'Username already taken' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify code from KV
    const storedCode = await getVerificationCode(kv, email.toLowerCase())
    if (!storedCode || storedCode !== code) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Create user
    const userId = generateId()
    const hashedPassword = await hashPassword(password)
    const sanitizedUsername = sanitizeHTML(username)

    const user = await createUser(db, {
      id: userId,
      email: email.toLowerCase(),
      username: sanitizedUsername,
      password_hash: hashedPassword,
      email_verified: 1, // Verified!
    })

    // Delete used code
    await deleteVerificationCode(kv, email.toLowerCase())

    // Create session
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionToken = createSessionToken(user.id)
    const expiresAt = getSessionExpiration()

    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      undefined

    await createSession(db, {
      id: sessionId,
      user_id: user.id,
      token: sessionToken,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt,
    })

    // Set session cookie
    cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: COMMENTS.sessionMaxAge,
    })

    // Return user data (without sensitive info)
    return new Response(
      JSON.stringify({
        message: 'Registration successful.',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          email_verified: user.email_verified,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Registration error:', error)

    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('UNIQUE constraint failed: users.email')) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
    if (message.includes('UNIQUE constraint failed: users.username')) {
      return new Response(JSON.stringify({ error: 'Username already taken' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function hasUsersPasswordHashColumn(db: D1Database): Promise<boolean> {
  const result = await db
    .prepare('PRAGMA table_info(users)')
    .all<{ name: string }>()
  return (result.results || []).some((col) => col.name === 'password_hash')
}
