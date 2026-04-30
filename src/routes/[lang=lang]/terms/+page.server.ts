import { legalPages } from '$lib/legal';
import { languages } from '$lib/i18n';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const canonicalUrl = new URL(`/${params.lang}/terms`, url.origin).toString();

  return {
    page: legalPages[params.lang].terms,
    canonicalUrl,
    alternateUrls: Object.fromEntries(
      languages.map((lang) => [lang, new URL(`/${lang}/terms`, url.origin).toString()])
    )
  };
};
