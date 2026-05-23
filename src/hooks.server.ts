import { isLang, preferredLangFromHeader, type Lang } from '$lib/i18n';
import { findUserById, getSessionUserId } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const [, maybeLang] = event.url.pathname.split('/');
  event.locals.lang = isLang(maybeLang)
    ? maybeLang
    : preferredLangFromHeader(event.request.headers.get('accept-language'));

  // Resolve session
  event.locals.user = null;
  const kv = event.platform?.env?.AUTH_KV;
  const db = event.platform?.env?.COMMENTS_DB;
  const sessionToken = event.cookies.get('session');
  if (kv && db && sessionToken) {
    try {
      const userId = await getSessionUserId(kv, sessionToken);
      if (userId) {
        const user = await findUserById(db, userId);
        if (user?.emailVerified) {
          event.locals.user = { id: user.id, email: user.email, displayName: user.displayName };
        }
      }
    } catch {
      // ignore session errors
    }
  }

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang as Lang)
  });

  const isCacheablePage =
    event.request.method === 'GET' &&
    response.status === 200 &&
    !sessionToken &&
    !event.locals.user &&
    !event.url.pathname.startsWith('/api/') &&
    !event.url.pathname.includes('/sponsor/return');

  if (sessionToken || event.locals.user) {
    response.headers.set('cache-control', 'private, no-store, max-age=0, must-revalidate');
    response.headers.set('cdn-cache-control', 'no-store');
    response.headers.set('cloudflare-cdn-cache-control', 'no-store');
  }

  if (event.url.pathname.startsWith('/api/comments/')) {
    response.headers.set('cache-control', 'no-store, no-cache, max-age=0, must-revalidate');
    response.headers.set('cdn-cache-control', 'no-store');
    response.headers.set('cloudflare-cdn-cache-control', 'no-store');
    response.headers.set('expires', '0');
    response.headers.set('pragma', 'no-cache');
  }

  if (isCacheablePage && !response.headers.has('cache-control')) {
    response.headers.set(
      'cache-control',
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    );
  }

  return response;
};
