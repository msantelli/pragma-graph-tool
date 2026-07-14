/**
 * Pins the unified edge geometry to the Canvas's historical on-screen
 * behavior (the user-visible truth). The snapshots in this file were
 * anchored against Canvas.tsx getEdgeGeometry BEFORE the unification;
 * the unified core implementation must keep matching them.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

import { getEdgeGeometry } from '../../src/components/Canvas/edgeGeometryAdapter';
import type { Diagram } from '@pragma-graph/core';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const fixtureFiles = readdirSync(fixturesDir).filter(f => f.endsWith('.json')).sort();

const loadFixture = (file: string): Diagram =>
  JSON.parse(readFileSync(path.join(fixturesDir, file), 'utf-8'));

const round = (v: number | null) => (v === null ? null : Math.round(v * 1e6) / 1e6);
const roundPt = (p: { x: number; y: number }) => ({ x: round(p.x), y: round(p.y) });

describe.each(fixtureFiles)('unified geometry matches historical canvas behavior for %s', (file) => {
  const diagram = loadFixture(file);

  it.each(diagram.edges.map(e => [e.id, e] as const))('edge %s', (_id, edge) => {
    const g = getEdgeGeometry(edge, diagram.nodes, diagram.edges);
    expect({
      path: g.path,
      labelPosition: roundPt(g.labelPosition),
      labelAngle: round(g.labelAngle ?? null)
    }).toMatchSnapshot();
  });
});
