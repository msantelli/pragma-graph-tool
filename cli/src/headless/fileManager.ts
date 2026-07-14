import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { validateDiagramImport } from '@pragma-graph/core';
import type { Diagram } from '@pragma-graph/core';

// Content hash of each --file at the moment we loaded it, keyed by resolved
// path. Guards against clobbering edits made by another process (GUI, second
// CLI) between our load and save: conflict detection, not locking. Content
// hashing beats mtime here — filesystem timestamp granularity (especially on
// WSL/NTFS) can miss rapid rewrites, and an identical rewrite is no conflict.
const loadedHashes = new Map<string, string>();

const hashContent = (raw: string | Buffer): string =>
  createHash('sha256').update(raw).digest('hex');

let force = false;

/** --force: skip the conflict check on save. */
export function setForceOverwrite(value: boolean): void {
  force = value;
}

export class FileConflictError extends Error {
  constructor(filePath: string) {
    super(`File changed on disk since it was loaded: ${filePath}`);
    this.name = 'FileConflictError';
  }
}

export function loadDiagramFromFile(filePath: string): Diagram {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');
  loadedHashes.set(resolved, hashContent(raw));
  const data = JSON.parse(raw);
  return validateDiagramImport(data);
}

export function saveDiagramToFile(diagram: Diagram, filePath: string): void {
  const resolved = path.resolve(filePath);

  const loadedHash = loadedHashes.get(resolved);
  if (!force && loadedHash !== undefined && fs.existsSync(resolved)) {
    if (hashContent(fs.readFileSync(resolved)) !== loadedHash) {
      throw new FileConflictError(resolved);
    }
  }

  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const exportData = {
    ...diagram,
    metadata: {
      ...diagram.metadata,
      exported: new Date().toISOString(),
      version: '1.1'
    }
  };

  const serialized = JSON.stringify(exportData, null, 2) + '\n';
  fs.writeFileSync(resolved, serialized, 'utf-8');
  loadedHashes.set(resolved, hashContent(serialized));
}
