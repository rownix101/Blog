import type { APIRoute } from 'astro'
import { getUserById } from '@/lib/db'
import { generateTwoFactorCode, generateId } from '@/lib/auth'
import { createTwoFactorToken } from '@/lib/db'
import { sendTwoFactorEmail } from '@/lib/email'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get session token from cookie
    const sessionToken = request.headers.get('cookie')?.match(/session_token=([^;]+)/)?.[1]

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Get D1 database
    const db = (locals.runtime as any).env.DB
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verify session and get user
    const { verifySessionToken } = await import('@/lib/auth')
    const sessionData = verifySessionToken(sessionToken)

    if (!sessionData) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    const user = await getUserById(db, sessionData.userId)
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (!user.two_factor_enabled) {
      return new Response(JSON.stringify({ error: 'Two-factor authentication is not enabled' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Generate 2FA code
    const code = generateTwoFactorCode()
    const tokenId = generateId()
    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60 // 5 minutes

    // Store token
    await createTwoFactorToken(db, {
      id: tokenId,
      user_id: user.id,
      token: code,
      type: 'email',
      expires_at: expiresAt,
    })

    // Send email
    try {
      await sendTwoFactorEmail(user.email, code)
    } catch (error) {
      console.error('Failed to send 2FA email:', error)
      return new Response(JSON.stringify({ error: 'Failed to send verification email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ message: 'Verification code sent to your email' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Send 2FA email error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' } },
    )
  }
}