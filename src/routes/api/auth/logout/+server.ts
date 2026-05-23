import { deleteSession } from '$lib/server/auth';
import { redirect, type RequestHandler } from '@sveltejs/kit';

const SESSION_COOKIE = 'session';

export const POST: RequestHandler = async ({ platform, cookies }) => {
  const kv = platform?.env?.AUTH_KV;
  const token = cookies.get(SESSION_COOKIE);

  if (kv && token) {
    await deleteSession(kv, token).catch(() => {});
  }

  cookies.delete(SESSION_COOKIE, { path: '/' });
  return new Response(null, { status: 204 });
};
