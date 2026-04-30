import { getAllArticles } from '$lib/content';
import { languages, type Lang } from '$lib/i18n';
import type { RequestHandler } from './$types';

type SitemapUrl = {
  path: string;
  lastmod?: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
  alternates?: Record<Lang, string>;
};

const xmlEscape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const absoluteUrl = (origin: string, path: string) => `${origin}${path}`;

export const GET: RequestHandler = ({ url }) => {
  const origin = url.origin;
  const articles = getAllArticles();

  const pages: SitemapUrl[] = [
    ...languages.map((lang) => ({
      path: `/${lang}`,
      changefreq: 'weekly' as const,
      priority: lang === 'zh' ? '1.0' : '0.9',
      alternates: Object.fromEntries(languages.map((item) => [item, `/${item}`])) as Record<
        Lang,
        string
      >
    })),
    ...articles.map((article) => ({
      path: `/${article.lang}/articles/${article.slug}`,
      lastmod: article.date,
      changefreq: 'monthly' as const,
      priority: article.featured ? '0.8' : '0.7',
      alternates: Object.fromEntries(
        languages
          .filter((lang) =>
            articles.some((item) => item.lang === lang && item.slug === article.slug)
          )
          .map((lang) => [lang, `/${lang}/articles/${article.slug}`])
      ) as Record<Lang, string>
    }))
  ];

  const rootUrl: SitemapUrl = {
    path: '/',
    lastmod: articles[0]?.date,
    changefreq: 'weekly',
    priority: '0.8',
    alternates: Object.fromEntries(languages.map((lang) => [lang, `/${lang}`])) as Record<
      Lang,
      string
    >
  };

  const urls = [rootUrl, ...pages]
    .map((page) => {
      const alternateLinks = page.alternates
        ? Object.entries(page.alternates)
            .map(
              ([lang, path]) =>
                `    <xhtml:link rel="alternate" hreflang="${xmlEscape(lang)}" href="${xmlEscape(
                  absoluteUrl(origin, path)
                )}" />`
            )
            .join('\n')
        : '';

      return [
        '  <url>',
        `    <loc>${xmlEscape(absoluteUrl(origin, page.path))}</loc>`,
        page.lastmod ? `    <lastmod>${xmlEscape(page.lastmod)}</lastmod>` : '',
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        alternateLinks,
        '  </url>'
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
    {
      headers: {
        'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'content-type': 'application/xml; charset=utf-8',
        'x-content-type-options': 'nosniff'
      }
    }
  );
};
