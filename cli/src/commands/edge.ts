import { Command } from 'commander';
import {
  addEdge, updateEdge, deleteEdge, saveToHistory,
  type EdgeType
} from '@pragma-graph/core';
import { dispatch, requireDiagram, autoSave } from '../backend.js';
import { outputSuccess, outputError } from '../output/formatter.js';

const VALID_EDGE_TYPES: EdgeType[] = [
  'PV', 'VP', 'PP', 'VV',
  'PV-suff', 'PV-nec', 'VP-suff', 'VP-nec',
  'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec',
  'sequence', 'feedback', 'loop', 'exit', 'entry', 'test-pass', 'test-fail',
  'resultant', 'unmarked', 'custom'
];

export function registerEdgeCommands(program: Command, getFilePath: () => string | undefined): void {
  const edge = program.command('edge').description('Edge manipulation commands');

  edge
    .command('add')
    .description('Add an edge between two nodes')
    .requiredOption('--source <id>', 'Source node ID')
    .requiredOption('--target <id>', 'Target node ID')
    .requiredOption('--type <type>', 'Edge type. MUD: PV, VP, PP, VV (add -suff/-nec for qualified). TOTE: sequence, feedback, loop, test-pass, test-fail, entry, exit. Other: resultant, unmarked, custom. Use "schema edge-types" for details.')
    .option('--label <label>', 'Edge label')
    .option('--resultant', 'Mark as resultant (dashed)')
    .option('--order <number>', 'Edge ordering number')
    .action(async (opts) => {
      try {
        const d = await requireDiagram();

        if (!d.nodes.find(n => n.id === opts.source)) {
          outputError('edge.add', 'SOURCE_NOT_FOUND', `Source node not found: ${opts.source}`);
          return;
        }
        if (!d.nodes.find(n => n.id === opts.target)) {
          outputError('edge.add', 'TARGET_NOT_FOUND', `Target node not found: ${opts.target}`);
          return;
        }

        const type = opts.type as EdgeType;
        if (!VALID_EDGE_TYPES.includes(type)) {
          outputError('edge.add', 'INVALID_EDGE_TYPE', `Invalid edge type: ${opts.type}`, VALID_EDGE_TYPES);
          return;
        }

        const edgeData: Record<string, unknown> = {
          source: opts.source,
          target: opts.target,
          type,
        };

        if (opts.label) edgeData.label = opts.label;
        if (opts.resultant) edgeData.isResultant = true;
        if (opts.order !== undefined) edgeData.orderNumber = parseInt(opts.order, 10);

        await dispatch(saveToHistory());
        await dispatch(addEdge(edgeData as Parameters<typeof addEdge>[0]));

        const diagram = await requireDiagram();
        const created = diagram.edges[diagram.edges.length - 1];

        await autoSave(getFilePath);

        outputSuccess('edge.add', {
          id: created.id,
          source: created.source,
          target: created.target,
          type: created.type,
          ...(created.label ? { label: created.label } : {})
        });
      } catch (e) {
        outputError('edge.add', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  edge
    .command('list')
    .description('List all edges')
    .action(async () => {
      try {
        const d = await requireDiagram();
        const edges = d.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          ...(e.label ? { label: e.label } : {}),
          ...(e.isResultant ? { isResultant: true } : {})
        }));
        outputSuccess('edge.list', edges);
      } catch (e) {
        outputError('edge.list', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  edge
    .command('get')
    .description('Get an edge by ID')
    .argument('<id>', 'Edge ID')
    .action(async (id) => {
      try {
        const d = await requireDiagram();
        const found = d.edges.find(e => e.id === id);
        if (!found) {
          outputError('edge.get', 'NOT_FOUND', `Edge not found: ${id}`);
          return;
        }
        outputSuccess('edge.get', found);
      } catch (e) {
        outputError('edge.get', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  edge
    .command('update')
    .description('Update an edge')
    .argument('<id>', 'Edge ID')
    .option('--label <label>', 'New label')
    .option('--type <type>', 'New edge type')
    .option('--resultant', 'Mark as resultant')
    .option('--no-resultant', 'Unmark as resultant')
    .action(async (id, opts) => {
      try {
        const d = await requireDiagram();
        if (!d.edges.find(e => e.id === id)) {
          outputError('edge.update', 'NOT_FOUND', `Edge not found: ${id}`);
          return;
        }

        const updates: Record<string, unknown> = {};
        if (opts.label !== undefined) updates.label = opts.label;
        if (opts.type !== undefined) {
          if (!VALID_EDGE_TYPES.includes(opts.type as EdgeType)) {
            outputError('edge.update', 'INVALID_EDGE_TYPE', `Invalid edge type: ${opts.type}`, VALID_EDGE_TYPES);
            return;
          }
          updates.type = opts.type;
        }
        if (opts.resultant !== undefined) updates.isResultant = opts.resultant;

        if (Object.keys(updates).length === 0) {
          outputError('edge.update', 'NO_UPDATES', 'No updates specified');
          return;
        }

        await dispatch(saveToHistory());
        await dispatch(updateEdge({ id, updates }));

        await autoSave(getFilePath);

        const updated = (await requireDiagram()).edges.find(e => e.id === id)!;
        outputSuccess('edge.update', updated);
      } catch (e) {
        outputError('edge.update', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  edge
    .command('delete')
    .description('Delete an edge')
    .argument('<id>', 'Edge ID')
    .action(async (id) => {
      try {
        const d = await requireDiagram();
        if (!d.edges.find(e => e.id === id)) {
          outputError('edge.delete', 'NOT_FOUND', `Edge not found: ${id}`);
          return;
        }

        await dispatch(saveToHistory());
        await dispatch(deleteEdge(id));

        await autoSave(getFilePath);

        outputSuccess('edge.delete', { id, deleted: true });
      } catch (e) {
        outputError('edge.delete', 'NO_DIAGRAM', (e as Error).message);
      }
    });
}
