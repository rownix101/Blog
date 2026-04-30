import { languages } from '$lib/i18n';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const currentUrl = new URL(`/${params.lang}/sponsor`, url.origin).toString();

  return {
    canonicalUrl: currentUrl,
    paid: url.searchParams.get('paid') === '1',
    alternateUrls: Object.fromEntries(
      languages.map((lang) => [lang, new URL(`/${lang}/sponsor`, url.origin).toString()])
    )
  };
};
