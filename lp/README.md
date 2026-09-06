# Envarly Landing Page

This directory contains the multi-language landing page for [Envarly](https://github.com/iray-tno/envarly), built with [Astro](https://astro.build/) and deployed to [GitHub Pages](https://iray-tno.github.io/envarly/).

For general information about Envarly, architecture, and desktop app development, see the [main README](../README.md).

## Development

Run from the `lp` directory:

```sh
npm install      # install dependencies
npm run dev      # start dev server at http://localhost:4321
npm run build    # build static output to ./dist/
npm run preview  # preview production build locally
```

## Structure

- `src/pages/` — Page routes for each supported language (`/`, `/ja/`, `/zh-cn/`, `/ko/`, `/ru/`, `/vi/`)
- `src/lib/lpContent.ts` — Localized copy, translations, and metadata (version is synced automatically with `npm version` in the repository root)
- `src/components/` — UI components used across the landing page
