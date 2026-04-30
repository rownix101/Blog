import { getArticleSummaries } from '$lib/content';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) =>
  Response.json(getArticleSummaries(params.lang), {
    headers: {
      'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      'x-content-type-options': 'nosniff'
    }
  });
