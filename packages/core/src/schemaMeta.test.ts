import { describe, it, expect } from 'vitest';
import { NODE_TYPES, EDGE_TYPES_DETAILS, EDGE_TYPES_GROUPED, DIAGRAM_MODES } from './schemaMeta.js';
import type { NodeType, EdgeType, Node, Edge } from './types.js';

// The unions from types.ts, written out as value arrays. If a literal is
// added to the union without updating this list, the length checks below
// still catch drift against the metadata maps.
const NODE_TYPE_LITERALS: NodeType[] = ['vocabulary', 'practice', 'test', 'operate', 'exit', 'custom'];
const EDGE_TYPE_LITERALS: EdgeType[] = [
  'PV', 'VP', 'PP', 'VV',
  'PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec',
  'sequence', 'feedback', 'loop', 'exit', 'entry', 'test-pass', 'test-fail',
  'resultant', 'unmarked', 'custom'
];

describe('schemaMeta consistency with types.ts', () => {
  it('every NodeType literal has metadata, and no extras', () => {
    expect(Object.keys(NODE_TYPES).sort()).toEqual([...NODE_TYPE_LITERALS].sort());
  });

  it('every EdgeType literal has detailed metadata, and no extras', () => {
    expect(Object.keys(EDGE_TYPES_DETAILS).sort()).toEqual([...EDGE_TYPE_LITERALS].sort());
  });

  it('the grouped legacy shape covers exactly the EdgeType union', () => {
    const grouped = [
      ...EDGE_TYPES_GROUPED.MUD.basic,
      ...EDGE_TYPES_GROUPED.MUD.qualified,
      ...EDGE_TYPES_GROUPED.TOTE.types,
      ...EDGE_TYPES_GROUPED.other.types
    ];
    expect(grouped.sort()).toEqual([...EDGE_TYPE_LITERALS].sort());
  });

  it('edge metadata endpoint types are valid node types or "any"', () => {
    const valid = new Set([...NODE_TYPE_LITERALS, 'any']);
    for (const [type, meta] of Object.entries(EDGE_TYPES_DETAILS)) {
      expect(valid.has(meta.sourceType), `${type}.sourceType`).toBe(true);
      expect(valid.has(meta.targetType), `${type}.targetType`).toBe(true);
    }
  });

  it('diagram modes cover the Diagram["type"] union', () => {
    expect(Object.keys(DIAGRAM_MODES).sort()).toEqual(['GENERIC', 'HYBRID', 'MUD', 'TOTE']);
  });

  // Compile-time guard: assigning the literal arrays to the union types above
  // fails to build if a union member is renamed. This runtime line just keeps
  // the imports "used" for the type-checker.
  it('type unions are importable', () => {
    const n: Node['type'] = NODE_TYPE_LITERALS[0];
    const e: Edge['type'] = EDGE_TYPE_LITERALS[0];
    expect(n).toBeDefined();
    expect(e).toBeDefined();
  });
});
