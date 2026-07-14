/**
 * Fidelity harness for the src/ → @pragma-graph/core consolidation.
 *
 * Asserts that the GUI's export generators (src/utils/exportUtils.ts) and
 * core's (packages/core/src/exportUtils.ts) produce identical output for
 * every fixture, then snapshots the core output as the permanent golden.
 * Once the src copies are deleted, the parity half of this file goes away
 * and the snapshots keep guarding core alone.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

import * as srcExport from '../../src/utils/exportUtils';
import * as coreExport from '../../packages/core/src/exportUtils';
import type { Diagram } from '../../packages/core/src/types';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const fixtureFiles = readdirSync(fixturesDir).filter(f => f.endsWith('.json')).sort();

const loadFixture = (file: string): Diagram =>
  JSON.parse(readFileSync(path.join(fixturesDir, file), 'utf-8'));

// Core stripped trailing whitespace from generated markup; treat that as
// non-semantic when comparing against the src copy.
const stripTrailing = (s: string) => s.split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n');

// The JSON export stamps `exported: new Date().toISOString()`.
const normalizeExportedTimestamp = (json: string) =>
  json.replace(/"exported": "[^"]+"/, '"exported": "<normalized>"');

describe.each(fixtureFiles)('export parity for %s', (file) => {
  const diagram = loadFixture(file);

  it('TikZ code is identical', () => {
    const src = srcExport.generateTikZCode(diagram.nodes, diagram.edges, diagram.type);
    const core = coreExport.generateTikZCode(diagram.nodes, diagram.edges, diagram.type);
    expect(stripTrailing(core)).toBe(stripTrailing(src));
    expect(core).toMatchSnapshot('tikz');
  });

  it('LaTeX document is identical', () => {
    const src = srcExport.generateLaTeXDocument(diagram);
    const core = coreExport.generateLaTeXDocument(diagram);
    expect(stripTrailing(core)).toBe(stripTrailing(src));
    expect(core).toMatchSnapshot('latex');
  });

  it('SVG content is identical', () => {
    const src = srcExport.generateSVGContent(diagram);
    const core = coreExport.generateSVGContent(diagram);
    expect(stripTrailing(core)).toBe(stripTrailing(src));
    expect(core).toMatchSnapshot('svg');
  });

  it('JSON export is identical modulo timestamp', () => {
    const src = normalizeExportedTimestamp(srcExport.generateJSONExport(diagram));
    const core = normalizeExportedTimestamp(coreExport.generateJSONExport(diagram));
    expect(core).toBe(src);
    expect(core).toMatchSnapshot('json');
  });

  it('edge geometry is identical per edge', () => {
    for (const edge of diagram.edges) {
      const src = srcExport.computeEdgeGeometryForExport(edge, diagram.nodes, diagram.edges);
      const core = coreExport.computeEdgeGeometryForExport(edge, diagram.nodes, diagram.edges);
      expect(core).toEqual(src);
    }
  });
});

describe('escapeLaTeXText parity', () => {
  const cases = [
    'A & B % C $ D # E',
    'under_score {brace} ~tilde^ hat',
    'back\\slash text',
    '$x_1 \\to y^2$',
    '\\textit{already formatted}',
    '50% of $100 & more_stuff #1',
    'V₁ subscript unicode → arrow',
    ''
  ];
  it.each(cases)('escapes %j identically', (text) => {
    expect(coreExport.escapeLaTeXText(text)).toBe(srcExport.escapeLaTeXText(text));
  });
  it.each(cases)('classifies %j identically', (text) => {
    expect(coreExport.isLaTeXContent(text)).toBe(srcExport.isLaTeXContent(text));
  });
});
