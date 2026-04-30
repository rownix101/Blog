import { legalPages } from '$lib/legal';
import { languages } from '$lib/i18n';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const canonicalUrl = new URL(`/${params.lang}/cookies`, url.origin).toString();

  return {
    page: legalPages[params.lang].cookies,
    canonicalUrl,
    alternateUrls: Object.fromEntries(
      languages.map((lang) => [lang, new URL(`/${lang}/cookies`, url.origin).toString()])
    )
  };
};
