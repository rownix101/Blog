import type { APIRoute } from 'astro'
import { deleteSession, getSessionByToken } from '@/lib/db'

export const prerender = false

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Get session token from cookie
    const sessionToken = cookies.get('session_token')?.value

    if (!sessionToken) {
      return new Response(JSON.stringify({ message: 'No active session' }), {
        status: 200,
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

    // Delete session from database
    await deleteSession(db, sessionToken)

    // Clear session cookie
    cookies.delete('session_token', {
      path: '/',
    })

    return new Response(JSON.stringify({ message: 'Logout successful' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Logout error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' } },
    )
  }
}