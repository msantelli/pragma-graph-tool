/**
 * Canvas-side adapter over the unified core edge geometry
 * (packages/core/src/edgeGeometry.ts). The exporters consume the exact same
 * functions, so what the canvas renders is what exports produce. This
 * wrapper only preserves the old non-null return shape for the D3 call
 * sites (missing nodes render as an empty path instead of null).
 */
import { computeEdgeGeometry } from '@pragma-graph/core';
import type { Node, Edge } from '@pragma-graph/core';

export const getEdgeGeometry = (
  edge: Edge,
  allNodes: Node[],
  allEdges: Edge[],
  sourceOverride?: Node,
  targetOverride?: Node
) =>
  computeEdgeGeometry(edge, allNodes, allEdges, sourceOverride, targetOverride) ?? {
    type: 'straight' as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    path: '',
    labelPosition: { x: 0, y: 0 },
    labelAngle: 0
  };
