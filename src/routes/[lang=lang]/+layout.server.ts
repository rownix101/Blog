import { t } from '$lib/i18n';
import { getArticleSummaries } from '$lib/content';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ params }) => {
  return {
    lang: params.lang,
    copy: t(params.lang),
    latestArticles: getArticleSummaries(params.lang).slice(0, 6)
  };
};
