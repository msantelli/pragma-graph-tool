import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  loadDiagramFromFile,
  getLoadedDiagramId,
  setForceOverwrite,
  isForceOverwrite
} from './src/headless/fileManager.js';

let dir: string;
let file: string;

const diagramJson = {
  id: 'file-diagram-id',
  name: 'File Diagram',
  type: 'MUD',
  nodes: [{ id: 'n1', type: 'vocabulary', position: { x: 0, y: 0 }, label: 'V' }],
  edges: [],
  entryPoints: [],
  exitPoints: [],
  metadata: { created: '2026-01-01T00:00:00.000Z', modified: '2026-01-01T00:00:00.000Z' }
};

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pragma-mirror-'));
  file = path.join(dir, 'diagram.json');
  fs.writeFileSync(file, JSON.stringify(diagramJson));
  setForceOverwrite(false);
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('mirror identity tracking', () => {
  it('records the loaded diagram id per file', () => {
    loadDiagramFromFile(file);
    expect(getLoadedDiagramId(file)).toBe('file-diagram-id');
    expect(getLoadedDiagramId(path.join(dir, 'other.json'))).toBeUndefined();
  });

  it('exposes the --force state', () => {
    expect(isForceOverwrite()).toBe(false);
    setForceOverwrite(true);
    expect(isForceOverwrite()).toBe(true);
  });
});
