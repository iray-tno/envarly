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

## Dependency Overrides

Satori pins `fflate` to 0.7.3, which is affected by GHSA-px8p-9vwx-vf98.
The scoped override selects the patched 0.7.5 release without changing Satori's
API. Remove it when Satori adopts a patched dependency. Verify OG image
generation with `npm run build` when updating this override.

## Structure

- `src/pages/` — Page routes for each supported language (`/`, `/ja/`, `/zh-cn/`, `/ko/`, `/ru/`, `/vi/`)
- `src/lib/lpContent.ts` — Localized copy, translations, and metadata (version is synced automatically with `npm version` in the repository root)
- `src/components/` — UI components used across the landing page

## Hozo Pilot

`LandingHeader.tsx` and `LandingFooter.tsx` use Hozo 0.3.0 primitives through
`@hozo/vite` and Astro's React integration. Astro renders them as static HTML:
do not add a `client:*` directive unless browser-side interaction is required. The rest of the page
remains in Astro, including the language-switching and analytics listeners.
The header's native select uses `defaultValue` to render the current language
without hydration; option paths and tracked link IDs must stay stable.

After building the LP, run `npm run test:lp` from the repository root to check
all six language pages in Chromium. The root dependencies and Playwright's
Chromium browser must be installed (`npx playwright install chromium`).

Hozo reads `src/styles/global.css` for the existing Tailwind tokens. Its preflight
is disabled because Tailwind already provides the page reset. Generated
`*.hozo.css` files are build artifacts and are not committed.
