import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) =>
  new Response(`User-agent: *\nAllow: /\nSitemap: ${url.origin}/sitemap.xml\n`, {
    headers: {
      'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'content-type': 'text/plain; charset=utf-8'
    }
  });
