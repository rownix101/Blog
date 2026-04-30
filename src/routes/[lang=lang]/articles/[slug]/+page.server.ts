import { error } from '@sveltejs/kit';
import {
  getArticle,
  getArticleSummariesBySlug,
  getRelatedArticleSummaries
} from '$lib/content';
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

  return {
    article,
    shareUrl,
    canonicalUrl: shareUrl,
    alternateUrls,
    imageUrl,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      datePublished: article.date,
      dateModified: article.date,
      inLanguage: article.lang === 'zh' ? 'zh-CN' : 'en-US',
      mainEntityOfPage: shareUrl,
      image: imageUrl ? [imageUrl] : undefined,
      author: {
        '@type': 'Person',
        name: 'Rownix'
      },
      publisher: {
        '@type': 'Organization',
        name: "Rownix's Blog"
      }
    },
    related: getRelatedArticleSummaries(article)
  };
};
