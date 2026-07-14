/**
 * The single edge-geometry implementation shared by the Canvas renderer and
 * every exporter. Semantics are the Canvas's historical on-screen behavior
 * (the user-visible truth), pinned by tests/fidelity/geometry-unified.test.ts:
 *
 * - Parallel/opposite edges between the same — or nested-related — node pairs
 *   are grouped and fanned out over an 80px offset range, with a consistent
 *   group orientation derived from the canonical (first-sorted) edge.
 * - Connection points respect container bounds for nodes with children.
 * - labelPosition (start/middle/end) and the user's labelOffset are honored.
 */
import type { Node, Edge, Point } from './types.js';
import {
  getNodeDimensions,
  getNodeShape,
  toAbsolutePosition,
  getChildNodes,
  calculateContainerBounds
} from './nodeUtils.js';

const EDGE_OFFSET_RANGE = 80;
const STRAIGHT_LABEL_OFFSET = 12;
const CURVED_LABEL_OFFSET = 14;

export type EdgeGeometryType = 'straight' | 'curve' | 'loop';

export interface EdgeGeometry {
  type: EdgeGeometryType;
  start: Point;
  end: Point;
  control?: Point;
  control2?: Point;
  path: string;
  labelPosition: Point;
  labelAngle: number | null;
}

/** True when the nodes are identical or one contains the other (any depth). */
export function isNodeRelated(nodeId1: string, nodeId2: string, allNodes: Node[]): boolean {
  if (nodeId1 === nodeId2) return true;

  let current = allNodes.find(n => n.id === nodeId2);
  while (current && current.parentId) {
    if (current.parentId === nodeId1) return true;
    const pid = current.parentId;
    current = allNodes.find(n => n.id === pid);
  }

  current = allNodes.find(n => n.id === nodeId1);
  while (current && current.parentId) {
    if (current.parentId === nodeId2) return true;
    const pid = current.parentId;
    current = allNodes.find(n => n.id === pid);
  }

  return false;
}

export interface EdgeGroupPlacement {
  /** Edges sharing (related) endpoints with this one, sorted by id. */
  group: Edge[];
  /** This edge's index within the sorted group. */
  index: number;
  /** Orientation sign shared by the whole group (canonical-edge based). */
  sign: number;
}

/**
 * Group an edge with all edges running between the same or nested-related
 * endpoints (in either direction), with a stable order and a consistent
 * orientation sign. Shared by canvas offsets, SVG offsets, and TikZ bends.
 */
export function getEdgeGroupPlacement(currentEdge: Edge, allEdges: Edge[], allNodes: Node[]): EdgeGroupPlacement {
  const relatedEdges = allEdges.filter(edge => {
    const sourceRelated = isNodeRelated(edge.source, currentEdge.source, allNodes);
    const targetRelated = isNodeRelated(edge.target, currentEdge.target, allNodes);
    if (sourceRelated && targetRelated) return true;

    const sourceToTargetRelated = isNodeRelated(edge.source, currentEdge.target, allNodes);
    const targetToSourceRelated = isNodeRelated(edge.target, currentEdge.source, allNodes);
    return sourceToTargetRelated && targetToSourceRelated;
  });

  relatedEdges.sort((a, b) => a.id.localeCompare(b.id));
  const index = relatedEdges.findIndex(edge => edge.id === currentEdge.id);

  // Orientation from the canonical (first) edge so the whole group fans out
  // consistently; edges running counter to the canonical direction flip.
  const canonicalEdge = relatedEdges[0];
  const groupBaseSign = canonicalEdge.source < canonicalEdge.target ? 1 : -1;
  const isAligned = isNodeRelated(currentEdge.source, canonicalEdge.source, allNodes);
  const sign = isAligned ? groupBaseSign : -groupBaseSign;

  return { group: relatedEdges, index, sign };
}

/** Perpendicular pixel offset for this edge within its parallel group. */
export function getEdgeOffset(currentEdge: Edge, allEdges: Edge[], allNodes: Node[]): number {
  const { group, index, sign } = getEdgeGroupPlacement(currentEdge, allEdges, allNodes);
  const totalEdges = group.length;
  if (totalEdges <= 1) return 0;

  if (totalEdges === 2) {
    const baseOffset = index === 0 ? -EDGE_OFFSET_RANGE / 2 : EDGE_OFFSET_RANGE / 2;
    return baseOffset * sign;
  }

  const step = EDGE_OFFSET_RANGE / (totalEdges - 1);
  const baseOffset = (index - (totalEdges - 1) / 2) * step;
  return baseOffset * sign;
}

/**
 * Point on the node's visual boundary in the direction of targetPos.
 * Container nodes (with children) use their container bounds.
 */
export function getNodeConnectionPoint(node: Node, targetPos: Point, allNodes: Node[]): Point {
  const nodePos = toAbsolutePosition(node, allNodes);
  let { x: nodeX, y: nodeY } = nodePos;

  let dimensions = getNodeDimensions(node);

  const children = getChildNodes(node.id, allNodes);
  if (children.length > 0) {
    const bounds = calculateContainerBounds(children, allNodes);
    dimensions = {
      width: bounds.width,
      height: bounds.height,
      radius: Math.max(bounds.width, bounds.height) / 2
    };
    // calculateContainerBounds returns the center relative to the parent node
    nodeX += bounds.centerX;
    nodeY += bounds.centerY;
  }

  const { x: targetX, y: targetY } = targetPos;
  const dx = targetX - nodeX;
  const dy = targetY - nodeY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return { x: nodeX, y: nodeY };

  const normalizedDx = dx / distance;
  const normalizedDy = dy / distance;
  const shape = getNodeShape(node);

  let offsetX = 0;
  let offsetY = 0;

  switch (shape) {
    case 'ellipse': {
      const rx = dimensions.width / 2;
      const ry = dimensions.height / 2;
      const t = Math.atan2(normalizedDy * rx, normalizedDx * ry);
      offsetX = rx * Math.cos(t);
      offsetY = ry * Math.sin(t);
      break;
    }
    case 'rectangle': {
      const w = dimensions.width / 2;
      const h = dimensions.height / 2;
      if (Math.abs(normalizedDx) * h > Math.abs(normalizedDy) * w) {
        offsetX = normalizedDx > 0 ? w : -w;
        offsetY = normalizedDy * w / Math.abs(normalizedDx);
      } else {
        offsetX = normalizedDx * h / Math.abs(normalizedDy);
        offsetY = normalizedDy > 0 ? h : -h;
      }
      break;
    }
    case 'diamond': {
      const diamondRadius = dimensions.radius * 0.8;
      offsetX = normalizedDx * diamondRadius;
      offsetY = normalizedDy * diamondRadius;
      break;
    }
    default: {
      offsetX = normalizedDx * dimensions.radius;
      offsetY = normalizedDy * dimensions.radius;
      break;
    }
  }

  return { x: nodeX + offsetX, y: nodeY + offsetY };
}

function normalizeLabelAngle(angleDeg: number): number {
  let angle = angleDeg;
  if (angle > 180) angle -= 360;
  if (angle <= -180) angle += 360;
  if (angle > 90) angle -= 180;
  if (angle <= -90) angle += 180;
  return angle;
}

const labelT = (edge: Edge): number => {
  switch (edge.labelPosition) {
    case 'start': return 0.15;
    case 'end': return 0.85;
    case 'middle':
    default: return 0.5;
  }
};

const applyLabelOffset = (edge: Edge, base: Point): Point => ({
  x: base.x + (edge.labelOffset?.x ?? 0),
  y: base.y + (edge.labelOffset?.y ?? 0)
});

function computeLoopGeometry(edge: Edge, node: Node, allNodes: Node[]): EdgeGeometry {
  const dimensions = getNodeDimensions(node);
  const shape = getNodeShape(node);
  const pos = toAbsolutePosition(node, allNodes);

  let loopStartX: number;
  let loopStartY: number;
  let loopEndX: number;
  let loopEndY: number;

  if (shape === 'rectangle') {
    loopStartX = pos.x + dimensions.width / 2;
    loopStartY = pos.y - dimensions.height / 4;
    loopEndX = pos.x + dimensions.width / 2;
    loopEndY = pos.y + dimensions.height / 4;
  } else {
    const radius = dimensions.radius;
    loopStartX = pos.x + radius * 0.7;
    loopStartY = pos.y - radius * 0.7;
    loopEndX = pos.x + radius * 0.7;
    loopEndY = pos.y + radius * 0.7;
  }

  const loopSize = Math.max(dimensions.width, dimensions.height) * 0.8;
  const control = { x: loopStartX + loopSize, y: loopStartY };
  const control2 = { x: loopEndX + loopSize, y: loopEndY };
  const path = `M ${loopStartX} ${loopStartY} C ${control.x} ${control.y} ${control2.x} ${control2.y} ${loopEndX} ${loopEndY}`;

  const labelPosition = applyLabelOffset(edge, {
    x: pos.x + Math.max(dimensions.width, dimensions.height) * 0.8,
    y: pos.y - Math.max(dimensions.height, 40) * 0.6
  });

  return {
    type: 'loop',
    start: { x: loopStartX, y: loopStartY },
    end: { x: loopEndX, y: loopEndY },
    control,
    control2,
    path,
    labelPosition,
    labelAngle: null
  };
}

/**
 * Compute the full geometry (path, endpoints, control points, label
 * placement) for an edge. `sourceOverride`/`targetOverride` let the canvas
 * pass drag-preview node positions without mutating state.
 */
export function computeEdgeGeometry(
  edge: Edge,
  allNodes: Node[],
  allEdges: Edge[],
  sourceOverride?: Node,
  targetOverride?: Node
): EdgeGeometry | null {
  const sourceNode = sourceOverride || allNodes.find(n => n.id === edge.source);
  const targetNode = targetOverride || allNodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  if (edge.source === edge.target) {
    return computeLoopGeometry(edge, sourceNode, allNodes);
  }

  const sourcePos = toAbsolutePosition(sourceNode, allNodes);
  const targetPos = toAbsolutePosition(targetNode, allNodes);

  const offset = getEdgeOffset(edge, allEdges, allNodes);

  if (offset === 0) {
    const start = getNodeConnectionPoint(sourceNode, targetPos, allNodes);
    const end = getNodeConnectionPoint(targetNode, sourcePos, allNodes);
    const path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

    const t = labelT(edge);
    const labelX = start.x + (end.x - start.x) * t;
    const labelY = start.y + (end.y - start.y) * t;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;

    const labelPosition = applyLabelOffset(edge, {
      x: labelX + normalX * STRAIGHT_LABEL_OFFSET,
      y: labelY + normalY * STRAIGHT_LABEL_OFFSET
    });
    const labelAngle = normalizeLabelAngle((Math.atan2(dy, dx) * 180) / Math.PI);

    return { type: 'straight', start, end, path, labelPosition, labelAngle };
  }

  // Curved: control point perpendicular to the midpoint, connection points
  // aimed at the control so the curve leaves the node boundary cleanly.
  const midX = (sourcePos.x + targetPos.x) / 2;
  const midY = (sourcePos.y + targetPos.y) / 2;
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    const start = sourcePos;
    const end = targetPos;
    return {
      type: 'straight',
      start,
      end,
      path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      labelPosition: applyLabelOffset(edge, { x: midX, y: midY }),
      labelAngle: 0
    };
  }

  const perpX = -dy / length;
  const perpY = dx / length;
  const control = { x: midX + perpX * offset, y: midY + perpY * offset };

  const start = getNodeConnectionPoint(sourceNode, control, allNodes);
  const end = getNodeConnectionPoint(targetNode, control, allNodes);
  const path = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;

  const t = labelT(edge);
  const oneMinusT = 1 - t;
  const labelX =
    oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x;
  const labelY =
    oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y;

  const dxdt = 2 * oneMinusT * (control.x - start.x) + 2 * t * (end.x - control.x);
  const dydt = 2 * oneMinusT * (control.y - start.y) + 2 * t * (end.y - control.y);
  const tangentLength = Math.sqrt(dxdt * dxdt + dydt * dydt) || 1;
  const normalX = (-dydt / tangentLength) * Math.sign(offset || 1);
  const normalY = (dxdt / tangentLength) * Math.sign(offset || 1);

  const labelPosition = applyLabelOffset(edge, {
    x: labelX + normalX * CURVED_LABEL_OFFSET,
    y: labelY + normalY * CURVED_LABEL_OFFSET
  });
  const labelAngle = normalizeLabelAngle((Math.atan2(dydt, dxdt) * 180) / Math.PI);

  return { type: 'curve', start, end, control, path, labelPosition, labelAngle };
}
