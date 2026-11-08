/**
 * Renders the share images into public/ with the project's Chromium
 * (playwright, already a dev dependency):
 *
 *   public/og.png                1200×630  link previews (Open Graph, X)
 *   public/apple-touch-icon.png   180×180  home-screen icon on iOS
 *
 * The die comes from src/components/MascotSprite.astro (one source for the
 * mascot) and the title uses the self-hosted Baloo 2. Run it again after
 * changing the mascot, the palette, or the copy below:
 *
 *   node scripts/render-share-images.mjs
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));

// Token values (src/styles/tokens.ts) used by the mascot and the scene.
const COLORS = {
  'fill-face': '#23264f',
  'stroke-face': '#23264f',
  'fill-blue-edge': '#155ab0',
  'fill-die': '#ffffff',
  'fill-die-edge': '#d9e1ec',
  'stroke-die-edge': '#d9e1ec',
  'fill-pip': '#e0393f',
  'fill-red': '#e0393f',
  'fill-red-hi': '#ff8a7a',
};

/** The die symbol of the sprite, with token classes turned into colors. */
function dieSvg(size) {
  const sprite = readFileSync(join(root, 'src/components/MascotSprite.astro'), 'utf8');
  const body = sprite.match(/<symbol id="mascot-die"[^>]*>([\s\S]*?)<\/symbol>/)?.[1];
  if (body === undefined) {
    throw new Error('mascot-die symbol not found in MascotSprite.astro');
  }
  const colored = body.replace(/class="([^"]*)"/g, (_, classes) =>
    classes
      .split(/\s+/)
      .map((name) => {
        if (name === 'fill-none') return 'fill="none"';
        if (name.startsWith('opacity-')) return `opacity="${Number(name.slice(8)) / 100}"`;
        const color = COLORS[name];
        if (color === undefined) throw new Error(`no color for class ${name}`);
        return `${name.startsWith('stroke') ? 'stroke' : 'fill'}="${color}"`;
      })
      .join(' '),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 150" width="${size}" height="${Math.round((size * 150) / 140)}">${colored}</svg>`;
}

// One badge per shipped game, in the game list's badge colors (tokens.ts).
const GAMES = [
  ['MECHE-MECHE', '#ff9d2e', '#c8650f', '#3d2304'],
  ['LEVA', '#7e44d8', '#55279e', '#ffffff'],
];

const fontUrl = pathToFileURL(join(root, 'src/assets/fonts/baloo-2-latin-wght-normal.woff2')).href;

const page = (width, height, body) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Baloo 2'; font-weight: 400 800; src: url('${fontUrl}') format('woff2'); }
* { margin: 0; box-sizing: border-box; }
body { width: ${width}px; height: ${height}px; overflow: hidden; font-family: 'Baloo 2', sans-serif;
  background: linear-gradient(180deg, #6fd3f2, #c8f5e4); position: relative; }
.hills { position: absolute; left: 0; right: 0; bottom: 0; }
</style></head><body>${body}</body></html>`;

/** The scene's hills; clouds only where no text sits over them. */
const hills = (width, height, clouds = true) => `
<svg class="hills" viewBox="0 0 360 190" width="${width}" height="${height}" preserveAspectRatio="none">
  ${
    clouds
      ? `<ellipse cx="70" cy="44" rx="38" ry="13" fill="#ffffff" opacity=".85"/>
  <ellipse cx="96" cy="36" rx="26" ry="13" fill="#ffffff" opacity=".85"/>
  <ellipse cx="292" cy="28" rx="30" ry="10" fill="#ffffff" opacity=".85"/>`
      : ''
  }
  <path d="M0 120 Q90 70 190 110 T360 96 V190 H0 Z" fill="#7ccf5a"/>
  <path d="M0 150 Q120 105 230 140 T360 130 V190 H0 Z" fill="#4cb847"/>
</svg>`;

const og = page(
  1200,
  630,
  `${hills(1200, 300, false)}
  <div style="position:absolute; inset:0; display:flex; align-items:center; gap:56px; padding:0 90px;">
    <div style="flex:none; filter: drop-shadow(0 10px 0 rgba(35,38,79,.15));">${dieSvg(330)}</div>
    <div style="display:flex; flex-direction:column; gap:18px;">
      <div style="font-size:112px; font-weight:800; line-height:1; color:#fff; letter-spacing:.01em;
        text-shadow: 0 6px 0 #155ab0, 5px 0 0 #155ab0, -5px 0 0 #155ab0, 0 -5px 0 #155ab0,
          5px 5px 0 #155ab0, -5px 5px 0 #155ab0, 0 10px 0 #155ab0;">Facillit Games</div>
      <div style="font-size:46px; font-weight:800; line-height:1.15; color:#23264f;">
        O placar dos jogos de mesa,<br>direto no celular.</div>
      <div style="display:flex; gap:20px; margin-top:8px;">${GAMES.map(
        ([name, color, edge, ink]) => `<div style="font-size:36px; font-weight:800; color:${ink};
        background:${color}; padding:6px 26px; border-radius:22px; box-shadow:0 8px 0 ${edge};">${name}</div>`,
      ).join('')}</div>
    </div>
  </div>`,
);

const appleIcon = page(
  180,
  180,
  `${hills(180, 70)}
  <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
    ${dieSvg(128)}
  </div>`,
);

const dir = mkdtempSync(join(tmpdir(), 'share-images-'));
const browser = await chromium.launch();
try {
  for (const [name, html, width, height] of [
    ['og.png', og, 1200, 630],
    ['apple-touch-icon.png', appleIcon, 180, 180],
  ]) {
    const file = join(dir, `${name}.html`);
    writeFileSync(file, html);
    const tab = await browser.newPage({ viewport: { width, height } });
    await tab.goto(pathToFileURL(file).href);
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: join(root, 'public', name) });
    await tab.close();
  }
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}
console.log('Wrote public/og.png and public/apple-touch-icon.png');
