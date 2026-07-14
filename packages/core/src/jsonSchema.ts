/**
 * JSON Schema (draft 2020-12) for the diagram file format.
 *
 * Mirrors types.ts and the semantics of validateDiagramImport: nodes/edges
 * are required; entryPoints/exitPoints/metadata are optional on import
 * (validateDiagramImport fills defaults). Emit with:
 *   pragma-cli schema json-schema > diagram.schema.json
 */

const NODE_TYPES = ['vocabulary', 'practice', 'test', 'operate', 'exit', 'custom'] as const;

const EDGE_TYPES = [
  'PV', 'VP', 'PP', 'VV',
  'PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec',
  'sequence', 'feedback', 'loop', 'exit', 'entry', 'test-pass', 'test-fail',
  'resultant', 'unmarked', 'custom'
] as const;

export const DIAGRAM_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://github.com/msantelli/pragma-graph-tool/diagram.schema.json',
  title: 'Pragma Graph Tool Diagram',
  type: 'object',
  required: ['nodes', 'edges'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    type: { enum: ['MUD', 'TOTE', 'HYBRID', 'GENERIC'] },
    nodes: { type: 'array', items: { $ref: '#/$defs/node' } },
    edges: { type: 'array', items: { $ref: '#/$defs/edge' } },
    entryPoints: { type: 'array', items: { $ref: '#/$defs/entryPoint' } },
    exitPoints: { type: 'array', items: { $ref: '#/$defs/exitPoint' } },
    metadata: {
      type: 'object',
      properties: {
        created: { type: 'string' },
        modified: { type: 'string' },
        exported: { type: 'string' },
        version: { type: 'string' },
        author: { type: 'string' },
        description: { type: 'string' }
      },
      additionalProperties: true
    }
  },
  additionalProperties: true,
  $defs: {
    point: {
      type: 'object',
      required: ['x', 'y'],
      properties: {
        x: { type: 'number' },
        y: { type: 'number' }
      },
      additionalProperties: false
    },
    nodeStyle: {
      type: 'object',
      properties: {
        fill: { type: 'string' },
        stroke: { type: 'string' },
        strokeWidth: { type: 'number' },
        fontSize: { type: 'number' },
        fontFamily: { type: 'string' },
        size: { enum: ['small', 'medium', 'large'] },
        backgroundColor: { type: 'string' },
        borderColor: { type: 'string' },
        textColor: { type: 'string' },
        shape: { enum: ['circle', 'rectangle', 'ellipse', 'diamond', 'hexagon', 'triangle', 'star'] },
        containerPadding: { type: 'number' },
        containerMinWidth: { type: 'number' },
        containerMinHeight: { type: 'number' }
      },
      additionalProperties: false
    },
    edgeStyle: {
      type: 'object',
      properties: {
        strokeStyle: { enum: ['solid', 'dashed', 'dotted'] },
        strokeWidth: { type: 'number' },
        color: { type: 'string' },
        arrowType: { enum: ['default', 'hollow', 'filled'] }
      },
      additionalProperties: false
    },
    node: {
      type: 'object',
      required: ['id', 'type', 'position', 'label'],
      properties: {
        id: { type: 'string', minLength: 1 },
        type: { enum: [...NODE_TYPES] },
        position: { $ref: '#/$defs/point' },
        label: { type: 'string', minLength: 1 },
        style: { $ref: '#/$defs/nodeStyle' },
        parentId: { type: ['string', 'null'] },
        subscript: { type: 'string' },
        secondaryLabel: { type: 'string' },
        subtype: { type: 'string' },
        condition: { type: 'string' },
        evaluationFunction: { type: 'string' },
        operations: { type: 'array', items: { type: 'string' } },
        subTOTEs: { type: 'array', items: { type: 'string' } },
        customLabel: { type: 'string' }
      },
      additionalProperties: false
    },
    edge: {
      type: 'object',
      required: ['id', 'type'],
      properties: {
        id: { type: 'string', minLength: 1 },
        source: { type: 'string' },
        target: { type: 'string' },
        type: { enum: [...EDGE_TYPES] },
        label: { type: 'string' },
        style: { $ref: '#/$defs/edgeStyle' },
        isResultant: { type: 'boolean' },
        resultantFrom: { type: 'array', items: { type: 'string' } },
        labelPosition: { enum: ['start', 'middle', 'end'] },
        labelOffset: { $ref: '#/$defs/point' },
        orderNumber: { type: 'number' },
        showLabelBackground: { type: 'boolean' }
      },
      // Entry/exit edges may omit source/target (validateDiagramImport parity)
      if: { properties: { type: { not: { enum: ['entry', 'exit'] } } } },
      then: { required: ['id', 'type', 'source', 'target'] },
      additionalProperties: false
    },
    entryPoint: {
      type: 'object',
      required: ['id', 'position', 'targetNodeId'],
      properties: {
        id: { type: 'string', minLength: 1 },
        position: { $ref: '#/$defs/point' },
        targetNodeId: { type: 'string', minLength: 1 },
        label: { type: 'string' }
      },
      additionalProperties: false
    },
    exitPoint: {
      type: 'object',
      required: ['id', 'position', 'sourceNodeId'],
      properties: {
        id: { type: 'string', minLength: 1 },
        position: { $ref: '#/$defs/point' },
        sourceNodeId: { type: 'string', minLength: 1 },
        label: { type: 'string' }
      },
      additionalProperties: false
    }
  }
} as const;
