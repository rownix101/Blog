import { isLang, preferredLangFromHeader, type Lang } from '$lib/i18n';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const [, maybeLang] = event.url.pathname.split('/');
  event.locals.lang = isLang(maybeLang)
    ? maybeLang
    : preferredLangFromHeader(event.request.headers.get('accept-language'));

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang as Lang)
  });

  const isCacheablePage =
    event.request.method === 'GET' &&
    response.status === 200 &&
    !event.url.pathname.startsWith('/api/') &&
    !event.url.pathname.includes('/sponsor/return');

  if (isCacheablePage && !response.headers.has('cache-control')) {
    response.headers.set(
      'cache-control',
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    );
  }

  return response;
};
