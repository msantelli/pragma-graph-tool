import { Command } from 'commander';
import {
  generateJSONExport, generateLaTeXDocument, generateSVGContent
} from '@pragma-graph/core';
import { requireDiagram } from '../backend.js';
import { outputSuccess, outputError, outputRaw } from '../output/formatter.js';

export function registerExportCommands(program: Command): void {
  const exp = program.command('export').description('Export diagram in various formats');

  exp
    .command('json')
    .description('Export diagram as JSON')
    .option('--raw', 'Output raw JSON (no envelope)')
    .action(async (opts) => {
      try {
        const d = await requireDiagram();
        const json = generateJSONExport(d);
        if (opts.raw) {
          outputRaw(json + '\n');
        } else {
          outputSuccess('export.json', JSON.parse(json));
        }
      } catch (e) {
        outputError('export.json', 'EXPORT_FAILED', (e as Error).message);
      }
    });

  exp
    .command('latex')
    .description('Export diagram as LaTeX/TikZ')
    .option('--raw', 'Output raw LaTeX (no envelope)')
    .action(async (opts) => {
      try {
        const d = await requireDiagram();
        const latex = generateLaTeXDocument(d);
        if (opts.raw || !process.stdout.isTTY) {
          outputRaw(latex + '\n');
        } else {
          outputSuccess('export.latex', latex);
        }
      } catch (e) {
        outputError('export.latex', 'EXPORT_FAILED', (e as Error).message);
      }
    });

  exp
    .command('svg')
    .description('Export diagram as SVG')
    .option('--raw', 'Output raw SVG (no envelope)')
    .action(async (opts) => {
      try {
        const d = await requireDiagram();
        const svg = generateSVGContent(d);
        if (opts.raw || !process.stdout.isTTY) {
          outputRaw(svg + '\n');
        } else {
          outputSuccess('export.svg', svg);
        }
      } catch (e) {
        outputError('export.svg', 'EXPORT_FAILED', (e as Error).message);
      }
    });
}
