import type { RequestHandler } from './$types';

const stylesheet = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sitemap xhtml"
>
  <xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sitemap</title>
        <style>
          :root {
            color-scheme: light dark;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            background: Canvas;
            color: CanvasText;
          }

          body {
            margin: 0;
            padding: 32px;
          }

          main {
            max-width: 1120px;
            margin: 0 auto;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 2rem;
            line-height: 1.1;
          }

          p {
            margin: 0 0 24px;
            color: color-mix(in srgb, CanvasText 70%, transparent);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.94rem;
          }

          th,
          td {
            border-bottom: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
            padding: 10px 12px;
            text-align: left;
            vertical-align: top;
          }

          th {
            font-size: 0.78rem;
            letter-spacing: 0;
            text-transform: uppercase;
          }

          a {
            color: LinkText;
            overflow-wrap: anywhere;
          }

          .muted {
            color: color-mix(in srgb, CanvasText 62%, transparent);
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Sitemap</h1>
          <p>
            <xsl:value-of select="count(sitemap:urlset/sitemap:url)" />
            indexed URLs
          </p>
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Frequency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a>
                      <xsl:attribute name="href">
                        <xsl:value-of select="sitemap:loc" />
                      </xsl:attribute>
                      <xsl:value-of select="sitemap:loc" />
                    </a>
                  </td>
                  <td class="muted"><xsl:value-of select="sitemap:lastmod" /></td>
                  <td class="muted"><xsl:value-of select="sitemap:changefreq" /></td>
                  <td class="muted"><xsl:value-of select="sitemap:priority" /></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;

export const GET: RequestHandler = () =>
  new Response(stylesheet, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': 'text/xsl; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  });
