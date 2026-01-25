import type { APIRoute } from 'astro'
import { COMMENTS } from '@/consts'
import {
  getUserByEmail,
  getUserById,
  createOAuthAccount,
  createUser,
  getOAuthAccountByProvider,
  createSession,
  getUserByUsername,
} from '@/lib/db'
import { generateId, createSessionToken, getSessionExpiration, sanitizeHTML } from '@/lib/auth'
import { generateOAuthUrl, exchangeCodeForToken, getOAuthUserInfo, generateOAuthParams } from '@/lib/oauth'

export const prerender = false

// GET - Generate OAuth URL
export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    if (!COMMENTS.appleClientId) {
      return new Response(JSON.stringify({ error: 'Apple Sign In not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { state } = generateOAuthParams()
    const redirectUri = `${url.origin}/api/comments/auth/oauth/apple/callback`

    // Store state in cookie
    cookies.set('oauth_state', JSON.stringify({ state, provider: 'apple' }), {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    })

    // Generate authorization URL
    const authUrl = generateOAuthUrl(
      'apple',
      {
        provider: 'apple',
        clientId: COMMENTS.appleClientId,
        clientSecret: '', // Apple uses JWT for client secret
        redirectUri,
      },
      state,
    )

    return new Response(JSON.stringify({ authUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Apple OAuth URL generation error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// POST - Handle OAuth callback
export const POST: APIRoute = async ({ request, url, locals, cookies }) => {
  try {
    const body = await request.json()
    const { code, state, id_token } = body

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Authorization code and state are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verify state
    const stateData = cookies.get('oauth_state')?.value
    if (!stateData) {
      return new Response(JSON.stringify({ error: 'Invalid state' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { state: expectedState, provider } = JSON.parse(stateData)

    if (state !== expectedState || provider !== 'apple') {
      return new Response(JSON.stringify({ error: 'Invalid state or provider' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Clear state cookie
    cookies.delete('oauth_state', { path: '/' })

    // Get D1 database
    const db = (locals.runtime as any).env.DB
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Generate Apple client secret JWT (simplified)
    // In production, you need to properly sign the JWT with your private key
    const clientSecret = COMMENTS.applePrivateKey // This should be the signed JWT

    // Exchange code for token
    const redirectUri = `${url.origin}/api/comments/auth/oauth/apple/callback`
    const tokenResponse = await exchangeCodeForToken(
      'apple',
      {
        provider: 'apple',
        clientId: COMMENTS.appleClientId,
        clientSecret,
        redirectUri,
      },
      code,
    )

    // Get user info from ID token
    const userInfo = await getOAuthUserInfo('apple', '', tokenResponse.id_token)

    // Check if OAuth account exists
    const existingOAuthAccount = await getOAuthAccountByProvider(db, 'apple', userInfo.id)

    let user: any

    if (existingOAuthAccount) {
      // User already exists, get user data
      user = await getUserById(db, existingOAuthAccount.user_id)
    } else {
      // Check if user exists with same email
      const existingUser = await getUserByEmail(db, userInfo.email)

      if (existingUser) {
        // Link OAuth account to existing user
        user = existingUser

        await createOAuthAccount(db, {
          id: generateId(),
          user_id: user.id,
          provider: 'apple',
          provider_user_id: userInfo.id,
          provider_email: userInfo.email,
          provider_username: undefined,
          provider_avatar_url: undefined,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: tokenResponse.expires_in ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in : undefined,
        })
      } else {
        // Create new user
        const userId = generateId()
        const username = userInfo.email.split('@')[0]

        // Ensure username is unique
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
          email_verified: 1, // Apple users are considered verified
        })

        // Create OAuth account
        await createOAuthAccount(db, {
          id: generateId(),
          user_id: userId,
          provider: 'apple',
          provider_user_id: userInfo.id,
          provider_email: userInfo.email,
          provider_username: undefined,
          provider_avatar_url: undefined,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: tokenResponse.expires_in ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in : undefined,
        })
      }
    }

    // Create session
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionToken = createSessionToken(user.id)
    const expiresAt = getSessionExpiration()

    const userAgent = request.headers.get('user-agent')
    const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'

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
        message: 'Apple Sign In successful',
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
    console.error('Apple OAuth callback error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' } },
    )
  }
}