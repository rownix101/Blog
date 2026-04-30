import { legalPages } from '$lib/legal';
import { languages } from '$lib/i18n';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const canonicalUrl = new URL(`/${params.lang}/privacy`, url.origin).toString();

  return {
    page: legalPages[params.lang].privacy,
    canonicalUrl,
    alternateUrls: Object.fromEntries(
      languages.map((lang) => [lang, new URL(`/${lang}/privacy`, url.origin).toString()])
    )
  };
};
