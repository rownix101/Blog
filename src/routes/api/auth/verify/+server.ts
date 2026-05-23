import {
  consumeMagicToken,
  createSession,
  findUserById,
  verifyUserEmail
} from '$lib/server/auth';
import { redirect, type RequestHandler } from '@sveltejs/kit';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  const db = platform?.env?.COMMENTS_DB;
  const kv = platform?.env?.AUTH_KV;
  const token = url.searchParams.get('token');
  const purpose = url.searchParams.get('purpose');
  const lang = url.searchParams.get('lang') ?? 'zh';

  const failUrl = `/${lang}/auth/login?error=invalid`;

  if (!db || !kv || !token || (purpose !== 'verify' && purpose !== 'login')) {
    redirect(302, failUrl);
  }

  const userId = await consumeMagicToken(kv, token, purpose);
  if (!userId) redirect(302, failUrl);

  if (purpose === 'verify') {
    await verifyUserEmail(db, userId);
  }

  const user = await findUserById(db, userId);
  if (!user) redirect(302, failUrl);

  if (!user.emailVerified && purpose === 'login') {
    redirect(302, `/${lang}/auth/login?error=unverified`);
  }

  const sessionToken = await createSession(kv, userId);
  cookies.set(SESSION_COOKIE, sessionToken, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE
  });

  redirect(302, `/${lang}`);
};
