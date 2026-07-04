import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Helper to reduce verbosity of satori's element object format
function el(
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
): object {
  return { type, props: { style, children } };
}

export const GET: APIRoute = async () => {
  // Fonts fetched at build time (Inter 800 for title, 400 for subtitle)
  const [boldRes, regularRes] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-800-normal.woff'),
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff'),
  ]);
  const [fontBold, fontRegular] = await Promise.all([
    boldRes.arrayBuffer(),
    regularRes.arrayBuffer(),
  ]);

  // Screenshot embedded as base64 — process.cwd() is lp/ during astro build
  const screenshotBuf = readFileSync(join(process.cwd(), 'public', 'screenshot-path-editor.png'));
  const screenshotSrc = `data:image/png;base64,${screenshotBuf.toString('base64')}`;

  const svg = await satori(
    el('div', {
      display: 'flex',
      width: '100%',
      height: '100%',
      backgroundImage: 'linear-gradient(140deg, #0d1f35 0%, #0a0f1a 100%)',
      overflow: 'hidden',
      fontFamily: 'Inter',
    }, [
      // ── Left: branding ──────────────────────────────────────────
      el('div', {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: '80px',
        paddingRight: '20px',
        width: '490px',
        flexShrink: 0,
      }, [
        // Logo icon
        el('div', {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '72px',
          height: '72px',
          borderRadius: '18px',
          backgroundColor: '#1a2d42',
          border: '1.5px solid rgba(255,255,255,0.12)',
          marginBottom: '32px',
          fontSize: '38px',
          fontWeight: 800,
          color: 'white',
        }, 'E'),

        // Title
        el('div', {
          fontSize: '76px',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.0,
          letterSpacing: '-3px',
          marginBottom: '18px',
        }, 'Envarly'),

        // Subtitle
        el('div', {
          fontSize: '24px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.48)',
          lineHeight: 1.45,
          marginBottom: '40px',
        }, 'Windows environment variable manager'),

        // Accent bar
        el('div', {
          width: '48px',
          height: '3px',
          backgroundColor: '#4fa3d1',
          borderRadius: '2px',
        }),
      ]),

      // ── Right: screenshot ────────────────────────────────────────
      // flex:1 gives the remaining ~710px; the 840px image overflows
      // naturally to the right, clipped by the root's overflow:hidden
      el('div', {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        paddingTop: '30px',
        overflow: 'visible',
      }, [
        {
          type: 'img',
          props: {
            src: screenshotSrc,
            style: {
              width: '840px',
              borderRadius: '12px',
              transform: 'rotate(-4deg) translateY(16px)',
              boxShadow: '-16px 24px 60px rgba(0,0,0,0.75)',
              flexShrink: 0,
            },
          },
        },
      ]),
    ]),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: fontBold,    weight: 800, style: 'normal' },
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      ],
    },
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
