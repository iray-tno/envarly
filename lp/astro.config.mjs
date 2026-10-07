// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { hozo } from '@hozo/vite';

export default defineConfig({
  site: 'https://iray-tno.github.io',
  base: '/envarly',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          ja: 'ja',
          'zh-cn': 'zh-CN',
          ru: 'ru',
          ko: 'ko',
          vi: 'vi',
        },
      },
    }),
  ],
  vite: {
    plugins: [hozo({ css: 'src/styles/global.css', preflight: false }), tailwindcss()],
  },
});
