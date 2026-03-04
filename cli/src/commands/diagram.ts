import { Command } from 'commander';
import { createDiagram } from '@pragma-graph/core';
import type { Diagram } from '@pragma-graph/core';
import { dispatch, getDiagram, requireDiagram, isConnected } from '../backend.js';
import { loadDiagramFromFile, saveDiagramToFile } from '../headless/fileManager.js';
import { loadDiagramIntoStore } from '../headless/headlessStore.js';
import { outputSuccess, outputError } from '../output/formatter.js';

const VALID_TYPES: Diagram['type'][] = ['MUD', 'TOTE', 'HYBRID', 'GENERIC'];

export function registerDiagramCommands(program: Command, getFilePath: () => string | undefined): void {
  const diagram = program.command('diagram').description('Diagram lifecycle commands');

  diagram
    .command('create')
    .description('Create a new diagram')
    .requiredOption('--name <name>', 'Diagram name')
    .option('--type <type>', 'Diagram type (MUD, TOTE, HYBRID, GENERIC)', 'MUD')
    .action(async (opts) => {
      const type = opts.type.toUpperCase() as Diagram['type'];
      if (!VALID_TYPES.includes(type)) {
        outputError('diagram.create', 'INVALID_DIAGRAM_TYPE', `Invalid diagram type: ${opts.type}`, VALID_TYPES);
        return;
      }

      await dispatch(createDiagram({ name: opts.name, type }));
      const created = (await getDiagram())!;

      const filePath = getFilePath();
      if (filePath && !isConnected()) {
        saveDiagramToFile(created, filePath);
      }

      outputSuccess('diagram.create', {
        id: created.id,
        name: created.name,
        type: created.type
      });
    });

  diagram
    .command('info')
    .description('Show current diagram info')
    .action(async () => {
      try {
        const d = await requireDiagram();
        outputSuccess('diagram.info', {
          id: d.id,
          name: d.name,
          type: d.type,
          nodes: d.nodes.length,
          edges: d.edges.length,
          entryPoints: d.entryPoints.length,
          exitPoints: d.exitPoints.length,
          metadata: d.metadata
        });
      } catch (e) {
        outputError('diagram.info', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  diagram
    .command('load')
    .description('Load a diagram from a JSON file')
    .argument('<file>', 'Path to diagram JSON file')
    .action(async (file) => {
      try {
        const loaded = loadDiagramFromFile(file);
        if (isConnected()) {
          // When connected to GUI, dispatch loadDiagram to GUI
          const { loadDiagram } = await import('@pragma-graph/core');
          await dispatch(loadDiagram(loaded));
        } else {
          loadDiagramIntoStore(loaded);
        }
        outputSuccess('diagram.load', {
          id: loaded.id,
          name: loaded.name,
          type: loaded.type,
          nodes: loaded.nodes.length,
          edges: loaded.edges.length
        });
      } catch (e) {
        outputError('diagram.load', 'LOAD_FAILED', (e as Error).message);
      }
    });

  diagram
    .command('clear')
    .description('Clear the current diagram')
    .action(async () => {
      await dispatch(createDiagram({ name: 'Untitled', type: 'MUD' }));
      outputSuccess('diagram.clear', { message: 'Diagram cleared' });
    });

  diagram
    .command('save')
    .description('Save current diagram to file')
    .argument('[file]', 'Path to save to (defaults to --file)')
    .action(async (file) => {
      const filePath = file || getFilePath();
      if (!filePath) {
        outputError('diagram.save', 'NO_FILE', 'No file path specified. Use --file or provide a path argument.');
        return;
      }
      try {
        const d = await requireDiagram();
        saveDiagramToFile(d, filePath);
        outputSuccess('diagram.save', { file: filePath });
      } catch (e) {
        outputError('diagram.save', 'SAVE_FAILED', (e as Error).message);
      }
    });
}
