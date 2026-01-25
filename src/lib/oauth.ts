import { OAUTH_PROVIDERS } from '@/consts'
import type { OAuthProvider } from '@/types/comment'
import {
  generateId,
  generateOAuthState,
  generatePKCEVerifier,
  generatePKCEChallenge,
} from './auth'

export interface OAuthConfig {
  provider: OAuthProvider
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface OAuthUserInfo {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  id_token?: string
}

// Generate OAuth authorization URL
export function generateOAuthUrl(
  provider: OAuthProvider,
  config: OAuthConfig,
  state: string,
  codeChallenge?: string,
): string {
  const providerConfig = OAUTH_PROVIDERS[provider]
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
    scope: providerConfig.scopes.join(' '),
  })

  if (codeChallenge) {
    params.append('code_challenge', codeChallenge)
    params.append('code_challenge_method', 'S256')
  }

  return `${providerConfig.authUrl}?${params.toString()}`
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  config: OAuthConfig,
  code: string,
  codeVerifier?: string,
): Promise<OAuthTokenResponse> {
  const providerConfig = OAUTH_PROVIDERS[provider]
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
  })

  if (codeVerifier) {
    params.append('code_verifier', codeVerifier)
  }

  const response = await fetch(providerConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for token: ${error}`)
  }

  return response.json()
}

// Get user info from OAuth provider
export async function getOAuthUserInfo(
  provider: OAuthProvider,
  accessToken: string,
  idToken?: string,
): Promise<OAuthUserInfo> {
  return await getGoogleUserInfo(accessToken)
}

// Get Google user info
async function getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to get Google user info')
  }

  const data = await response.json()
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatar_url: data.picture,
  }
}

// Generate OAuth state and PKCE verifier (for Google)
export function generateOAuthParams() {
  const state = generateOAuthState()
  const verifier = generatePKCEVerifier()
  return { state, verifier }
}

// Store OAuth state in session
export function storeOAuthState(
  state: string,
  verifier: string,
  provider: OAuthProvider,
): void {
  const storageKey = `oauth_${state}`
  const data = JSON.stringify({ verifier, provider, timestamp: Date.now() })
  sessionStorage.setItem(storageKey, data)
}

// Retrieve and verify OAuth state
export function retrieveOAuthState(
  state: string,
): { verifier: string; provider: OAuthProvider } | null {
  const storageKey = `oauth_${state}`
  const data = sessionStorage.getItem(storageKey)
  if (!data) {
    return null
  }

  try {
    const parsed = JSON.parse(data)
    // Check if state is not too old (10 minutes)
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      sessionStorage.removeItem(storageKey)
      return null
    }

    sessionStorage.removeItem(storageKey)
    return parsed
  } catch {
    sessionStorage.removeItem(storageKey)
    return null
  }
}
