import { Command } from 'commander';
import {
  NODE_TYPES,
  EDGE_TYPES_DETAILS,
  EDGE_TYPES_GROUPED,
  DIAGRAM_MODES,
  BRANDOM_COMPOSITION_RULES,
  COMMON_NODE_FIELDS,
  COMMON_EDGE_FIELDS,
  DIAGRAM_JSON_SCHEMA
} from '@pragma-graph/core';
import { outputSuccess, outputRaw } from '../output/formatter.js';

export function registerSchemaCommands(program: Command): void {
  const schema = program.command('schema').description('Type schema discovery (for LLM self-reference)');

  schema
    .command('all')
    .description('Print full schema (nodes, edges, modes, and Brandom-aware composition rules)')
    .action(() => {
      outputSuccess('schema.all', {
        nodeTypes: NODE_TYPES,
        // Legacy grouped shape — stable for existing consumers.
        edgeTypes: EDGE_TYPES_GROUPED,
        // New additive field — rich per-type semantics for Brandom-aware LLM use.
        edgeTypeDetails: EDGE_TYPES_DETAILS,
        diagramModes: DIAGRAM_MODES,
        brandomCompositionRules: BRANDOM_COMPOSITION_RULES,
        commonNodeFields: COMMON_NODE_FIELDS,
        commonEdgeFields: COMMON_EDGE_FIELDS
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
    .description('Print edge type schema (legacy grouped shape; use --details for per-type Brandom semantics)')
    .option('--details', 'Return the per-type metadata map (gloss, qualifier, source/target type, BSD ref, example) instead of the legacy grouped shape')
    .action((opts) => {
      if (opts.details) {
        outputSuccess('schema.edge-types', EDGE_TYPES_DETAILS);
      } else {
        outputSuccess('schema.edge-types', EDGE_TYPES_GROUPED);
      }
    });

  schema
    .command('modes')
    .description('Print diagram mode schema')
    .action(() => {
      outputSuccess('schema.modes', DIAGRAM_MODES);
    });

  schema
    .command('json-schema')
    .description('Print the formal JSON Schema (draft 2020-12) for diagram files')
    .action(() => {
      // Raw JSON document (not wrapped in the CLI envelope) so it can be
      // piped straight to a .schema.json file or a validator.
      outputRaw(JSON.stringify(DIAGRAM_JSON_SCHEMA, null, 2) + '\n');
    });

  schema
    .command('composition-rules')
    .description('Print the Brandom-canonical composition rules the `derive` verb recognises')
    .action(() => {
      outputSuccess('schema.composition-rules', BRANDOM_COMPOSITION_RULES);
    });
}
