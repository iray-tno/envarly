// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';

export default defineConfig({
  site: 'https://iray-tno.github.io/envarly',
  base: '/envarly',
  integrations: [
    sitemap(),
    partytown({ config: { forward: ['dataLayer.push'] } }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
