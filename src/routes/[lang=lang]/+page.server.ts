import { getArticleSummaries, getTopics } from '$lib/content';
import { languages } from '$lib/i18n';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const articles = getArticleSummaries(params.lang);

  return {
    articles,
    featured: articles.find((article) => article.featured) ?? articles[0] ?? null,
    topics: getTopics(params.lang),
    canonicalUrl: new URL(`/${params.lang}`, url.origin).toString(),
    alternateUrls: Object.fromEntries(
      languages.map((lang) => [lang, new URL(`/${lang}`, url.origin).toString()])
    )
  };
};
