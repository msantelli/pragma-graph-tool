/**
 * Golden-file tests for @pragma-graph/core's export generators.
 *
 * The snapshots were anchored while the GUI still had its own copy of these
 * generators (pre-consolidation) and byte-parity between the two was proven,
 * so they encode the exact output the GUI has always produced. Any diff here
 * is an intentional format change (update snapshots) or a regression.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

import * as coreExport from '@pragma-graph/core';
import type { Diagram } from '@pragma-graph/core';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const fixtureFiles = readdirSync(fixturesDir).filter(f => f.endsWith('.json')).sort();

const loadFixture = (file: string): Diagram =>
  JSON.parse(readFileSync(path.join(fixturesDir, file), 'utf-8'));

// The JSON export stamps `exported: new Date().toISOString()`.
const normalizeExportedTimestamp = (json: string) =>
  json.replace(/"exported": "[^"]+"/, '"exported": "<normalized>"');

describe.each(fixtureFiles)('export parity for %s', (file) => {
  const diagram = loadFixture(file);

  it('TikZ code is identical', () => {
    const core = coreExport.generateTikZCode(diagram.nodes, diagram.edges, diagram.type);
    expect(core).toMatchSnapshot('tikz');
  });

  it('LaTeX document is identical', () => {
    expect(coreExport.generateLaTeXDocument(diagram)).toMatchSnapshot('latex');
  });

  it('SVG content is identical', () => {
    expect(coreExport.generateSVGContent(diagram)).toMatchSnapshot('svg');
  });

  it('JSON export is identical modulo timestamp', () => {
    expect(normalizeExportedTimestamp(coreExport.generateJSONExport(diagram))).toMatchSnapshot('json');
  });
});

describe('escapeLaTeXText behavior', () => {
  it('escapes plain-text specials', () => {
    expect(coreExport.escapeLaTeXText('A & B % C $ D # E')).toBe('A \\& B \\% C \\$ D \\# E');
  });
  it('classifies LaTeX content for passthrough', () => {
    expect(coreExport.isLaTeXContent('$x_1 \\to y^2$')).toBe(true);
    expect(coreExport.isLaTeXContent('plain text')).toBe(false);
  });
});
