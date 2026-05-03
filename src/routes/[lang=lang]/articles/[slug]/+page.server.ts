import { error } from '@sveltejs/kit';
import {
  getArticle,
  getArticleSummariesBySlug,
  getRelatedArticleSummaries
} from '$lib/content';
import { serializeJsonLd } from '$lib/json-ld';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const article = getArticle(params.lang, params.slug);

  if (!article) {
    throw error(404, 'Article not found');
  }

  const shareUrl = new URL(url.pathname, url.origin).toString();
  const translations = getArticleSummariesBySlug(article.slug);
  const alternateUrls = Object.fromEntries(
    translations.map((item) => [
      item.lang,
      new URL(`/${item.lang}/articles/${item.slug}`, url.origin).toString()
    ])
  );
  const imageUrl = article.coverImage ? new URL(article.coverImage, url.origin).toString() : undefined;
  const preloadImage = article.coverImageAvif ?? article.coverImage;

  return {
    article,
    shareUrl,
    canonicalUrl: shareUrl,
    alternateUrls,
    imageUrl,
    preloadImage,
    jsonLd: serializeJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': `${shareUrl}#article`,
          headline: article.title,
          description: article.description,
          url: shareUrl,
          datePublished: article.date,
          dateModified: article.updated ?? article.date,
          inLanguage: article.lang === 'zh' ? 'zh-CN' : 'en-US',
          mainEntityOfPage: shareUrl,
          image: imageUrl ? [imageUrl] : undefined,
          timeRequired: `PT${article.minutes}M`,
          articleSection: article.topic,
          author: {
            '@type': 'Person',
            name: 'Rownix'
          },
          publisher: {
            '@type': 'Organization',
            name: "Rownix's Blog",
            logo: {
              '@type': 'ImageObject',
              url: new URL('/favicon.svg', url.origin).toString()
            }
          },
          isPartOf: {
            '@type': 'Blog',
            name: "Rownix's Blog",
            url: new URL(`/${article.lang}`, url.origin).toString()
          }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${shareUrl}#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: article.lang === 'zh' ? '首页' : 'Home',
              item: new URL(`/${article.lang}`, url.origin).toString()
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: article.title,
              item: shareUrl
            }
          ]
        }
      ]
    }),
    related: getRelatedArticleSummaries(article)
  };
};
