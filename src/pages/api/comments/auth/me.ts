import type { APIRoute } from 'astro'
import { getUserById, validateSession } from '@/lib/db'

export const prerender = false

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

    // Return user data (without sensitive info)
    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar_url: user.avatar_url,
          email_verified: user.email_verified,
          two_factor_enabled: user.two_factor_enabled,
          created_at: user.created_at,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Get user error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
