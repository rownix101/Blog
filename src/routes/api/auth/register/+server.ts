import {
  createMagicToken,
  createUser,
  findUserByEmail,
  sendMagicLinkEmail,
  validateDisplayName,
  validateEmail
} from '$lib/server/auth';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, platform, url }) => {
  const db = platform?.env?.COMMENTS_DB;
  const kv = platform?.env?.AUTH_KV;
  const resendKey = platform?.env?.RESEND_API_KEY;
  const fromEmail = platform?.env?.RESEND_FROM_EMAIL;

  if (!db || !kv || !resendKey || !fromEmail) {
    return json({ message: 'Auth not configured.' }, { status: 503 });
  }

  let payload: { email?: unknown; displayName?: unknown; lang?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ message: 'Invalid request.' }, { status: 400 });
  }

  const email = validateEmail(payload.email);
  const displayName = validateDisplayName(payload.displayName);
  const lang = payload.lang === 'en' ? 'en' : 'zh';

  if (!email) return json({ message: 'Invalid email.' }, { status: 400 });
  if (!displayName) return json({ message: 'Invalid display name.' }, { status: 400 });

  const existing = await findUserByEmail(db, email);
  if (existing) {
    // Don't reveal if email exists; send login link instead
    const token = await createMagicToken(kv, existing.id, 'login');
    const link = new URL(
      `/api/auth/verify?token=${token}&purpose=login&lang=${lang}`,
      url.origin
    ).toString();
    await sendMagicLinkEmail(resendKey, fromEmail, email, link, 'login', lang).catch(() => {});
    return json({ message: 'ok' });
  }

  let user;
  try {
    user = await createUser(db, email, displayName);
  } catch (caughtError) {
    const existingAfterRace = await findUserByEmail(db, email);
    if (!existingAfterRace) throw caughtError;

    const token = await createMagicToken(kv, existingAfterRace.id, 'login');
    const link = new URL(
      `/api/auth/verify?token=${token}&purpose=login&lang=${lang}`,
      url.origin
    ).toString();
    await sendMagicLinkEmail(resendKey, fromEmail, email, link, 'login', lang).catch(() => {});
    return json({ message: 'ok' });
  }
  const token = await createMagicToken(kv, user.id, 'verify');
  const link = new URL(
    `/api/auth/verify?token=${token}&purpose=verify&lang=${lang}`,
    url.origin
  ).toString();
  await sendMagicLinkEmail(resendKey, fromEmail, email, link, 'verify', lang);

  return json({ message: 'ok' });
};
