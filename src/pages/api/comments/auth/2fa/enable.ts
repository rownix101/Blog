import type { APIRoute } from 'astro'
import { COMMENTS } from '@/consts'
import { getUserById, updateUserTwoFactor, validateSession } from '@/lib/db'
import { generateBase32Secret, verifyTOTP } from '@/lib/auth'
import { sendTwoFactorEmail } from '@/lib/email'

export const prerender = false

// GET - Generate 2FA secret
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get session token from cookie
    const sessionToken = request.headers
      .get('cookie')
      ?.match(/session_token=([^;]+)/)?.[1]

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get D1 database
    const db = (locals.runtime as any).env.DB
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify session and get user
    const { user } = await validateSession(db, sessionToken)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate secret
    const secret = generateBase32Secret()

    // Generate a test code
    const testCode = calculateTOTP(secret)

    return new Response(
      JSON.stringify({
        secret,
        testCode,
        issuer: COMMENTS.twoFactorIssuer,
        username: user.username,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('2FA enable error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST - Enable 2FA
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const { secret, code } = body

    if (!secret || !code) {
      return new Response(
        JSON.stringify({ error: 'Secret and code are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Get session token from cookie
    const sessionToken = request.headers
      .get('cookie')
      ?.match(/session_token=([^;]+)/)?.[1]

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get D1 database
    const db = (locals.runtime as any).env.DB
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify session and get user
    const { user } = await validateSession(db, sessionToken)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify code
    const codeValid = verifyTOTP(secret, code)
    if (!codeValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid verification code' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Enable 2FA
    await updateUserTwoFactor(db, user.id, { enabled: true, secret })

    return new Response(
      JSON.stringify({
        message: 'Two-factor authentication enabled successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('2FA enable error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Helper function to calculate TOTP code
function calculateTOTP(secret: string, time: number = Date.now()): string {
  const timeStep = 30
  const counter = Math.floor(time / 1000 / timeStep)

  // Simplified TOTP calculation
  // In production, use a proper TOTP library
  const code = (counter % 1000000).toString().padStart(6, '0')
  return code
}
