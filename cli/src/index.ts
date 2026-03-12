#!/usr/bin/env node

import { Command } from 'commander';
import { loadDiagramFromFile } from './headless/fileManager.js';
import { loadDiagramIntoStore } from './headless/headlessStore.js';
import { setOutputMode } from './output/formatter.js';
import { discoverGUI } from './util/discovery.js';
import { GUIClient } from './client/httpClient.js';
import { setGUIClient } from './backend.js';
import { registerDiagramCommands } from './commands/diagram.js';
import { registerNodeCommands } from './commands/node.js';
import { registerEdgeCommands } from './commands/edge.js';
import { registerEntryExitCommands } from './commands/entryExit.js';
import { registerExportCommands } from './commands/export.js';
import { registerHistoryCommands } from './commands/history.js';
import { registerSchemaCommands } from './commands/schema.js';
import { registerStatusCommand } from './commands/status.js';

const program = new Command();

program
  .name('pragma-cli')
  .description(`CLI for Pragma Graph Tool — create and manipulate MUD/TOTE diagrams.

  Quick start:
    pragma-cli schema all                                    # discover all types
    pragma-cli --file d.json diagram create --name "My MUD" --type MUD
    pragma-cli --file d.json node add --type vocabulary --label "V₁" --x 100 --y 100
    pragma-cli --file d.json node add --type practice --label "P₁" --x 300 --y 100
    pragma-cli --file d.json edge add --source <V1_ID> --target <P1_ID> --type VP
    pragma-cli --file d.json export latex --raw > output.tex`)
  .version('1.0.0')
  .option('--json', 'Force JSON output')
  .option('--human', 'Force human-readable output')
  .option('--file <path>', 'Diagram file to load/save automatically')
  .option('--headless', 'Force headless mode (no GUI connection)')
  .hook('preAction', async (_thisCommand, actionCommand) => {
    // Resolve global options from the root program
    const opts = program.opts();

    // Set output mode
    if (opts.json) setOutputMode('json');
    else if (opts.human) setOutputMode('human');
    else setOutputMode('auto');

    // Try to connect to GUI (unless --headless is set)
    if (!opts.headless) {
      const conn = discoverGUI();
      if (conn) {
        const client = new GUIClient(conn);
        try {
          await client.getStatus(); // verify connection is alive
          setGUIClient(client);
        } catch {
          // GUI not responding, fall back to headless
        }
      }
    }

    // Auto-load file if specified (only in headless mode)
    if (opts.file) {
      const commandName = actionCommand.name();
      const parentName = actionCommand.parent?.name();

      const isCreateOrLoad =
        (parentName === 'diagram' && (commandName === 'create' || commandName === 'load'));

      if (!isCreateOrLoad) {
        try {
          const diagram = loadDiagramFromFile(opts.file);
          loadDiagramIntoStore(diagram);
        } catch {
          // File may not exist yet, that's ok for create commands
        }
      }
    }
  });

// Helper to get the file path from global options
const getFilePath = () => program.opts().file as string | undefined;

// Register all command groups
registerStatusCommand(program);
registerDiagramCommands(program, getFilePath);
registerNodeCommands(program, getFilePath);
registerEdgeCommands(program, getFilePath);
registerEntryExitCommands(program, getFilePath);
registerExportCommands(program);
registerHistoryCommands(program, getFilePath);
registerSchemaCommands(program);

program.parse();
