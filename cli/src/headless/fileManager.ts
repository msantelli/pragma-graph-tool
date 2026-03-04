import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateDiagramImport } from '@pragma-graph/core';
import type { Diagram } from '@pragma-graph/core';

export function loadDiagramFromFile(filePath: string): Diagram {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');
  const data = JSON.parse(raw);
  return validateDiagramImport(data);
}

export function saveDiagramToFile(diagram: Diagram, filePath: string): void {
  const resolved = path.resolve(filePath);
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

  fs.writeFileSync(resolved, JSON.stringify(exportData, null, 2) + '\n', 'utf-8');
}
