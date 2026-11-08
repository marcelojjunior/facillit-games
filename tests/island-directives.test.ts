import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * The hydration rule (FR-028, research D14 of spec 003; deferred from spec
 * 002, research D7).
 *
 * The app has one island and it holds match state, so every island must be
 * `client:only="react"`: any directive that renders at build time produces a
 * hydration mismatch and an empty-screen flash on every open (Principle IV).
 * If a stateless island is ever needed, give this rule an allow-list with a
 * reason instead of weakening it.
 */

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const FORBIDDEN = /\b(client:(load|idle|visible|media)|server:defer)\b/;
const CLIENT_ONLY = /\bclient:only(?:=(?:"([^"]*)"|'([^']*)'|\{[^}]*\}))?/g;

function directiveViolations(source: string): string[] {
  // Comments may explain the rule; only markup counts. Blank them keeping line numbers.
  const markup = source.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '));
  return markup.split('\n').flatMap((line, index) => {
    const found: string[] = [];
    if (FORBIDDEN.test(line)) {
      found.push(`line ${index + 1}: ${line.trim()}`);
    }
    for (const match of line.matchAll(CLIENT_ONLY)) {
      if ((match[1] ?? match[2]) !== 'react') {
        found.push(`line ${index + 1}: client:only must be "react": ${line.trim()}`);
      }
    }
    return found;
  });
}

describe('island directives (FR-028)', () => {
  const astroFiles = walk(join(repoRoot, 'src')).filter((path) => path.endsWith('.astro'));

  it('recognises every forbidden form', () => {
    expect(directiveViolations('<A client:load />')).toHaveLength(1);
    expect(directiveViolations('<A client:visible />')).toHaveLength(1);
    expect(directiveViolations('<A server:defer />')).toHaveLength(1);
    expect(directiveViolations('<A client:only />')).toHaveLength(1);
    expect(directiveViolations('<A client:only="preact" />')).toHaveLength(1);
    expect(directiveViolations('<A client:only="react" />')).toEqual([]);
    expect(directiveViolations('<!-- not client:load -->')).toEqual([]);
  });

  it('scans at least one .astro file', () => {
    expect(astroFiles.length).toBeGreaterThan(0);
  });

  it('no .astro file under src/ uses a directive other than client:only="react"', () => {
    const found = astroFiles.flatMap((file) =>
      directiveViolations(readFileSync(file, 'utf8')).map(
        (violation) => `${relative(repoRoot, file)} ${violation}`,
      ),
    );
    expect(found).toEqual([]);
  });
});
