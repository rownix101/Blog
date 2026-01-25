import type { APIRoute } from 'astro'
import { getUserById, updateUserTwoFactor } from '@/lib/db'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return new Response(JSON.stringify({ error: 'Verification code is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

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

    // Verify code before disabling
    const { verifyTOTP } = await import('@/lib/auth')
    if (!user.two_factor_secret) {
      return new Response(JSON.stringify({ error: 'Two-factor authentication not properly configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    const codeValid = verifyTOTP(user.two_factor_secret, code)
    if (!codeValid) {
      return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Disable 2FA
    await updateUserTwoFactor(db, user.id, { enabled: false, secret: undefined })

    return new Response(JSON.stringify({ message: 'Two-factor authentication disabled successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('2FA disable error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' } },
    )
  }
}