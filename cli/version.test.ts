import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { CLI_VERSION } from './src/version.js';

describe('CLI version', () => {
  it('matches cli/package.json', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(path.join(here, 'package.json'), 'utf-8'));
    expect(CLI_VERSION).toBe(pkg.version);
  });

  it('matches root package.json (release versions move together)', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const rootPkg = JSON.parse(readFileSync(path.join(here, '..', 'package.json'), 'utf-8'));
    expect(CLI_VERSION).toBe(rootPkg.version);
  });
});
