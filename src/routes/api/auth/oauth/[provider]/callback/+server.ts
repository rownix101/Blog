import {
  consumeOAuthState,
  createSession,
  findOrCreateOAuthUser,
  type OAuthProvider
} from '$lib/server/auth';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const safeReturnTo = (value: string | undefined, lang: string) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return `/${lang}`;
  return value;
};

// --- Google ---

type GoogleTokenResponse = { access_token: string };
type GoogleUserInfo = { sub: string; email: string; name: string; email_verified: boolean };

const exchangeGoogleCode = async (
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleUserInfo> => {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as GoogleTokenResponse;

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: `Bearer ${access_token}` }
  });
  if (!userRes.ok) throw new Error(`Google userinfo failed: ${userRes.status}`);
  return (await userRes.json()) as GoogleUserInfo;
};

// --- X (Twitter) ---

type XTokenResponse = { access_token: string };
type XUserResponse = { data: { id: string; name: string; username: string } };

const exchangeXCode = async (
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  codeVerifier: string
): Promise<{ id: string; name: string; username: string }> => {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${credentials}`
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  });
  if (!tokenRes.ok) throw new Error(`X token exchange failed: ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as XTokenResponse;

  const userRes = await fetch('https://api.twitter.com/2/users/me', {
    headers: { authorization: `Bearer ${access_token}` }
  });
  if (!userRes.ok) throw new Error(`X userinfo failed: ${userRes.status}`);
  const { data } = (await userRes.json()) as XUserResponse;
  return data;
};

// --- Handler ---

export const GET: RequestHandler = async ({ params, url, platform, cookies }) => {
  const provider = params.provider as OAuthProvider;
  const kv = platform?.env?.AUTH_KV;
  const db = platform?.env?.COMMENTS_DB;

  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (!kv || !db || !code || !stateParam) {
    redirect(302, '/');
  }

  if (oauthError) {
    redirect(302, '/');
  }

  const stateData = await consumeOAuthState(kv, stateParam);
  if (!stateData || stateData.provider !== provider) {
    redirect(302, '/');
  }

  const lang = stateData.lang === 'en' ? 'en' : 'zh';
  const returnTo = safeReturnTo(stateData.returnTo, lang);
  const callbackUrl = new URL(`/api/auth/oauth/${provider}/callback`, url.origin).toString();

  try {
    let subject: string;
    let email: string;
    let displayName: string;

    if (provider === 'google') {
      const clientId = platform?.env?.GOOGLE_CLIENT_ID;
      const clientSecret = platform?.env?.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) error(503, 'Google OAuth not configured');

      const info = await exchangeGoogleCode(code, clientId, clientSecret, callbackUrl);
      if (!info.email_verified) redirect(302, `/${lang}/auth/login?error=unverified`);

      subject = info.sub;
      email = info.email.toLowerCase();
      displayName = info.name || email.split('@')[0];
    } else if (provider === 'x') {
      const clientId = platform?.env?.X_CLIENT_ID;
      const clientSecret = platform?.env?.X_CLIENT_SECRET;
      if (!clientId || !clientSecret) error(503, 'X OAuth not configured');
      if (!stateData.codeVerifier) redirect(302, '/');

      const xUser = await exchangeXCode(
        code,
        clientId,
        clientSecret,
        callbackUrl,
        stateData.codeVerifier
      );

      // X doesn't provide email in basic scope; use a synthetic placeholder
      subject = xUser.id;
      email = `x_${xUser.id}@oauth.placeholder`;
      displayName = xUser.name || xUser.username;
    } else {
      error(400, 'Invalid provider');
    }

    const user = await findOrCreateOAuthUser(db, provider, subject, email, displayName);
    const sessionToken = await createSession(kv, user.id);

    cookies.set(SESSION_COOKIE, sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE
    });

    redirect(302, returnTo);
  } catch (e) {
    if (e instanceof Response) throw e; // re-throw SvelteKit redirects/errors
    console.error(`OAuth callback error [${provider}]:`, e);
    redirect(302, `/${lang}`);
  }
};
