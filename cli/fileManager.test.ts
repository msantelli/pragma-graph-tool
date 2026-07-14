import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  loadDiagramFromFile,
  saveDiagramToFile,
  setForceOverwrite,
  FileConflictError
} from './src/headless/fileManager.js';

let dir: string;
let file: string;

const diagramJson = {
  id: 'd1',
  name: 'Test',
  type: 'MUD',
  nodes: [{ id: 'n1', type: 'vocabulary', position: { x: 0, y: 0 }, label: 'V' }],
  edges: [],
  entryPoints: [],
  exitPoints: [],
  metadata: { created: '2026-01-01T00:00:00.000Z', modified: '2026-01-01T00:00:00.000Z' }
};

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pragma-filemanager-'));
  file = path.join(dir, 'diagram.json');
  fs.writeFileSync(file, JSON.stringify(diagramJson));
  setForceOverwrite(false);
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('file conflict guard', () => {
  it('saves normally when the file is untouched since load', () => {
    const d = loadDiagramFromFile(file);
    expect(() => saveDiagramToFile(d, file)).not.toThrow();
  });

  it('throws FileConflictError when the file changed after load', () => {
    const d = loadDiagramFromFile(file);
    // External writer (GUI / second CLI) modifies the file after our load.
    fs.writeFileSync(file, JSON.stringify({ ...diagramJson, name: 'Changed elsewhere' }));
    expect(() => saveDiagramToFile(d, file)).toThrow(FileConflictError);
  });

  it('--force bypasses the conflict check', () => {
    const d = loadDiagramFromFile(file);
    fs.writeFileSync(file, JSON.stringify({ ...diagramJson, name: 'Changed elsewhere' }));
    setForceOverwrite(true);
    expect(() => saveDiagramToFile(d, file)).not.toThrow();
  });

  it('save refreshes the recorded mtime so back-to-back saves work', () => {
    const d = loadDiagramFromFile(file);
    saveDiagramToFile(d, file);
    expect(() => saveDiagramToFile(d, file)).not.toThrow();
  });

  it('saving a never-loaded path (diagram create) skips the check', () => {
    const fresh = path.join(dir, 'fresh.json');
    const d = loadDiagramFromFile(file);
    expect(() => saveDiagramToFile(d, fresh)).not.toThrow();
  });
});
