/**
 * Browser-side export/import actions.
 *
 * All content generation lives in @pragma-graph/core (the single source of
 * truth shared with the CLI); this module only wraps the pure generators in
 * DOM download/upload plumbing.
 */
import {
  generateJSONExport,
  generateSVGContent,
  generateLaTeXDocument,
  validateDiagramImport
} from '@pragma-graph/core';
import type { Diagram } from '@pragma-graph/core';

export type ImportDiagramCallback = (diagram: Diagram) => void;

const downloadBlob = (content: string, mimeType: string, filename: string) => {
  const dataBlob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

// Export diagram as JSON (browser download)
export const exportAsJSON = (diagram: Diagram) => {
  downloadBlob(generateJSONExport(diagram), 'application/json', `${diagram.name || 'pragma-graph'}.json`);
};

// Export diagram as SVG (browser download)
export const exportAsSVG = (diagram: Diagram) => {
  downloadBlob(generateSVGContent(diagram), 'image/svg+xml', `${diagram.name || 'pragma-graph'}.svg`);
};

// Export diagram as LaTeX (browser download)
export const exportAsLaTeX = (diagram: Diagram) => {
  downloadBlob(generateLaTeXDocument(diagram), 'text/plain', `${diagram.name || 'pragma-graph'}.tex`);
};

// Import diagram from a user-picked JSON file
export const importFromJSON = (onImport: ImportDiagramCallback) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonStr = e.target?.result as string;
        const diagram = validateDiagramImport(JSON.parse(jsonStr));

        if (confirm('This will replace your current diagram. Continue?')) {
          onImport(diagram);
        }
      } catch (error) {
        console.error('Failed to import diagram:', error);
        alert(`Failed to import diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    reader.readAsText(file);
  };

  input.click();
};
