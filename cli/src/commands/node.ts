import { Command } from 'commander';
import {
  addNode, updateNode, updateNodePosition, deleteNode,
  saveToHistory, groupNodesIntoContainer, ungroupContainer,
  type NodeType
} from '@pragma-graph/core';
import { dispatch, requireDiagram, autoSave } from '../backend.js';
import { outputSuccess, outputError } from '../output/formatter.js';

const VALID_NODE_TYPES: NodeType[] = ['vocabulary', 'practice', 'test', 'operate', 'exit', 'custom'];

export function registerNodeCommands(program: Command, getFilePath: () => string | undefined): void {
  const node = program.command('node').description('Node manipulation commands');

  node
    .command('add')
    .description('Add a node to the diagram')
    .requiredOption('--type <type>', 'Node type (vocabulary, practice, test, operate, exit, custom)')
    .requiredOption('--label <label>', 'Node label text')
    .option('--x <x>', 'X position', '0')
    .option('--y <y>', 'Y position', '0')
    .option('--parent <parentId>', 'Parent node ID for nesting')
    .option('--subtype <subtype>', 'Node subtype')
    .option('--subscript <subscript>', 'Subscript text')
    .option('--secondary-label <label>', 'Secondary label text')
    .action(async (opts) => {
      try {
        await requireDiagram();
      } catch (e) {
        outputError('node.add', 'NO_DIAGRAM', (e as Error).message);
        return;
      }

      const type = opts.type.toLowerCase() as NodeType;
      if (!VALID_NODE_TYPES.includes(type)) {
        outputError('node.add', 'INVALID_NODE_TYPE', `Invalid node type: ${opts.type}`, VALID_NODE_TYPES);
        return;
      }

      const nodeData: Record<string, unknown> = {
        type,
        label: opts.label,
        position: { x: parseFloat(opts.x), y: parseFloat(opts.y) },
      };

      if (opts.parent) nodeData.parentId = opts.parent;
      if (opts.subtype) nodeData.subtype = opts.subtype;
      if (opts.subscript) nodeData.subscript = opts.subscript;
      if (opts.secondaryLabel) nodeData.secondaryLabel = opts.secondaryLabel;

      await dispatch(saveToHistory());
      await dispatch(addNode(nodeData as Parameters<typeof addNode>[0]));

      const diagram = await requireDiagram();
      const created = diagram.nodes[diagram.nodes.length - 1];

      await autoSave(getFilePath);

      outputSuccess('node.add', {
        id: created.id,
        type: created.type,
        label: created.label,
        position: created.position
      });
    });

  node
    .command('list')
    .description('List all nodes')
    .action(async () => {
      try {
        const d = await requireDiagram();
        const nodes = d.nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.label,
          position: n.position,
          ...(n.parentId ? { parentId: n.parentId } : {})
        }));
        outputSuccess('node.list', nodes);
      } catch (e) {
        outputError('node.list', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  node
    .command('get')
    .description('Get a node by ID')
    .argument('<id>', 'Node ID')
    .action(async (id) => {
      try {
        const d = await requireDiagram();
        const found = d.nodes.find(n => n.id === id);
        if (!found) {
          outputError('node.get', 'NOT_FOUND', `Node not found: ${id}`);
          return;
        }
        outputSuccess('node.get', found);
      } catch (e) {
        outputError('node.get', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  node
    .command('update')
    .description('Update a node')
    .argument('<id>', 'Node ID')
    .option('--label <label>', 'New label')
    .option('--subtype <subtype>', 'New subtype')
    .option('--subscript <subscript>', 'New subscript')
    .option('--secondary-label <label>', 'New secondary label')
    .action(async (id, opts) => {
      try {
        const d = await requireDiagram();
        if (!d.nodes.find(n => n.id === id)) {
          outputError('node.update', 'NOT_FOUND', `Node not found: ${id}`);
          return;
        }

        const updates: Record<string, unknown> = {};
        if (opts.label !== undefined) updates.label = opts.label;
        if (opts.subtype !== undefined) updates.subtype = opts.subtype;
        if (opts.subscript !== undefined) updates.subscript = opts.subscript;
        if (opts.secondaryLabel !== undefined) updates.secondaryLabel = opts.secondaryLabel;

        if (Object.keys(updates).length === 0) {
          outputError('node.update', 'NO_UPDATES', 'No updates specified');
          return;
        }

        await dispatch(saveToHistory());
        await dispatch(updateNode({ id, updates }));

        await autoSave(getFilePath);

        const updated = (await requireDiagram()).nodes.find(n => n.id === id)!;
        outputSuccess('node.update', updated);
      } catch (e) {
        outputError('node.update', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  node
    .command('move')
    .description('Move a node to a new position')
    .argument('<id>', 'Node ID')
    .requiredOption('--x <x>', 'New X position')
    .requiredOption('--y <y>', 'New Y position')
    .action(async (id, opts) => {
      try {
        const d = await requireDiagram();
        if (!d.nodes.find(n => n.id === id)) {
          outputError('node.move', 'NOT_FOUND', `Node not found: ${id}`);
          return;
        }

        await dispatch(saveToHistory());
        await dispatch(updateNodePosition({ id, position: { x: parseFloat(opts.x), y: parseFloat(opts.y) } }));

        await autoSave(getFilePath);

        outputSuccess('node.move', { id, position: { x: parseFloat(opts.x), y: parseFloat(opts.y) } });
      } catch (e) {
        outputError('node.move', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  node
    .command('delete')
    .description('Delete a node (and its descendants)')
    .argument('<id>', 'Node ID')
    .action(async (id) => {
      try {
        const d = await requireDiagram();
        if (!d.nodes.find(n => n.id === id)) {
          outputError('node.delete', 'NOT_FOUND', `Node not found: ${id}`);
          return;
        }

        await dispatch(saveToHistory());
        await dispatch(deleteNode(id));

        await autoSave(getFilePath);

        outputSuccess('node.delete', { id, deleted: true });
      } catch (e) {
        outputError('node.delete', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  node
    .command('group')
    .description('Group nodes into a container')
    .requiredOption('--ids <ids>', 'Comma-separated node IDs')
    .requiredOption('--label <label>', 'Container label')
    .option('--type <type>', 'Container node type', 'practice')
    .action(async (opts) => {
      try {
        await requireDiagram();
        const nodeIds = opts.ids.split(',').map((s: string) => s.trim());
        const type = opts.type.toLowerCase() as NodeType;

        if (!VALID_NODE_TYPES.includes(type)) {
          outputError('node.group', 'INVALID_NODE_TYPE', `Invalid type: ${opts.type}`, VALID_NODE_TYPES);
          return;
        }

        await dispatch(saveToHistory());
        await dispatch(groupNodesIntoContainer({ nodeIds, containerLabel: opts.label, containerType: type }));

        await autoSave(getFilePath);

        const d = await requireDiagram();
        const container = d.nodes[d.nodes.length - 1];
        outputSuccess('node.group', { containerId: container.id, label: container.label, children: nodeIds });
      } catch (e) {
        outputError('node.group', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  node
    .command('ungroup')
    .description('Ungroup a container node')
    .argument('<id>', 'Container node ID')
    .action(async (id) => {
      try {
        await requireDiagram();

        await dispatch(saveToHistory());
        await dispatch(ungroupContainer(id));

        await autoSave(getFilePath);

        outputSuccess('node.ungroup', { id, ungrouped: true });
      } catch (e) {
        outputError('node.ungroup', 'NO_DIAGRAM', (e as Error).message);
      }
    });
}
