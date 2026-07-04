import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  // BASE_URL is '/envarly/' — prepend it so the sitemap path is correct
  // even when site is set to the root origin without the base path.
  const sitemapUrl = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site);
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
