import { Command } from 'commander';
import {
  deriveResultants,
  detectLXRelations,
  detectPragmaticMetavocabulary,
  buildResultantEdgePayload,
  addEdge,
  saveToHistory
} from '@pragma-graph/core';
import { requireDiagram, dispatchBatch, autoSave } from '../backend.js';
import { outputSuccess, outputError } from '../output/formatter.js';

export function registerDeriveCommand(
  program: Command,
  getFilePath: () => string | undefined
): void {
  program
    .command('derive')
    .description(
      'Strict Brandom-canonical composition engine: enumerate resultants and LX relations licensed by BSD §3-4 patterns. Use --apply to materialise suggestions as resultant edges.'
    )
    .option('--lx', 'Report LX relations only')
    .option('--pragmatic-metavocab', 'Report pragmatic-metavocabulary relations only')
    .option('--apply', 'Add the suggested resultant edges to the diagram (mutates)')
    .action(async (opts) => {
      try {
        const diagram = await requireDiagram();

        if (opts.lx) {
          const lx = detectLXRelations(diagram);
          outputSuccess('derive.lx', {
            diagram: { id: diagram.id, name: diagram.name },
            count: lx.length,
            relations: lx
          });
          return;
        }

        if (opts.pragmaticMetavocab) {
          const pm = detectPragmaticMetavocabulary(diagram);
          outputSuccess('derive.pragmatic-metavocab', {
            diagram: { id: diagram.id, name: diagram.name },
            count: pm.length,
            relations: pm
          });
          return;
        }

        const suggestions = deriveResultants(diagram);

        if (opts.apply) {
          if (suggestions.length === 0) {
            outputSuccess('derive.apply', {
              diagram: { id: diagram.id, name: diagram.name },
              applied: 0,
              suggestions: []
            });
            return;
          }
          // Build all actions up-front and send as one batch so the apply is
          // atomic across the HTTP boundary. In headless mode dispatchBatch
          // is a tight in-process loop; in connected mode it's one round trip
          // the GUI server must commit transactionally. Either way we never
          // exit with the diagram half-mutated.
          const existingMax = diagram.edges.reduce(
            (m, e) => (typeof e.orderNumber === 'number' ? Math.max(m, e.orderNumber) : m),
            0
          );
          const actions: Array<{ type: string; payload?: unknown }> = [
            saveToHistory() as unknown as { type: string; payload?: unknown }
          ];
          const applied: { source: string; target: string; type: string; rule: string }[] = [];
          let order = existingMax;
          for (const s of suggestions) {
            order += 1;
            const payload = buildResultantEdgePayload(s, order - 1);
            actions.push(addEdge(payload) as unknown as { type: string; payload?: unknown });
            applied.push({ source: s.source, target: s.target, type: s.type, rule: s.rule });
          }
          await dispatchBatch(actions);
          await autoSave(getFilePath);
          outputSuccess('derive.apply', {
            diagram: { id: diagram.id, name: diagram.name },
            applied: applied.length,
            edges: applied
          });
          return;
        }

        outputSuccess('derive', {
          diagram: { id: diagram.id, name: diagram.name },
          count: suggestions.length,
          suggestions
        });
      } catch (e) {
        outputError('derive', 'NO_DIAGRAM', (e as Error).message);
      }
    });
}
