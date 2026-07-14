import { Command } from 'commander';
import { getDiagram, isConnected, getGUIClient } from '../backend.js';
import { outputSuccess } from '../output/formatter.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show CLI status and connection info')
    .action(async () => {
      const diagram = await getDiagram();
      const conn = getGUIClient()?.connection;

      outputSuccess('status', {
        mode: isConnected() ? 'connected' : 'headless',
        gui: isConnected(),
        ...(conn ? {
          endpoint: `http://${conn.host}:${conn.port}`,
          discoverySource: conn.source,
          guiVersion: conn.version
        } : {}),
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
