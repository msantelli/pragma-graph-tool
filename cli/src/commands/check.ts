import { Command } from 'commander';
import { validateDiagram } from '@pragma-graph/core';
import { requireDiagram } from '../backend.js';
import { outputSuccess, outputError } from '../output/formatter.js';

export function registerCheckCommand(program: Command): void {
  program
    .command('check')
    .description(
      'Permissive structural validator: reports node-type/MUR mismatches, resultant-basis problems, dangling refs, and TOTE structure advisories. Never blocks or mutates.'
    )
    .option('--severity <level>', "Filter by severity: 'warning' | 'suggestion' | 'all'", 'all')
    .action(async (opts) => {
      try {
        const diagram = await requireDiagram();
        const issues = validateDiagram(diagram);
        const filtered =
          opts.severity === 'all'
            ? issues
            : issues.filter(i => i.severity === opts.severity);

        outputSuccess('check', {
          diagram: { id: diagram.id, name: diagram.name, type: diagram.type },
          counts: {
            total: filtered.length,
            warning: filtered.filter(i => i.severity === 'warning').length,
            suggestion: filtered.filter(i => i.severity === 'suggestion').length
          },
          issues: filtered
        });
      } catch (e) {
        outputError('check', 'NO_DIAGRAM', (e as Error).message);
      }
    });
}
