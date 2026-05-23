import {
  createMagicToken,
  findUserByEmail,
  sendMagicLinkEmail,
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

  let payload: { email?: unknown; lang?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ message: 'Invalid request.' }, { status: 400 });
  }

  const email = validateEmail(payload.email);
  const lang = payload.lang === 'en' ? 'en' : 'zh';

  if (!email) return json({ message: 'Invalid email.' }, { status: 400 });

  const user = await findUserByEmail(db, email);
  if (user) {
    const token = await createMagicToken(kv, user.id, 'login');
    const link = new URL(
      `/api/auth/verify?token=${token}&purpose=login&lang=${lang}`,
      url.origin
    ).toString();
    await sendMagicLinkEmail(resendKey, fromEmail, email, link, 'login', lang).catch(() => {});
  }
  // Always return ok to avoid email enumeration
  return json({ message: 'ok' });
};
