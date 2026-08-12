import type { APIRoute } from "astro";
import {
  enCopy,
  GITHUB_URL,
  RELEASE_URL,
  REPORTS_URL,
  STORYBOOK_URL,
  VERSION,
  WINGET_COMMAND,
} from "../lib/lpContent";

// https://llmstxt.org/ — a curated summary for LLMs/AI agents, kept separate
// from robots.txt (crawl rules) and sitemap.xml (page list for search
// engines). Hand-authored English content; not localized like the LP itself,
// matching how CLI output and DESIGN.md also stay English-only in this repo.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const url = (path: string) => new URL(`${base}${path}`, site).toString();
  // STORYBOOK_URL/REPORTS_URL are already origin-relative ("/envarly/...").
  const absolute = (path: string) => new URL(path, site).toString();

  const body = `# Envarly

> ${enCopy.description}

Envarly is a free, open-source GUI (desktop app) for Windows 10/11 (Tauri v2 + React + Rust) that lets developers and power users view, edit, import, and export User and System environment variables — with PATH-entry validation, secret detection, change previews, encrypted snapshots, and a dry-run-by-default CLI mode. No telemetry in the app itself.

## Docs

- [Landing page](${url("")}): Overview, screenshots, download links. Also available in 日本語, 简体中文, Русский, 한국어, and Tiếng Việt.
- [GitHub repository](${GITHUB_URL}): Source, README, DESIGN.md architecture notes, issue tracker.
- [Latest release](${RELEASE_URL}): Windows installer (.exe), MSI, and portable .zip downloads. Current version: ${VERSION}.
- [Component Storybook](${absolute(STORYBOOK_URL)}): Interactive UI component explorer, not the app itself.
- [CI test reports](${absolute(REPORTS_URL)}): Automated test/lint report archive, not user-facing documentation.

## Optional

- Install via WinGet: \`${WINGET_COMMAND}\`
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
