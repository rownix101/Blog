import { isLang, preferredLangFromHeader, type Lang } from '$lib/i18n';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const [, maybeLang] = event.url.pathname.split('/');
  event.locals.lang = isLang(maybeLang)
    ? maybeLang
    : preferredLangFromHeader(event.request.headers.get('accept-language'));

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang as Lang)
  });
};
