import type { APIRoute } from 'astro'
import { getUserById, validateSession } from '@/lib/db'
import { verifyTOTP, generateTwoFactorCode } from '@/lib/auth'
import { getVerificationCode, deleteVerificationCode } from '@/lib/kv'
import { sendTwoFactorEmail } from '@/lib/email'

export const prerender = false

// POST - Verify 2FA code
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const { code, type = 'totp' } = body

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
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

    if (!user.two_factor_enabled) {
      return new Response(
        JSON.stringify({ error: 'Two-factor authentication is not enabled' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    let codeValid = false

    if (type === 'totp') {
      // Verify TOTP code
      if (!user.two_factor_secret) {
        return new Response(
          JSON.stringify({
            error: 'Two-factor authentication not properly configured',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      codeValid = verifyTOTP(user.two_factor_secret, code)
    } else if (type === 'email') {
      // Verify email code
      const kv = (locals.runtime as any).env.COMMENT_KV
      if (!kv) {
        return new Response(JSON.stringify({ error: 'KV not available' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const storedCode = await getVerificationCode(kv, user.email.toLowerCase())

      if (!storedCode || storedCode !== code) {
        codeValid = false
      } else {
        codeValid = true
        await deleteVerificationCode(kv, user.email.toLowerCase())
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid verification type' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (!codeValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid verification code' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ message: 'Verification successful' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('2FA verification error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
