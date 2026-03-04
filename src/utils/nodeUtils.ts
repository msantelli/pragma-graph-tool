import type { Node, Point } from '../types/all';

const DEFAULT_NODE_COLORS: Record<string, { background: string; border: string }> = {
  vocabulary: { background: '#FFFFFF', border: '#333333' },
  practice: { background: '#FFFFFF', border: '#333333' },
  test: { background: '#FFFFFF', border: '#333333' },
  operate: { background: '#FFFFFF', border: '#333333' },
  exit: { background: '#FFFFFF', border: '#333333' },
  custom: { background: '#F5F5F5', border: '#555555' }
};

const normalizeHexColor = (value: string | undefined, fallback: string): string => {
  const source = (value ?? fallback).trim();

  if (source.startsWith('#')) {
    let hex = source.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(ch => ch + ch).join('');
    }
    if (hex.length === 6) {
      return `#${hex.toUpperCase()}`;
    }
  }

  const rgbMatch = source.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1, 4).map(component => {
      const parsed = parseInt(component, 10);
      return Math.min(255, Math.max(0, parsed));
    });

    const hex = [r, g, b]
      .map(component => component.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    return `#${hex}`;
  }

  const fallbackHex = fallback.startsWith('#') ? fallback : `#${fallback}`;
  return fallbackHex.slice(0, 7).padEnd(7, '0').toUpperCase();
};

export const getNodeColors = (node: Node) => {
  const defaults = DEFAULT_NODE_COLORS[node.type] || DEFAULT_NODE_COLORS.vocabulary;
  return {
    background: node.style?.backgroundColor || defaults.background,
    border: node.style?.borderColor || defaults.border
  };
};

export const getNodeFillColor = (node: Node): string => {
  const defaults = DEFAULT_NODE_COLORS[node.type] || DEFAULT_NODE_COLORS.vocabulary;
  return normalizeHexColor(node.style?.backgroundColor, defaults.background);
};

export const getNodeStrokeColor = (node: Node): string => {
  const defaults = DEFAULT_NODE_COLORS[node.type] || DEFAULT_NODE_COLORS.vocabulary;
  return normalizeHexColor(node.style?.borderColor, defaults.border);
};

export const getNodeTextColor = (node: Node): string => normalizeHexColor(node.style?.textColor, '#333333');

export const getNodeShape = (node: Node): string => {
  if (node.style?.shape) {
    return node.style.shape;
  }

  const defaultShapes = {
    vocabulary: 'ellipse',
    practice: 'rectangle',
    test: 'diamond',
    operate: 'rectangle',
    exit: 'rectangle',
    custom: 'circle'
  };

  return defaultShapes[node.type] || 'circle';
};

export const getNodeDimensions = (node: Node) => {
  const size = node.style?.size || 'medium';
  const sizeMultiplier = size === 'small' ? 0.8 : size === 'large' ? 1.3 : 1;
  const shape = getNodeShape(node);

  if (shape === 'diamond' || node.type === 'test') {
    const baseSize = 70;
    const adjustedSize = Math.round(baseSize * sizeMultiplier);
    return {
      width: adjustedSize,
      height: adjustedSize,
      radius: adjustedSize / 2
    };
  } else if (shape === 'circle') {
    const baseRadius = 40;
    const adjustedRadius = Math.round(baseRadius * sizeMultiplier);
    return {
      width: adjustedRadius * 2,
      height: adjustedRadius * 2,
      radius: adjustedRadius
    };
  } else {
    const baseWidth = 100;
    const baseHeight = 50;
    return {
      width: Math.round(baseWidth * sizeMultiplier),
      height: Math.round(baseHeight * sizeMultiplier),
      radius: Math.round(25 * sizeMultiplier)
    };
  }
};

export const getNodeFontSize = (node: Node): number => {
  if (node.style?.fontSize) {
    return node.style.fontSize;
  }

  const size = node.style?.size || 'medium';
  switch (size) {
    case 'small':
      return 12;
    case 'large':
      return 18;
    default:
      return 14;
  }
};

// ============================================
// Nesting and Position Utilities
// ============================================

/**
 * Convert a node's position to absolute canvas coordinates.
 * If the node has a parent, recursively adds parent positions.
 */
export const toAbsolutePosition = (node: Node, allNodes: Node[]): Point => {
  if (!node.parentId) {
    return node.position;
  }

  const parent = allNodes.find(n => n.id === node.parentId);
  if (!parent) {
    return node.position;
  }

  const parentAbsolute = toAbsolutePosition(parent, allNodes);
  return {
    x: parentAbsolute.x + node.position.x,
    y: parentAbsolute.y + node.position.y
  };
};

/**
 * Convert an absolute canvas position to a position relative to a parent node.
 */
export const toRelativePosition = (absolutePos: Point, parent: Node, allNodes: Node[]): Point => {
  const parentAbsolute = toAbsolutePosition(parent, allNodes);
  return {
    x: absolutePos.x - parentAbsolute.x,
    y: absolutePos.y - parentAbsolute.y
  };
};

/**
 * Get all direct children of a node.
 */
export const getChildNodes = (parentId: string, allNodes: Node[]): Node[] => {
  return allNodes.filter(n => n.parentId === parentId);
};

/**
 * Get all descendants of a node (children, grandchildren, etc.).
 */
export const getAllDescendants = (nodeId: string, allNodes: Node[]): Node[] => {
  const children = getChildNodes(nodeId, allNodes);
  const grandchildren = children.flatMap(child => getAllDescendants(child.id, allNodes));
  return [...children, ...grandchildren];
};

/**
 * Check if a node has any children.
 */
export const hasChildren = (nodeId: string, allNodes: Node[]): boolean => {
  return allNodes.some(n => n.parentId === nodeId);
};

/**
 * Get the nesting depth of a node (0 = top-level, 1 = child, 2 = grandchild).
 */
export const getNestingDepth = (node: Node, allNodes: Node[]): number => {
  if (!node.parentId) return 0;
  const parent = allNodes.find(n => n.id === node.parentId);
  if (!parent) return 0;
  return 1 + getNestingDepth(parent, allNodes);
};

/**
 * Calculate the bounding box needed to contain all children of a node.
 * Returns dimensions and center offset suitable for a container background.
 */
export const calculateContainerBounds = (
  children: Node[],
  _allNodes: Node[],
  padding: number = 40
): { width: number; height: number; centerX: number; centerY: number } => {
  if (children.length === 0) {
    return { width: 150, height: 100, centerX: 0, centerY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  children.forEach(child => {
    // Children positions are relative to parent, so we use them directly
    const dims = getNodeDimensions(child);
    const halfW = dims.width / 2;
    const halfH = dims.height / 2;

    minX = Math.min(minX, child.position.x - halfW);
    minY = Math.min(minY, child.position.y - halfH);
    maxX = Math.max(maxX, child.position.x + halfW);
    maxY = Math.max(maxY, child.position.y + halfH);
  });

  // Center of the bounding box in parent's local coordinate space
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    width: Math.max(150, maxX - minX + padding * 2),
    height: Math.max(100, maxY - minY + padding * 2),
    centerX,
    centerY
  };
};

/**
 * Check if a point (in absolute coordinates) is inside a node's bounds.
 */
export const isPointInsideNode = (point: Point, node: Node, allNodes: Node[]): boolean => {
  const absolutePos = toAbsolutePosition(node, allNodes);
  const dims = getNodeDimensions(node);

  // For containers, use the container bounds
  const children = getChildNodes(node.id, allNodes);
  if (children.length > 0) {
    const containerBounds = calculateContainerBounds(children, allNodes);
    const halfW = containerBounds.width / 2;
    const halfH = containerBounds.height / 2;
    return (
      point.x >= absolutePos.x - halfW &&
      point.x <= absolutePos.x + halfW &&
      point.y >= absolutePos.y - halfH &&
      point.y <= absolutePos.y + halfH
    );
  }

  // For regular nodes, use their dimensions
  const halfW = dims.width / 2;
  const halfH = dims.height / 2;
  return (
    point.x >= absolutePos.x - halfW &&
    point.x <= absolutePos.x + halfW &&
    point.y >= absolutePos.y - halfH &&
    point.y <= absolutePos.y + halfH
  );
};

/**
 * Check if a node can be dropped onto a target as a child.
 * Validates: no cycles, max depth of 4, and target isn't the node itself.
 */
export const isValidDropTarget = (
  draggedNodeId: string,
  targetNodeId: string,
  allNodes: Node[]
): boolean => {
  // Can't drop on self
  if (draggedNodeId === targetNodeId) return false;

  const draggedNode = allNodes.find(n => n.id === draggedNodeId);
  const targetNode = allNodes.find(n => n.id === targetNodeId);
  if (!draggedNode || !targetNode) return false;

  // Can't drop onto own descendant (would create cycle)
  const descendants = getAllDescendants(draggedNodeId, allNodes);
  if (descendants.some(d => d.id === targetNodeId)) return false;

  // Check max depth: target depth + dragged subtree depth + 1 <= 4
  const targetDepth = getNestingDepth(targetNode, allNodes);

  const getSubtreeDepth = (nodeId: string): number => {
    const children = getChildNodes(nodeId, allNodes);
    if (children.length === 0) return 0;
    return 1 + Math.max(...children.map(c => getSubtreeDepth(c.id)));
  };
  const subtreeDepth = getSubtreeDepth(draggedNodeId);

  return targetDepth + 1 + subtreeDepth <= 4;
};

/**
 * Find the topmost container node at a given absolute position.
 * Used for determining drop targets when dragging.
 * Excludes the dragged node and its descendants.
 */
export const findContainerAtPosition = (
  point: Point,
  allNodes: Node[],
  excludeNodeId?: string
): Node | null => {
  // Get nodes that could be containers (exclude the dragged node and its descendants)
  const excludeIds = new Set<string>();
  if (excludeNodeId) {
    excludeIds.add(excludeNodeId);
    getAllDescendants(excludeNodeId, allNodes).forEach(d => excludeIds.add(d.id));
  }

  const candidates = allNodes.filter(n => !excludeIds.has(n.id));

  // Check from deepest to shallowest (so we find the innermost container)
  const sorted = [...candidates].sort((a, b) => {
    return getNestingDepth(b, allNodes) - getNestingDepth(a, allNodes);
  });

  for (const node of sorted) {
    if (isPointInsideNode(point, node, allNodes)) {
      return node;
    }
  }

  return null;
};

/**
 * Sort nodes for rendering: parents before children, maintaining depth order.
 * This ensures containers are rendered before their children.
 */
export const sortNodesForRendering = (nodes: Node[]): Node[] => {
  const result: Node[] = [];
  const added = new Set<string>();

  const addWithChildren = (node: Node) => {
    if (added.has(node.id)) return;
    added.add(node.id);
    result.push(node);

    // Add children after parent
    const children = nodes.filter(n => n.parentId === node.id);
    children.forEach(addWithChildren);
  };

  // Start with top-level nodes
  const topLevel = nodes.filter(n => !n.parentId);
  topLevel.forEach(addWithChildren);

  // Add any orphaned nodes (parent was deleted but child remains)
  nodes.forEach(n => {
    if (!added.has(n.id)) {
      result.push(n);
    }
  });

  return result;
};
