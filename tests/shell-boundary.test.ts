import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { Game } from '../src/shell/game/contract';

/**
 * The Principle II guard (FR-010, SC-005, research D7).
 *
 * The shell — every source file under src/ outside src/games/ — must never
 * name a game: no import from a game folder, no comparison or switch on a game
 * id. Only src/games/registry may be imported. A failing line here means the
 * shell started to know a game, which is exactly what makes "adding a game
 * changes nothing else" (SC-001) stop being true.
 */

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(repoRoot, 'src');
const gamesDir = join(srcDir, 'games');
const registryPath = join(gamesDir, 'registry');
const SOURCE_EXTENSIONS = /\.(ts|tsx|astro|js|mjs)$/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const shellFiles = walk(srcDir).filter(
  (path) => SOURCE_EXTENSIONS.test(path) && !path.startsWith(gamesDir + sep),
);

// `from '...'`, `import '...'`, `import('...')`, `export ... from '...'`
const IMPORT_SPECIFIER = /(?:from\s+|import\s*\(?\s*)['"]([^'"]+)['"]/g;

const ID_COMPARISONS = [
  /\bgameId\s*[!=]==/,
  /[!=]==\s*gameId\b/,
  /\.gameId\s*[!=]==/,
  /[!=]==\s*[\w.]*\.gameId\b/,
  /\bgame\.id\s*[!=]==/,
  /[!=]==\s*game\.id\b/,
  /switch\s*\(\s*[\w.]*gameId\s*\)/,
  /switch\s*\(\s*game\.id\s*\)/,
];

function stripExtension(path: string): string {
  return path.replace(/\.(ts|tsx|js|mjs)$/, '').replace(/[\\/]index$/, '');
}

function importsAGame(file: string, specifier: string): boolean {
  if (specifier.startsWith('.')) {
    const target = stripExtension(resolve(dirname(file), specifier));
    return target.startsWith(gamesDir + sep) && target !== registryPath;
  }
  // Non-relative specifiers: any alias that reaches a games folder.
  return /(^|\/)games\/(?!registry(\.ts)?$)/.test(specifier);
}

function violations(file: string): string[] {
  const lines = readFileSync(file, 'utf8').split('\n');
  const where = (index: number) => `${relative(repoRoot, file)}:${index + 1}`;

  return lines.flatMap((line, index) => {
    const found: string[] = [];
    for (const match of line.matchAll(IMPORT_SPECIFIER)) {
      const specifier = match[1];
      if (specifier !== undefined && importsAGame(file, specifier)) {
        found.push(`${where(index)} imports a game folder: ${line.trim()}`);
      }
    }
    if (ID_COMPARISONS.some((pattern) => pattern.test(line))) {
      found.push(`${where(index)} branches on a game id: ${line.trim()}`);
    }
    return found;
  });
}

describe('shell/game boundary', () => {
  it('scans at least one shell file, so it cannot pass vacuously', () => {
    expect(shellFiles.length).toBeGreaterThan(0);
    expect(shellFiles.some((path) => path.includes(`${sep}shell${sep}`))).toBe(true);
  });

  it('no shell file imports a game folder or branches on a game id', () => {
    const found = shellFiles.flatMap(violations);

    expect(
      found,
      `The shell must never name a game (constitution Principle II).\n` +
        `Import games only through src/games/registry, and never compare or switch on a game id.\n` +
        found.join('\n'),
    ).toEqual([]);
  });
});

describe('game id equals folder name (FR-001)', () => {
  const gameFolders = [gamesDir, join(repoRoot, 'tests', 'fixtures', 'games')].flatMap((root) =>
    readdirSync(root)
      .map((entry) => join(root, entry))
      .filter((path) => statSync(path).isDirectory() && existsSync(join(path, 'index.ts'))),
  );

  it('finds the fixture games', () => {
    expect(gameFolders.length).toBeGreaterThanOrEqual(2);
  });

  it.each(gameFolders)('%s declares its folder name as id', async (folder) => {
    const module = (await import(join(folder, 'index.ts'))) as { default?: Game };

    expect(module.default?.id).toBe(folder.split(sep).at(-1));
  });
});
