import { getArticleSummaries, getTopics } from '$lib/content';
import { languages, t } from '$lib/i18n';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const articles = getArticleSummaries(params.lang);
  const copy = t(params.lang);
  const canonicalUrl = new URL(`/${params.lang}`, url.origin).toString();

  return {
    articles,
    featured: articles.find((article) => article.featured) ?? articles[0] ?? null,
    topics: getTopics(params.lang),
    canonicalUrl,
    alternateUrls: Object.fromEntries(
      languages.map((lang) => [lang, new URL(`/${lang}`, url.origin).toString()])
    ),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: copy.siteTitle,
      description: copy.siteDescription,
      url: canonicalUrl,
      inLanguage: params.lang === 'zh' ? 'zh-CN' : 'en-US',
      author: {
        '@type': 'Person',
        name: 'Rownix'
      }
    }
  };
};
