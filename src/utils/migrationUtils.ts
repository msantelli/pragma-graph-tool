import type { Diagram, Node } from '../types/all';

export const CURRENT_SCHEMA_VERSION = '2.0';

/**
 * Migrates a diagram from v1.x to v2.0 schema
 * Adds containment, locking, and anchor fields with sensible defaults
 */
export const migrateToV2 = (diagram: Diagram): Diagram => {
  // Check if already v2
  if (diagram.metadata?.version === '2.0') return diagram;

  return {
    ...diagram,
    nodes: diagram.nodes.map(node => ({
      ...node,
      // Containment fields
      parentId: node.parentId ?? null,
      childIds: node.childIds ?? [],
      // Lock fields
      locked: node.locked ?? false,
      lockGroupId: node.lockGroupId ?? undefined,
      // Container fields
      isContainer: node.isContainer ?? false,
      containerPadding: node.containerPadding ?? 20,
      manualSize: node.manualSize ?? undefined
    })),
    edges: diagram.edges.map(edge => ({
      ...edge,
      // Anchor fields default to 'auto' for backward compatibility
      sourceAnchor: edge.sourceAnchor ?? 'auto',
      targetAnchor: edge.targetAnchor ?? 'auto',
      labelOffset: edge.labelOffset ?? undefined
    })),
    metadata: {
      ...diagram.metadata,
      version: '2.0'
    }
  };
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a v2.0 diagram for structural integrity
 * Checks for circular references, orphaned nodes, and consistency
 */
export const validateDiagramV2 = (diagram: Diagram): ValidationResult => {
  const errors: string[] = [];

  // Check for circular parent references
  const visited = new Set<string>();
  const checkCycle = (nodeId: string, path: Set<string>) => {
    if (path.has(nodeId)) {
      errors.push(
        `Circular parent reference detected: ${Array.from(path).join(' → ')} → ${nodeId}`
      );
      return;
    }
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = diagram.nodes.find(n => n.id === nodeId);
    if (node?.parentId) {
      checkCycle(node.parentId, new Set([...path, nodeId]));
    }
  };

  diagram.nodes.forEach(node => checkCycle(node.id, new Set()));

  // Validate parent-child consistency
  diagram.nodes.forEach(node => {
    if (node.parentId) {
      const parent = diagram.nodes.find(n => n.id === node.parentId);
      if (!parent) {
        errors.push(`Node ${node.id} references non-existent parent ${node.parentId}`);
      } else if (!parent.childIds?.includes(node.id)) {
        errors.push(
          `Parent ${node.parentId} does not list child ${node.id} in childIds`
        );
      }
    }

    // Validate childIds point to actual nodes
    if (node.childIds) {
      node.childIds.forEach(childId => {
        const child = diagram.nodes.find(n => n.id === childId);
        if (!child) {
          errors.push(`Node ${node.id} lists non-existent child ${childId}`);
        } else if (child.parentId !== node.id) {
          errors.push(
            `Child ${childId} does not have parent ${node.id} set in parentId`
          );
        }
      });
    }
  });

  // Validate no self-parenting
  diagram.nodes.forEach(node => {
    if (node.parentId === node.id) {
      errors.push(`Node ${node.id} has itself as parent`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Helper function to get all descendants of a node (BFS)
 */
export const getDescendants = (nodes: Node[], nodeId: string): string[] => {
  const result: string[] = [];
  const queue = [nodeId];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (seen.has(current)) continue; // Prevent infinite loops
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
 * Helper function to get all ancestors of a node
 */
export const getAncestors = (nodes: Node[], nodeId: string): string[] => {
  const ancestors: string[] = [];
  let currentId: string | null | undefined = nodeId;
  const seen = new Set<string>();

  while (currentId) {
    if (seen.has(currentId)) break; // Prevent infinite loops
    seen.add(currentId);

    const node = nodes.find(n => n.id === currentId);
    if (!node?.parentId) break;
    ancestors.push(node.parentId);
    currentId = node.parentId;
  }

  return ancestors;
};
