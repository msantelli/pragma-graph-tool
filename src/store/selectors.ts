import type { RootState } from './store';
import type { Node } from '../types/all';
import {
  getDescendants,
  getAncestors,
  getAbsolutePosition,
  calculateContainerBounds,
  isNodeOrAncestorLocked,
  getLockGroupNodes
} from '../utils/containmentUtils';

/**
 * v2.0 Redux Selectors for nested nodes and containment
 */

// Get all descendants of a node (BFS)
export const selectSubtree = (state: RootState, nodeId: string): Node[] => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  const descendantIds = getDescendants(nodes, nodeId);
  return nodes.filter(n => descendantIds.includes(n.id));
};

// Get all ancestors of a node (parent chain)
export const selectAncestors = (state: RootState, nodeId: string): Node[] => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  const ancestorIds = getAncestors(nodes, nodeId);
  return nodes.filter(n => ancestorIds.includes(n.id));
};

// Get absolute position of a node (cumulative through parent chain)
export const selectAbsolutePosition = (state: RootState, nodeId: string) => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  return getAbsolutePosition(nodes, nodeId);
};

// Get container bounds (auto-calculated or manual)
export const selectContainerBounds = (state: RootState, nodeId: string) => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  return calculateContainerBounds(nodes, nodeId);
};

// Check if node or any ancestor is locked
export const selectIsNodeOrAncestorLocked = (state: RootState, nodeId: string): boolean => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  return isNodeOrAncestorLocked(nodes, nodeId);
};

// Get all nodes in a lock group
export const selectLockGroupNodes = (state: RootState, lockGroupId: string): Node[] => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  return getLockGroupNodes(nodes, lockGroupId);
};

// Get all root nodes (no parent)
export const selectRootNodes = (state: RootState): Node[] => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  return nodes.filter(n => !n.parentId);
};

// Get all container nodes
export const selectContainerNodes = (state: RootState): Node[] => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  return nodes.filter(n => n.isContainer);
};

// Get children of a specific node
export const selectChildren = (state: RootState, nodeId: string): Node[] => {
  const nodes = state.diagram.currentDiagram?.nodes ?? [];
  const parent = nodes.find(n => n.id === nodeId);
  if (!parent?.childIds) return [];
  return nodes.filter(n => parent.childIds?.includes(n.id));
};
