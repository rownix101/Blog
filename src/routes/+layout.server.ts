import { getArticleSummaries } from '$lib/content';
import { isLang, preferredLangFromHeader, t } from '$lib/i18n';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ request, url }) => {
  const [, maybeLang] = url.pathname.split('/');
  const lang = isLang(maybeLang)
    ? maybeLang
    : preferredLangFromHeader(request.headers.get('accept-language'));

  return {
    lang,
    copy: t(lang),
    latestArticles: getArticleSummaries(lang).slice(0, 6)
  };
};
