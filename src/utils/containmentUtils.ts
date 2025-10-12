import type { Node, Point } from '../types/all';
import { getNodeDimensions } from './nodeUtils';

/**
 * Get all descendants of a node (BFS traversal)
 */
export const getDescendants = (nodes: Node[], nodeId: string): string[] => {
  const result: string[] = [];
  const queue = [nodeId];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);

    const node = nodes.find(n => n.id === current);
    if (node?.childIds) {
      result.push(...node.childIds);
      queue.push(...node.childIds);
    }
  }

  return result;
};

/**
 * Get all ancestors of a node (walk up parent chain)
 */
export const getAncestors = (nodes: Node[], nodeId: string): string[] => {
  const ancestors: string[] = [];
  let currentId: string | null | undefined = nodeId;
  const seen = new Set<string>();

  while (currentId) {
    if (seen.has(currentId)) break;
    seen.add(currentId);

    const node = nodes.find(n => n.id === currentId);
    if (!node?.parentId) break;
    ancestors.push(node.parentId);
    currentId = node.parentId;
  }

  return ancestors;
};

/**
 * Calculate absolute position of a node by walking up parent chain
 */
export const getAbsolutePosition = (nodes: Node[], nodeId: string): Point => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };

  const pos = { ...node.position };
  let currentId = node.parentId;
  const seen = new Set<string>();

  while (currentId) {
    if (seen.has(currentId)) break; // Prevent infinite loops
    seen.add(currentId);

    const parent = nodes.find(n => n.id === currentId);
    if (!parent) break;
    pos.x += parent.position.x;
    pos.y += parent.position.y;
    currentId = parent.parentId;
  }

  return pos;
};

/**
 * Convert absolute position to relative position within parent
 */
export const toRelativePosition = (
  nodes: Node[],
  nodeId: string,
  absolutePos: Point
): Point => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node?.parentId) return absolutePos;

  const parentAbsPos = getAbsolutePosition(nodes, node.parentId);
  return {
    x: absolutePos.x - parentAbsPos.x,
    y: absolutePos.y - parentAbsPos.y
  };
};

/**
 * Calculate bounding box for a container's children
 * Returns absolute coordinates
 */
export const calculateContainerBounds = (
  nodes: Node[],
  containerId: string
): { x: number; y: number; width: number; height: number } => {
  const container = nodes.find(n => n.id === containerId);
  if (!container?.childIds || container.childIds.length === 0) {
    // Empty container - return default size
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  // If manual size set, use it
  if (container.manualSize) {
    const containerAbsPos = getAbsolutePosition(nodes, containerId);
    return {
      x: containerAbsPos.x - container.manualSize.width / 2,
      y: containerAbsPos.y - container.manualSize.height / 2,
      width: container.manualSize.width,
      height: container.manualSize.height
    };
  }

  // Auto-calculate from children
  const padding = container.containerPadding ?? 20;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  container.childIds.forEach(childId => {
    const child = nodes.find(n => n.id === childId);
    if (!child) return;

    const childAbsPos = getAbsolutePosition(nodes, childId);
    const dims = getNodeDimensions(child);

    minX = Math.min(minX, childAbsPos.x - dims.width / 2);
    minY = Math.min(minY, childAbsPos.y - dims.height / 2);
    maxX = Math.max(maxX, childAbsPos.x + dims.width / 2);
    maxY = Math.max(maxY, childAbsPos.y + dims.height / 2);
  });

  // If no valid children found, return default
  if (!isFinite(minX)) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2
  };
};

/**
 * Check if a node or any of its ancestors are locked
 */
export const isNodeOrAncestorLocked = (nodes: Node[], nodeId: string): boolean => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return false;
  if (node.locked) return true;

  const ancestors = getAncestors(nodes, nodeId);
  return ancestors.some(ancestorId => {
    const ancestor = nodes.find(n => n.id === ancestorId);
    return ancestor?.locked === true;
  });
};

/**
 * Get all nodes in a lock group
 */
export const getLockGroupNodes = (nodes: Node[], lockGroupId: string): Node[] => {
  return nodes.filter(n => n.lockGroupId === lockGroupId);
};
