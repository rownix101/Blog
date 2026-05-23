import { createOAuthState, type OAuthProvider, type OAuthStatePayload } from '$lib/server/auth';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';

const safeReturnTo = (value: string | null, lang: string) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return `/${lang}`;
  return value;
};

/** Generate a PKCE code verifier (43-128 chars, URL-safe) */
const generateCodeVerifier = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(48));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/** SHA-256 code challenge from verifier */
const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const GET: RequestHandler = async ({ params, url, platform }) => {
  const provider = params.provider as OAuthProvider;
  const kv = platform?.env?.AUTH_KV;

  if (!kv || (provider !== 'google' && provider !== 'x')) {
    error(400, 'Invalid provider');
  }

  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'zh';
  const returnTo = safeReturnTo(url.searchParams.get('returnTo'), lang);
  const callbackUrl = new URL(`/api/auth/oauth/${provider}/callback`, url.origin).toString();

  if (provider === 'google') {
    const clientId = platform?.env?.GOOGLE_CLIENT_ID;
    if (!clientId) error(503, 'Google OAuth not configured');

    const state = await createOAuthState(kv, { provider, returnTo, lang });

    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account');

    redirect(302, authUrl.toString());
  }

  // X uses OAuth 2.0 with PKCE
  const clientId = platform?.env?.X_CLIENT_ID;
  if (!clientId) error(503, 'X OAuth not configured');

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Store verifier alongside state so callback can retrieve it
  const state = await createOAuthState(kv, { provider, returnTo, lang, codeVerifier: verifier });

  const authUrl = new URL(X_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'tweet.read users.read');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  redirect(302, authUrl.toString());
};
