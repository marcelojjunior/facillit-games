import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { errorCopy, headings } from '../src/shell/ui/copy';

/**
 * The Principle IV guard, now pointed at the real match island (FR-026,
 * research D4 of spec 003).
 *
 * Phase 2 proved the mechanism with a probe component; this file kept the
 * guard alive and now watches `MatchApp`. If someone swaps `client:only` for
 * `client:load` in src/pages/index.astro -- the most likely mistake, because
 * `client:load` is the default in every tutorial -- the build keeps passing
 * and the defect shows up as an empty-screen flash on a phone, far from
 * whoever wrote the line. Here it fails in CI instead.
 *
 * What the built page must contain: the neutral loading frame (the island's
 * fallback slot, FR-030). What it must not: the app root or any screen copy,
 * which exist only once the island runs in the browser.
 */

const APP_MARKER = 'data-testid="match-app"';
const FALLBACK_MARKER = 'data-testid="loading-frame"';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function inlineScripts(html: string): string[] {
  return [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    (match) => match[1] ?? '',
  );
}
const indexHtmlPath = `${repoRoot}dist/index.html`;
const pocFiles = ['index.html', 'script.js', 'style.css'] as const;

describe('static artifact', () => {
  beforeAll(() => {
    if (!existsSync(indexHtmlPath)) {
      // Fail with instructions instead of passing empty. A test that passes
      // without an artifact is worse than no test: it gives false confidence.
      throw new Error(
        `dist/index.html does not exist. Run \`pnpm build\` before \`pnpm test\`.\n` +
          `This test reads the built HTML and cannot verify anything without it.`,
      );
    }
  });

  it('does not render the client:only island at build time', () => {
    const html = readFileSync(indexHtmlPath, 'utf8');

    expect(
      html.includes(APP_MARKER),
      `dist/index.html contains "${APP_MARKER}", meaning the island RENDERED at build time.\n` +
        `This means the directive in src/pages/index.astro is no longer\n` +
        `client:only. With client:load, every component that reads match state\n` +
        `produces a hydration mismatch and an empty-screen flash on every app open --\n` +
        `which is the normal use (phone on the table, tab discarded by the browser).\n` +
        `Constitution Principle IV. Set the directive back to client:only.`,
    ).toBe(false);
  });

  it('shows the neutral loading frame until the island runs (FR-030)', () => {
    const html = readFileSync(indexHtmlPath, 'utf8');

    expect(html).toContain(FALLBACK_MARKER);
    expect(html).toContain('lang="pt-BR"');
  });

  it('contains no screen copy, which only the island renders', () => {
    const html = readFileSync(indexHtmlPath, 'utf8');
    const copy = [...Object.values(errorCopy), ...Object.values(headings)];

    expect(copy.filter((text) => html.includes(text))).toEqual([]);
  });

  it('ships the island code to the browser instead of simply omitting it', () => {
    // Without this assertion the test above would also pass if the island had
    // been deleted by accident -- which would be "absent from the HTML" for
    // the wrong reason. Together they say: not rendered at build time, BUT it
    // reaches the client.
    const html = readFileSync(indexHtmlPath, 'utf8');

    expect(html).toMatch(/<astro-island\b/);
  });

  it('contains no server runtime', () => {
    // Principle I: the artifact must be publishable on a CDN. Any of these
    // files would mean an adapter got into astro.config.mjs.
    for (const serverArtifact of ['_worker.js', 'entry.mjs']) {
      expect(existsSync(`${repoRoot}dist/${serverArtifact}`)).toBe(false);
    }
  });

  it('reads storage only in the theme boot script, never the match', () => {
    // The phase's negative scope, made verifiable: the built HTML holds no
    // match state. The one inline script allowed to touch storage is the
    // theme boot script (FR-020), and it reads only the theme key.
    const html = readFileSync(indexHtmlPath, 'utf8');
    const scripts = inlineScripts(html);
    const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');

    expect(withoutScripts).not.toMatch(/localStorage|schemaVersion|GameDefinition/i);
    expect(scripts.some((script) => script.includes('facillit-games:theme'))).toBe(true);
    expect(html).not.toContain('facillit-games:state');
  });

  it('the built theme script applies a stored choice before paint', () => {
    const boot = inlineScripts(readFileSync(indexHtmlPath, 'utf8')).find((script) =>
      script.includes('facillit-games:theme'),
    );
    const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
    const storage = { getItem: () => '{"schemaVersion":1,"theme":"dark"}' };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- running the built source is the test
    const script = new Function('localStorage', 'matchMedia', 'document', boot ?? '') as (
      ...globals: unknown[]
    ) => void;
    script(storage, () => ({ matches: false }), { documentElement: root });
    expect(root.dataset.theme).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
  });
});

function distFiles(pattern: RegExp): string[] {
  const distDir = `${repoRoot}dist`;
  return readdirSync(distDir, { recursive: true, encoding: 'utf8' })
    .map((entry) => join(distDir, entry))
    .filter((path) => pattern.test(path));
}

describe('game-style assets (spec 004 research D1, D4, D8, D11)', () => {
  const KB = 1024;

  it('serves the font from the app itself, within 80 kB (FR-007, SC-005)', () => {
    const fonts = distFiles(/\.woff2$/);
    expect(fonts.length).toBeGreaterThan(0);
    const total = fonts.reduce((sum, path) => sum + statSync(path).size, 0);
    expect(total).toBeLessThanOrEqual(80 * KB);
  });

  it('preloads the font', () => {
    const html = readFileSync(indexHtmlPath, 'utf8');
    expect(html).toMatch(
      /<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="font")(?=[^>]*\btype="font\/woff2")(?=[^>]*\bcrossorigin)(?=[^>]*\bhref="[^"]+\.woff2")[^>]*>/,
    );
  });

  it('references no other host in HTML or CSS (Principle I, SC-004)', () => {
    const external = distFiles(/\.(html|css)$/).flatMap((path) =>
      // Comments (e.g. Tailwind's license banner) cite URLs but fetch nothing.
      [
        ...readFileSync(path, 'utf8')
          .replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, '')
          .matchAll(/https?:\/\/[^\s"')>]+/g),
      ]
        .map((match) => match[0])
        .filter((url) => url !== 'http://www.w3.org/2000/svg')
        .map((url) => `${path.slice(repoRoot.length)}: ${url}`),
    );
    expect(external).toEqual([]);
  });

  it('keeps the island script within 80 kB gzipped (SC-005)', () => {
    const scripts = distFiles(/_astro[\\/][^\\/]+\.js$/);
    expect(scripts.length).toBeGreaterThan(0);
    const gzipped = scripts.reduce(
      (sum, path) => sum + gzipSync(readFileSync(path), { level: 9 }).length,
      0,
    );
    expect(gzipped).toBeLessThanOrEqual(80 * KB);
  });

  it('ships MECHE-MECHE, the first real game (spec 005 FR-017, SC-005)', () => {
    const shipped = distFiles(/\.(html|js)$/).some((path) =>
      readFileSync(path, 'utf8').includes('MECHE-MECHE'),
    );
    expect(shipped).toBe(true);
  });

  it('draws the scene in the static page, before the island, so it shows from the first frame', () => {
    // If the scene ever moved into the island it would paint late, after the
    // loading frame (spec 004 FR-017, research D4).
    const html = readFileSync(indexHtmlPath, 'utf8');
    const scene = html.indexOf('data-testid="scene"');
    expect(scene).toBeGreaterThan(-1);
    expect(scene).toBeLessThan(html.indexOf(FALLBACK_MARKER));
  });
});

describe('no test game in the artifact (SC-006, FR-025)', () => {
  // The fixture games of spec 002 live in tests/ and must never be bundled.
  // Checks every emitted file, not just index.html.
  const fixtureMarkers = ['highest-wins', 'lowest-wins', 'Maior Vence', 'Menor Vence'];

  it('no file under dist/ mentions a fixture game', () => {
    const distDir = `${repoRoot}dist`;
    const files = readdirSync(distDir, { recursive: true, encoding: 'utf8' })
      .map((entry) => join(distDir, entry))
      .filter((path) => /\.(html|js|mjs|css|json|txt)$/.test(path));

    expect(files.length).toBeGreaterThan(0);
    const leaks = files.filter((path) => {
      const content = readFileSync(path, 'utf8');
      return fixtureMarkers.some((marker) => content.includes(marker));
    });
    expect(leaks).toEqual([]);
  });
});

describe('frozen POC', () => {
  // The POC stays published and live until the Phase 6 cutover. The main
  // defense is the exclusions in .prettierignore, eslint.config.js, and
  // tsconfig.json -- but those fail silently if someone removes them. This one
  // fails loudly.
  it.each(pocFiles)('%s still exists at the repo root', (file) => {
    expect(existsSync(`${repoRoot}${file}`)).toBe(true);
  });

  it('is not overwritten by the build artifact', () => {
    // dist/index.html is the new application; index.html at the root is the
    // POC. If the output directory were the root, the build would wipe the
    // published POC (FR-017).
    const pocHtml = readFileSync(`${repoRoot}index.html`, 'utf8');

    expect(pocHtml).not.toMatch(/<astro-island\b/);
  });
});
