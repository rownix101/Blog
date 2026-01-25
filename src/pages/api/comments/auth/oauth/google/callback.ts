import type { APIRoute } from 'astro'

import { COMMENTS } from '@/consts'
import {
  createOAuthAccount,
  createSession,
  createUser,
  getOAuthAccountByProvider,
  getUserByEmail,
  getUserById,
  getUserByUsername,
} from '@/lib/db'
import {
  createSessionToken,
  generateId,
  getSessionExpiration,
  sanitizeHTML,
} from '@/lib/auth'
import { exchangeCodeForToken, getOAuthUserInfo } from '@/lib/oauth'

export const prerender = false

export const GET: APIRoute = async ({ url, request, locals, cookies }) => {
  try {
    const state = url.searchParams.get('state')
    const code = url.searchParams.get('code')

    if (!state || !code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code and state are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const stateData = cookies.get('oauth_state')?.value
    if (!stateData) {
      return new Response(JSON.stringify({ error: 'Invalid state' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const {
      state: expectedState,
      verifier,
      provider,
      returnTo,
    } = JSON.parse(stateData)
    if (state !== expectedState || provider !== 'google') {
      return new Response(
        JSON.stringify({ error: 'Invalid state or provider' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    cookies.delete('oauth_state', { path: '/' })

    const db = locals.runtime?.env.DB
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!COMMENTS.googleClientId || !COMMENTS.googleClientSecret) {
      return new Response(
        JSON.stringify({ error: 'Google OAuth not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const redirectUri = `${url.origin}/api/comments/auth/oauth/google/callback`
    const tokenResponse = await exchangeCodeForToken(
      'google',
      {
        provider: 'google',
        clientId: COMMENTS.googleClientId,
        clientSecret: COMMENTS.googleClientSecret,
        redirectUri,
      },
      code,
      verifier,
    )

    const userInfo = await getOAuthUserInfo(
      'google',
      tokenResponse.access_token,
    )

    const existingOAuthAccount = await getOAuthAccountByProvider(
      db,
      'google',
      userInfo.id,
    )

    let user: any

    if (existingOAuthAccount) {
      user = await getUserById(db, existingOAuthAccount.user_id)
    } else {
      const existingUser = await getUserByEmail(db, userInfo.email)

      if (existingUser) {
        user = existingUser
        await createOAuthAccount(db, {
          id: generateId(),
          user_id: user.id,
          provider: 'google',
          provider_user_id: userInfo.id,
          provider_email: userInfo.email,
          provider_username: userInfo.name,
          provider_avatar_url: userInfo.avatar_url,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: tokenResponse.expires_in
            ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in
            : undefined,
        })
      } else {
        const userId = generateId()
        const username =
          userInfo.name?.replace(/\s+/g, '').toLowerCase() ||
          userInfo.email.split('@')[0]

        let finalUsername = username
        let counter = 1
        while (await getUserByUsername(db, finalUsername)) {
          finalUsername = `${username}${counter}`
          counter++
        }

        user = await createUser(db, {
          id: userId,
          email: userInfo.email,
          username: sanitizeHTML(finalUsername),
          avatar_url: userInfo.avatar_url,
          email_verified: 1,
        })

        await createOAuthAccount(db, {
          id: generateId(),
          user_id: userId,
          provider: 'google',
          provider_user_id: userInfo.id,
          provider_email: userInfo.email,
          provider_username: userInfo.name,
          provider_avatar_url: userInfo.avatar_url,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: tokenResponse.expires_in
            ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in
            : undefined,
        })
      }
    }

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

    cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: COMMENTS.sessionMaxAge,
    })

    const location =
      typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/'
    return new Response(null, {
      status: 302,
      headers: {
        Location: location,
      },
    })
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
