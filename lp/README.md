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

Run `npm run check:lp` from the repository root to type-check all LP TypeScript.
CI runs this before building the LP; Astro's build alone only transpiles it.

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

The header, hero introduction, footer, features, audience, FAQ, and stack use Hozo 0.3.0
primitives through `@hozo/vite` and Astro's React integration. Astro renders
them as static HTML: do not add a `client:*` directive unless browser-side
interaction is required. The hero's install control and carousel remain in Astro, together with
the copy-button, language-switching, and analytics listeners.
The header uses `NativeSelect` from `@hozo/form`, with `defaultValue` rendering
the current language without hydration. The Astro listener owns navigation;
option paths and tracked link IDs must stay stable.

The FAQ renders seven question/answer pairs as headings and paragraphs, without
hydration or collapsed content. Its six-language copy lives in `lpContent.ts`;
`LandingPage.astro` generates `FAQPage` JSON-LD from the same answers. Browser tests
check that structured data matches the visible copy, including with JavaScript
disabled. The CLI entry includes read-only examples and links to the main README.

After building the LP, run `npm run test:lp` from the repository root to check
all six language pages and responsive content layouts in Chromium. The root dependencies and Playwright's
Chromium browser must be installed (`npx playwright install chromium`).

The hero repeats `sm:leading-relaxed` to retain its original line height while
[Hozo #939](https://github.com/iray-tno/hozo/issues/939) is open; browser tests
check the computed typography. The native install button remains until a
supported static host-ID/data-attribute API is available
([Hozo #938](https://github.com/iray-tno/hozo/issues/938)).

Hozo reads `src/styles/global.css` for the existing Tailwind tokens. Its preflight
is disabled because Tailwind already provides the page reset. Generated
`*.hozo.css` files are build artifacts and are not committed.
