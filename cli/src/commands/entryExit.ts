import { Command } from 'commander';
import {
  addEntryPoint, addExitPoint, deleteEntryPoint, deleteExitPoint, saveToHistory
} from '@pragma-graph/core';
import { dispatch, requireDiagram, autoSave } from '../backend.js';
import { outputSuccess, outputError } from '../output/formatter.js';

export function registerEntryExitCommands(program: Command, getFilePath: () => string | undefined): void {

  // Entry point commands
  const entry = program.command('entry').description('Entry point commands');

  entry
    .command('add')
    .description('Add an entry point')
    .requiredOption('--node <id>', 'Target node ID')
    .option('--x <x>', 'X position', '0')
    .option('--y <y>', 'Y position', '0')
    .option('--label <label>', 'Entry point label')
    .action(async (opts) => {
      try {
        const d = await requireDiagram();
        if (!d.nodes.find(n => n.id === opts.node)) {
          outputError('entry.add', 'NODE_NOT_FOUND', `Node not found: ${opts.node}`);
          return;
        }

        await dispatch(saveToHistory());
        await dispatch(addEntryPoint({
          position: { x: parseFloat(opts.x), y: parseFloat(opts.y) },
          targetNodeId: opts.node,
          ...(opts.label ? { label: opts.label } : {})
        }));

        const diagram = await requireDiagram();
        const created = diagram.entryPoints[diagram.entryPoints.length - 1];

        await autoSave(getFilePath);

        outputSuccess('entry.add', created);
      } catch (e) {
        outputError('entry.add', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  entry
    .command('list')
    .description('List all entry points')
    .action(async () => {
      try {
        const d = await requireDiagram();
        outputSuccess('entry.list', d.entryPoints);
      } catch (e) {
        outputError('entry.list', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  entry
    .command('delete')
    .description('Delete an entry point')
    .argument('<id>', 'Entry point ID')
    .action(async (id) => {
      try {
        await requireDiagram();

        await dispatch(saveToHistory());
        await dispatch(deleteEntryPoint(id));

        await autoSave(getFilePath);

        outputSuccess('entry.delete', { id, deleted: true });
      } catch (e) {
        outputError('entry.delete', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  // Exit point commands
  const exit = program.command('exit').description('Exit point commands');

  exit
    .command('add')
    .description('Add an exit point')
    .requiredOption('--node <id>', 'Source node ID')
    .option('--x <x>', 'X position', '0')
    .option('--y <y>', 'Y position', '0')
    .option('--label <label>', 'Exit point label')
    .action(async (opts) => {
      try {
        const d = await requireDiagram();
        if (!d.nodes.find(n => n.id === opts.node)) {
          outputError('exit.add', 'NODE_NOT_FOUND', `Node not found: ${opts.node}`);
          return;
        }

        await dispatch(saveToHistory());
        await dispatch(addExitPoint({
          position: { x: parseFloat(opts.x), y: parseFloat(opts.y) },
          sourceNodeId: opts.node,
          ...(opts.label ? { label: opts.label } : {})
        }));

        const diagram = await requireDiagram();
        const created = diagram.exitPoints[diagram.exitPoints.length - 1];

        await autoSave(getFilePath);

        outputSuccess('exit.add', created);
      } catch (e) {
        outputError('exit.add', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  exit
    .command('list')
    .description('List all exit points')
    .action(async () => {
      try {
        const d = await requireDiagram();
        outputSuccess('exit.list', d.exitPoints);
      } catch (e) {
        outputError('exit.list', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  exit
    .command('delete')
    .description('Delete an exit point')
    .argument('<id>', 'Exit point ID')
    .action(async (id) => {
      try {
        await requireDiagram();

        await dispatch(saveToHistory());
        await dispatch(deleteExitPoint(id));

        await autoSave(getFilePath);

        outputSuccess('exit.delete', { id, deleted: true });
      } catch (e) {
        outputError('exit.delete', 'NO_DIAGRAM', (e as Error).message);
      }
    });
}
