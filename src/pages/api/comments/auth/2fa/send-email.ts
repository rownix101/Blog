import type { APIRoute } from 'astro'
import { getUserById, validateSession } from '@/lib/db'
import { generateTwoFactorCode } from '@/lib/auth'
import { setVerificationCode, checkCooldown } from '@/lib/kv'
import { sendTwoFactorEmail } from '@/lib/email'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
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

    // Get D1 database and KV
    const db = (locals.runtime as any).env.DB
    const kv = (locals.runtime as any).env.COMMENT_KV

    if (!db || !kv) {
      return new Response(
        JSON.stringify({ error: 'Database or KV not available' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
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

    // Check cooldown
    const isCooldown = await checkCooldown(kv, user.email.toLowerCase())
    if (isCooldown) {
      return new Response(
        JSON.stringify({
          error: 'Please wait 60 seconds before requesting a new code',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Generate 2FA code
    const code = generateTwoFactorCode()

    // Store in KV
    await setVerificationCode(kv, user.email.toLowerCase(), code)

    // Send email
    try {
      await sendTwoFactorEmail(user.email, code)
    } catch (error) {
      console.error('Failed to send 2FA email:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ message: 'Verification code sent to your email' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Send 2FA email error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
