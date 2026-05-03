import { getArticleSummaries, getTopics } from '$lib/content';
import { languages, t } from '$lib/i18n';
import { serializeJsonLd } from '$lib/json-ld';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const articles = getArticleSummaries(params.lang);
  const copy = t(params.lang);
  const canonicalUrl = new URL(`/${params.lang}`, url.origin).toString();
  const featured = articles.find((article) => article.featured) ?? articles[0] ?? null;
  const featuredImageUrl = featured?.coverImage
    ? new URL(featured.coverImage, url.origin).toString()
    : undefined;

  return {
    articles,
    featured,
    featuredImageUrl,
    topics: getTopics(params.lang),
    canonicalUrl,
    alternateUrls: Object.fromEntries(
      languages.map((lang) => [lang, new URL(`/${lang}`, url.origin).toString()])
    ),
    jsonLd: serializeJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${canonicalUrl}#website`,
          name: copy.siteTitle,
          description: copy.siteDescription,
          url: new URL('/', url.origin).toString(),
          inLanguage: params.lang === 'zh' ? 'zh-CN' : 'en-US',
          publisher: {
            '@id': `${canonicalUrl}#publisher`
          }
        },
        {
          '@type': 'Organization',
          '@id': `${canonicalUrl}#publisher`,
          name: "Rownix's Blog",
          url: new URL('/', url.origin).toString(),
          logo: {
            '@type': 'ImageObject',
            url: new URL('/favicon.svg', url.origin).toString()
          }
        },
        {
          '@type': 'Blog',
          '@id': `${canonicalUrl}#blog`,
          name: copy.siteTitle,
          description: copy.siteDescription,
          url: canonicalUrl,
          inLanguage: params.lang === 'zh' ? 'zh-CN' : 'en-US',
          author: {
            '@type': 'Person',
            name: 'Rownix'
          },
          blogPost: articles.slice(0, 12).map((article) => ({
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.description,
            url: new URL(`/${article.lang}/articles/${article.slug}`, url.origin).toString(),
            datePublished: article.date,
            dateModified: article.updated ?? article.date,
            image: article.coverImage
              ? new URL(article.coverImage, url.origin).toString()
              : undefined
          }))
        },
        {
          '@type': 'ItemList',
          '@id': `${canonicalUrl}#latest-posts`,
          itemListElement: articles.slice(0, 12).map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: new URL(`/${article.lang}/articles/${article.slug}`, url.origin).toString(),
            name: article.title
          }))
        }
      ]
    })
  };
};
