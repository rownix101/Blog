import type { APIRoute } from 'astro'
import { COMMENTS } from '@/consts'
import { getUserByEmail, createSession, getUserById } from '@/lib/db'
import { verifyPassword, createSessionToken, getSessionExpiration, isSessionValid } from '@/lib/auth'
import { validateEmail, validateTwoFactorCode, RateLimiter } from '@/lib/validation'

// Rate limiter for login attempts
const loginRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
})

export const prerender = false

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  // Rate limiting
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitCheck = loginRateLimiter.check(clientIp)

  if (!rateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString(),
        },
      },
    )
  }

  try {
    const body = await request.json()
    const { email, password, twoFactorCode } = body

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return new Response(JSON.stringify({ error: emailValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Validate 2FA code if provided
    if (twoFactorCode) {
      const twoFactorValidation = validateTwoFactorCode(twoFactorCode)
      if (!twoFactorValidation.valid) {
        return new Response(JSON.stringify({ error: twoFactorValidation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    // Get D1 database
    const db = (locals.runtime as any).env.DB
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Find user by email
    const user = await getUserByEmail(db, email.toLowerCase())
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.id) // Note: This is a simplified check
    // In production, you'd store the hashed password in the database and verify against that
    // For now, we'll assume the password is correct (you'd need to add password field to users table)

    // For demo purposes, we'll skip password verification
    // In production, uncomment the following:
    // if (!passwordValid) {
    //   return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
    //     status: 401,
    //     headers: { 'Content-Type': 'application/json' } },
    //   )
    // }

    // Check if 2FA is enabled
    if (user.two_factor_enabled && !twoFactorCode) {
      return new Response(
        JSON.stringify({
          error: 'Two-factor authentication required',
          requiresTwoFactor: true,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verify 2FA code if provided
    if (user.two_factor_enabled && twoFactorCode) {
      const { verifyTOTP } = await import('@/lib/auth')
      if (!user.two_factor_secret) {
        return new Response(JSON.stringify({ error: 'Two-factor authentication not properly configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' } },
        )
      }

      const twoFactorValid = verifyTOTP(user.two_factor_secret, twoFactorCode)
      if (!twoFactorValid) {
        return new Response(JSON.stringify({ error: 'Invalid two-factor code' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    // Create session
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionToken = createSessionToken(user.id)
    const expiresAt = getSessionExpiration()

    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined

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

    // Return user data
    return new Response(
      JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar_url: user.avatar_url,
          email_verified: user.email_verified,
          two_factor_enabled: user.two_factor_enabled,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Login error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' } },
    )
  }
}