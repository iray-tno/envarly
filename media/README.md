# envarly-media

Regenerates `docs/screenshot-dark.png` and `lp/public/screenshot-*.png` from the **real, running app** instead of hand-captured screenshots — so they stay in sync as the UI changes, with no manual editing step.

## How it works

1. `npm run tauri build -- --debug` (from the repo root) builds `src-tauri/target/{release,debug}/envarly.exe` with the current UI baked in.
2. `capture.mjs` launches that binary with `--demo` (a fully client-side mocked API, backed by `src/demo/envarly-demo.json` — no registry writes) and `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`, then connects Playwright to the WebView2 content over CDP (`chromium.connectOverCDP`). This drives the actual rendered app — same Playwright API used throughout the project's Storybook verification, just attached to the real window instead of a browser tab.
3. It captures **content only** (no OS window chrome) for two states: the default dashboard (Path selected, a missing PATH entry flagged) and the Apply confirmation modal in Full diff view, into `raw/`.
4. `compose.mjs` stacks the static `titlebar.png` (a synthetic Windows titlebar — icon, "Envarly", min/max/close — built once via `build-titlebar.mjs`, not re-captured) on top of each raw screenshot, and writes the finished PNGs directly into `docs/` and `lp/public/`.

## Regenerating

```sh
# from the repo root, once (or whenever the UI changes):
npm run tauri build -- --debug

cd media
npm install          # first time only
npm run screenshots   # capture + compose in one step
```

Then `cd lp && npm run build` to confirm the OG-image generator (which embeds `screenshot-path-editor.png`) still succeeds, and eyeball the regenerated PNGs before committing.

If `titlebar.png` ever needs to change (e.g. the app icon changes), run `npm run build:titlebar` first.

## Why not Storybook

The reference screenshots include Windows' native titlebar, which isn't part of the React component tree — only the real running window has it. Demo mode exists specifically to make that safe and repeatable to capture (see its doc comment in `README.md` / `src/demo/createDemoApi.ts`).
