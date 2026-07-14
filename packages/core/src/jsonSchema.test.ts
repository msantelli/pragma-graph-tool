import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';

import { DIAGRAM_JSON_SCHEMA } from './jsonSchema.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'tests', 'fixtures'
);

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(DIAGRAM_JSON_SCHEMA);

describe('DIAGRAM_JSON_SCHEMA', () => {
  it('compiles as valid draft 2020-12', () => {
    expect(validate).toBeTypeOf('function');
  });

  const fixtureFiles = readdirSync(fixturesDir).filter(f => f.endsWith('.json'));
  it.each(fixtureFiles)('accepts fixture %s', (file) => {
    const data = JSON.parse(readFileSync(path.join(fixturesDir, file), 'utf-8'));
    const ok = validate(data);
    expect(ok, JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it('rejects a node with an invalid type', () => {
    expect(validate({
      nodes: [{ id: 'n1', type: 'nonsense', position: { x: 0, y: 0 }, label: 'X' }],
      edges: []
    })).toBe(false);
  });

  it('rejects an edge missing source/target unless entry/exit', () => {
    expect(validate({
      nodes: [],
      edges: [{ id: 'e1', type: 'PV' }]
    })).toBe(false);
    expect(validate({
      nodes: [],
      edges: [{ id: 'e1', type: 'entry' }]
    })).toBe(true);
  });

  it('rejects a diagram without nodes/edges arrays', () => {
    expect(validate({ name: 'empty' })).toBe(false);
  });
});
