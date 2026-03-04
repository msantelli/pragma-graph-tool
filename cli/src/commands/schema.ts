import { Command } from 'commander';
import { outputSuccess } from '../output/formatter.js';

const NODE_TYPES = {
  vocabulary: {
    shape: 'ellipse',
    subtypes: ['base', 'meta', 'modal', 'normative'],
    description: 'Linguistic/conceptual vocabularies (Brandom)'
  },
  practice: {
    shape: 'rounded rectangle',
    subtypes: ['autonomous', 'dependent', 'algorithmic'],
    description: 'Abilities, skills, or behavioral patterns (Brandom)'
  },
  test: {
    shape: 'diamond',
    extraFields: ['condition', 'evaluationFunction'],
    description: 'Decision points in TOTE cycles (Miller et al.)'
  },
  operate: {
    shape: 'rectangle',
    extraFields: ['operations', 'subTOTEs'],
    description: 'Actions in TOTE cycles (Miller et al.)'
  },
  exit: {
    shape: 'rectangle',
    description: 'Exit nodes for TOTE cycles'
  },
  custom: {
    shape: 'circle',
    extraFields: ['customLabel'],
    description: 'Generic custom node'
  }
};

const EDGE_TYPES = {
  MUD: {
    basic: ['PV', 'VP', 'PP', 'VV'],
    qualified: ['PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec'],
    description: 'Meaning-use relations between vocabularies and practices'
  },
  TOTE: {
    types: ['sequence', 'feedback', 'loop', 'exit', 'entry', 'test-pass', 'test-fail'],
    description: 'Control flow in Test-Operate-Test-Exit cycles'
  },
  other: {
    types: ['resultant', 'unmarked', 'custom'],
    description: 'Generic edge types available in all modes'
  }
};

const DIAGRAM_MODES = {
  MUD: {
    tools: ['select', 'vocabulary', 'practice', 'edge'],
    description: 'Meaning-Use Diagram mode (Brandom, Between Saying and Doing)'
  },
  TOTE: {
    tools: ['select', 'test', 'operate', 'edge', 'entry', 'exit'],
    description: 'TOTE Cycle mode (Miller et al., Plans and the Structure of Behavior)'
  },
  HYBRID: {
    tools: ['select', 'vocabulary', 'practice', 'test', 'operate', 'edge', 'entry', 'exit'],
    description: 'Combined MUD + TOTE elements'
  },
  GENERIC: {
    tools: ['select', 'custom', 'edge'],
    description: 'Generic graph with custom shapes and labels'
  }
};

export function registerSchemaCommands(program: Command): void {
  const schema = program.command('schema').description('Type schema discovery (for LLM self-reference)');

  schema
    .command('all')
    .description('Print full schema')
    .action(() => {
      outputSuccess('schema.all', {
        nodeTypes: NODE_TYPES,
        edgeTypes: EDGE_TYPES,
        diagramModes: DIAGRAM_MODES,
        commonNodeFields: {
          id: 'string (auto-generated UUID)',
          type: 'NodeType',
          label: 'string',
          position: '{ x: number, y: number }',
          parentId: 'string | null (for nesting)',
          subscript: 'string (optional)',
          secondaryLabel: 'string (optional)',
          style: 'NodeStyle (optional)'
        },
        commonEdgeFields: {
          id: 'string (auto-generated UUID)',
          source: 'string (node ID)',
          target: 'string (node ID)',
          type: 'EdgeType',
          label: 'string (optional)',
          isResultant: 'boolean (optional, renders dashed)',
          labelPosition: "'start' | 'middle' | 'end' (optional)",
          orderNumber: 'number (optional, prefix label with N:)'
        }
      });
    });

  schema
    .command('node-types')
    .description('Print node type schema')
    .action(() => {
      outputSuccess('schema.node-types', NODE_TYPES);
    });

  schema
    .command('edge-types')
    .description('Print edge type schema')
    .action(() => {
      outputSuccess('schema.edge-types', EDGE_TYPES);
    });

  schema
    .command('modes')
    .description('Print diagram mode schema')
    .action(() => {
      outputSuccess('schema.modes', DIAGRAM_MODES);
    });
}
