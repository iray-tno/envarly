import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site);
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
