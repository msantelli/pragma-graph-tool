import { Command } from 'commander';
import { getDiagram, isConnected } from '../backend.js';
import { outputSuccess } from '../output/formatter.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show CLI status and connection info')
    .action(async () => {
      const diagram = await getDiagram();

      outputSuccess('status', {
        mode: isConnected() ? 'connected' : 'headless',
        gui: isConnected(),
        diagram: diagram ? {
          id: diagram.id,
          name: diagram.name,
          type: diagram.type,
          nodes: diagram.nodes.length,
          edges: diagram.edges.length
        } : null
      });
    });
}
