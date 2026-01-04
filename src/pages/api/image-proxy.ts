import type { APIRoute } from 'astro'

export const prerender = false

const CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export const GET: APIRoute = async ({ request }) => {
  const requestUrl = new URL(request.url)
  const target = requestUrl.searchParams.get('url')

  if (!target) {
    return new Response('Missing url parameter', { status: 400 })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(target)
  } catch {
    return new Response('Invalid url parameter', { status: 400 })
  }

  if (!ALLOWED_PROTOCOLS.has(targetUrl.protocol)) {
    return new Response('Unsupported url protocol', { status: 400 })
  }

  const upstream = await fetch(targetUrl.toString(), {
    redirect: 'follow',
  })

  if (!upstream.ok) {
    return new Response('Upstream error', { status: upstream.status })
  }

  const headers = new Headers()
  const contentType = upstream.headers.get('content-type')
  const contentLength = upstream.headers.get('content-length')
  const etag = upstream.headers.get('etag')
  const lastModified = upstream.headers.get('last-modified')

  if (contentType) headers.set('content-type', contentType)
  if (contentLength) headers.set('content-length', contentLength)
  if (etag) headers.set('etag', etag)
  if (lastModified) headers.set('last-modified', lastModified)
  headers.set('cache-control', CACHE_CONTROL)

  return new Response(upstream.body, {
    status: 200,
    headers,
  })
}
