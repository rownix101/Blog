import { languages } from '$lib/i18n';
import { serializeJsonLd } from '$lib/json-ld';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const canonicalUrl = new URL(`/${params.lang}/about`, url.origin).toString();
  const locale = params.lang === 'zh' ? 'zh-CN' : 'en-US';

  return {
    canonicalUrl,
    alternateUrls: Object.fromEntries(
      languages.map((lang) => [lang, new URL(`/${lang}/about`, url.origin).toString()])
    ),
    jsonLd: serializeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': `${canonicalUrl}#about`,
      url: canonicalUrl,
      name: params.lang === 'zh' ? '关于这个博客' : 'About this blog',
      description:
        params.lang === 'zh'
          ? '这里记录我对技术、产业、市场和风险的长期观察。'
          : 'Long-form notes on technology, industry, markets, and risk.',
      inLanguage: locale,
      isPartOf: {
        '@type': 'WebSite',
        name: "Rownix's Blog",
        url: new URL(`/${params.lang}`, url.origin).toString()
      },
      author: {
        '@type': 'Person',
        name: 'Rownix'
      }
    })
  };
};
