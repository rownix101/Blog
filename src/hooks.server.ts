import { defaultLang, isLang, type Lang } from '$lib/i18n';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const [, maybeLang] = event.url.pathname.split('/');
  event.locals.lang = isLang(maybeLang) ? maybeLang : defaultLang;

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang as Lang)
  });
};
