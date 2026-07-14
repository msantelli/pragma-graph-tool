// Permissive Brandom/Miller-aware validator for Diagrams.
//
// "Permissive" means: this module never refuses any edge or mutates the
// diagram. It reads the diagram and reports structural advice. Callers
// (CLI `check`, GUI panels) decide what to do with the advice.
//
// See also: derive.ts for the strict Brandom-canonical composition engine.

import type {
  Diagram,
  Edge,
  Node,
  EdgeType,
  NodeType,
  EntryPoint,
  ExitPoint
} from './types.js';

// --- Edge-type / node-type rule tables ----------------------------------

// Returns the dual MUR for a given (sourceType, targetType) pair, ignoring
// qualifier. Used both for autodetect and for the NODE_TYPE_MISMATCH suggestion.
export function expectedBasicMUR(
  sourceType: NodeType,
  targetType: NodeType
): 'PV' | 'VP' | 'PP' | 'VV' | null {
  if (sourceType === 'practice' && targetType === 'vocabulary') return 'PV';
  if (sourceType === 'vocabulary' && targetType === 'practice') return 'VP';
  if (sourceType === 'practice' && targetType === 'practice') return 'PP';
  if (sourceType === 'vocabulary' && targetType === 'vocabulary') return 'VV';
  return null;
}

// Promoted from Canvas.tsx (was an inner helper). Single source of truth.
export function autoDetectMUDEdgeType(
  sourceNode: Node,
  targetNode: Node
): EdgeType {
  return expectedBasicMUR(sourceNode.type, targetNode.type) ?? 'VV';
}

export function autoDetectTOTEEdgeType(
  sourceNode: Node,
  targetNode: Node
): EdgeType {
  if (sourceNode.type === 'test') {
    if (targetNode.type === 'operate') return 'test-fail';
    if (
      targetNode.type === 'exit' ||
      targetNode.type === 'practice' ||
      targetNode.type === 'test'
    ) {
      return 'test-pass';
    }
  } else if (sourceNode.type === 'operate') {
    if (targetNode.type === 'test') return 'sequence';
  }
  return 'sequence';
}

// Maps a (possibly qualified) MUD edge type to its bare basic counterpart.
// E.g. 'PV-suff' → 'PV'; 'sequence' → null (not an MUD basic).
export function toBasicMUD(
  edgeType: EdgeType
): 'PV' | 'VP' | 'PP' | 'VV' | null {
  switch (edgeType) {
    case 'PV':
    case 'PV-suff':
    case 'PV-nec':
      return 'PV';
    case 'VP':
    case 'VP-suff':
    case 'VP-nec':
      return 'VP';
    case 'PP':
    case 'PP-suff':
    case 'PP-nec':
      return 'PP';
    case 'VV':
    case 'VV-suff':
    case 'VV-nec':
      return 'VV';
    default:
      return null;
  }
}

// --- Validation result types --------------------------------------------

export type Severity = 'warning' | 'suggestion';

export interface ValidationIssue {
  severity: Severity;
  code: ValidationCode;
  message: string;
  affectedNodes?: string[];
  affectedEdges?: string[];
  suggestion?: string;
}

export type ValidationCode =
  | 'NODE_TYPE_MISMATCH'
  | 'RESULTANT_BASIS_MISSING'
  | 'RESULTANT_BASIS_DANGLING'
  | 'RESULTANT_BASIS_INCONSISTENT'
  | 'DANGLING_EDGE_ENDPOINT'
  | 'DANGLING_PARENT'
  | 'DANGLING_ENTRY_TARGET'
  | 'DANGLING_EXIT_SOURCE'
  | 'TOTE_NO_TEST'
  | 'TOTE_OPERATE_NO_FEEDBACK'
  | 'ENTRY_POINT_UNCONNECTED'
  | 'EXIT_POINT_UNCONNECTED';

// --- Core validator -----------------------------------------------------

/**
 * Run all permissive checks against a diagram. Returns a list of
 * advisory issues — never throws on diagram content, never mutates.
 */
export function validateDiagram(diagram: Diagram): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeById = new Map<string, Node>(diagram.nodes.map(n => [n.id, n]));
  const edgeById = new Map<string, Edge>(diagram.edges.map(e => [e.id, e]));

  issues.push(...checkEdgeNodeTypes(diagram.edges, nodeById));
  issues.push(...checkResultantBases(diagram.edges, edgeById));
  issues.push(...checkDanglingReferences(diagram.nodes, diagram.edges, diagram.entryPoints, diagram.exitPoints, nodeById));
  if (diagram.type === 'TOTE' || diagram.type === 'HYBRID') {
    issues.push(...checkTOTEStructure(diagram.nodes, diagram.edges));
  }

  return issues;
}

// --- Individual checks --------------------------------------------------

function checkEdgeNodeTypes(
  edges: Edge[],
  nodeById: Map<string, Node>
): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  for (const edge of edges) {
    const basic = toBasicMUD(edge.type);
    if (!basic) continue;
    if (edge.isResultant) continue; // resultants are checked separately
    const src = nodeById.get(edge.source);
    const tgt = nodeById.get(edge.target);
    if (!src || !tgt) continue; // covered by checkDanglingReferences

    // Only check when both endpoints are MUD-typed (vocab/practice).
    if (src.type !== 'vocabulary' && src.type !== 'practice') continue;
    if (tgt.type !== 'vocabulary' && tgt.type !== 'practice') continue;

    const expected = expectedBasicMUR(src.type, tgt.type);
    if (expected && expected !== basic) {
      out.push({
        severity: 'warning',
        code: 'NODE_TYPE_MISMATCH',
        message: `Edge "${edge.label ?? edge.type}" is declared ${edge.type} but connects ${src.type} → ${tgt.type}, which would canonically be ${expected}.`,
        affectedEdges: [edge.id],
        affectedNodes: [src.id, tgt.id],
        suggestion: expected
      });
    }
  }
  return out;
}

function checkResultantBases(
  edges: Edge[],
  edgeById: Map<string, Edge>
): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  for (const edge of edges) {
    if (!edge.isResultant) continue;
    const basis = edge.resultantFrom ?? [];
    if (basis.length === 0) {
      out.push({
        severity: 'warning',
        code: 'RESULTANT_BASIS_MISSING',
        message: `Edge "${edge.label ?? edge.id}" is marked as resultant but has no \`resultantFrom\` basis recorded.`,
        affectedEdges: [edge.id]
      });
      continue;
    }
    const dangling = basis.filter(id => !edgeById.has(id));
    if (dangling.length > 0) {
      out.push({
        severity: 'warning',
        code: 'RESULTANT_BASIS_DANGLING',
        message: `Resultant edge "${edge.label ?? edge.id}" references basis edges that don't exist: ${dangling.join(', ')}.`,
        affectedEdges: [edge.id, ...dangling]
      });
      continue;
    }
    // Permissive composability: the basis edges must form a path that
    // covers the resultant's source→target endpoints. We check the set
    // of node endpoints visited by basis edges includes both source and target.
    const visited = new Set<string>();
    for (const bid of basis) {
      const b = edgeById.get(bid)!;
      visited.add(b.source);
      visited.add(b.target);
    }
    if (!visited.has(edge.source) || !visited.has(edge.target)) {
      out.push({
        severity: 'suggestion',
        code: 'RESULTANT_BASIS_INCONSISTENT',
        message: `Resultant edge "${edge.label ?? edge.id}" has a \`resultantFrom\` basis whose edges do not visit both endpoints of the resultant. The basis may not actually compose to this resultant.`,
        affectedEdges: [edge.id, ...basis]
      });
    }
  }
  return out;
}

function checkDanglingReferences(
  nodes: Node[],
  edges: Edge[],
  entryPoints: EntryPoint[],
  exitPoints: ExitPoint[],
  nodeById: Map<string, Node>
): ValidationIssue[] {
  const out: ValidationIssue[] = [];

  for (const node of nodes) {
    if (node.parentId && !nodeById.has(node.parentId)) {
      out.push({
        severity: 'warning',
        code: 'DANGLING_PARENT',
        message: `Node "${node.label}" references a parent ${node.parentId} that doesn't exist.`,
        affectedNodes: [node.id]
      });
    }
  }

  for (const edge of edges) {
    if (!nodeById.has(edge.source)) {
      out.push({
        severity: 'warning',
        code: 'DANGLING_EDGE_ENDPOINT',
        message: `Edge ${edge.id} has source ${edge.source} which is not a node.`,
        affectedEdges: [edge.id]
      });
    }
    if (!nodeById.has(edge.target)) {
      out.push({
        severity: 'warning',
        code: 'DANGLING_EDGE_ENDPOINT',
        message: `Edge ${edge.id} has target ${edge.target} which is not a node.`,
        affectedEdges: [edge.id]
      });
    }
  }

  for (const ep of entryPoints) {
    if (!nodeById.has(ep.targetNodeId)) {
      out.push({
        severity: 'warning',
        code: 'DANGLING_ENTRY_TARGET',
        message: `Entry point ${ep.id} targets node ${ep.targetNodeId} which doesn't exist.`,
        affectedNodes: [ep.targetNodeId]
      });
    }
  }
  for (const xp of exitPoints) {
    if (!nodeById.has(xp.sourceNodeId)) {
      out.push({
        severity: 'warning',
        code: 'DANGLING_EXIT_SOURCE',
        message: `Exit point ${xp.id} sources from node ${xp.sourceNodeId} which doesn't exist.`,
        affectedNodes: [xp.sourceNodeId]
      });
    }
  }

  return out;
}

function checkTOTEStructure(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const tests = nodes.filter(n => n.type === 'test');
  const operates = nodes.filter(n => n.type === 'operate');

  if (tests.length === 0 && operates.length > 0) {
    out.push({
      severity: 'warning',
      code: 'TOTE_NO_TEST',
      message: 'TOTE diagram has Operate nodes but no Test node. A well-formed TOTE has at least one Test.',
      affectedNodes: operates.map(n => n.id)
    });
  }

  // Each Operate should have at least one outgoing edge whose target is a Test.
  for (const op of operates) {
    const outEdges = edges.filter(e => e.source === op.id);
    const hasFeedbackToTest = outEdges.some(e => {
      const tgt = nodes.find(n => n.id === e.target);
      return tgt?.type === 'test';
    });
    if (!hasFeedbackToTest) {
      out.push({
        severity: 'suggestion',
        code: 'TOTE_OPERATE_NO_FEEDBACK',
        message: `Operate "${op.label}" has no outgoing edge to a Test node. Miller's TOTE cycle expects feedback from Operate back to Test.`,
        affectedNodes: [op.id]
      });
    }
  }

  return out;
}
