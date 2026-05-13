import { Command } from 'commander';
import { outputSuccess } from '../output/formatter.js';

// --- Node type metadata ---
// Each entry: shape, default subtypes, optional extra fields, semantic gloss,
// and a canonical BSD/Miller reference.

interface NodeTypeMeta {
  shape: string;
  subtypes?: string[];
  extraFields?: string[];
  gloss: string;
  description: string;
  bsdReference?: string;
}

const NODE_TYPES: Record<string, NodeTypeMeta> = {
  vocabulary: {
    shape: 'ellipse',
    subtypes: ['base', 'meta', 'modal', 'normative'],
    gloss: 'A set of words/expressions used in a discursive practice.',
    description: 'Linguistic/conceptual vocabularies (Brandom)',
    bsdReference: 'BSD ch.1-2'
  },
  practice: {
    shape: 'rounded rectangle',
    subtypes: ['autonomous', 'dependent', 'algorithmic'],
    gloss: 'A practice-or-ability (PAoA): something practitioners can do; the practical correlate of a vocabulary.',
    description: 'Abilities, skills, or behavioral patterns (Brandom)',
    bsdReference: 'BSD ch.1, §1.3'
  },
  test: {
    shape: 'diamond',
    extraFields: ['condition', 'evaluationFunction'],
    gloss: 'A decision/comparison step that checks state against a goal; if incongruent, control passes to Operate.',
    description: 'Decision points in TOTE cycles (Miller et al.)',
    bsdReference: 'Miller, Galanter & Pribram 1960 ch.2'
  },
  operate: {
    shape: 'rectangle',
    extraFields: ['operations', 'subTOTEs'],
    gloss: 'An action step that transforms state; after Operate, control returns to Test.',
    description: 'Actions in TOTE cycles (Miller et al.)',
    bsdReference: 'Miller, Galanter & Pribram 1960 ch.2'
  },
  exit: {
    shape: 'rectangle',
    gloss: 'The Exit step reached when the Test reports congruence with the goal.',
    description: 'Exit nodes for TOTE cycles',
    bsdReference: 'Miller, Galanter & Pribram 1960 ch.2'
  },
  custom: {
    shape: 'circle',
    extraFields: ['customLabel'],
    gloss: 'Generic node with no fixed semantics; useful for wildcard / placeholder concepts.',
    description: 'Generic custom node'
  }
};

// --- Edge type metadata ---
// Each entry encodes: gloss, canonical source/target node types,
// qualifier (sufficient/necessary/null), BSD reference, and a short example.

interface EdgeTypeMeta {
  gloss: string;
  sourceType: 'vocabulary' | 'practice' | 'test' | 'operate' | 'exit' | 'any';
  targetType: 'vocabulary' | 'practice' | 'test' | 'operate' | 'exit' | 'any';
  qualifier: 'sufficient' | 'necessary' | null;
  bsdReference?: string;
  example?: string;
  family: 'MUD-basic' | 'MUD-qualified' | 'TOTE' | 'other';
}

const EDGE_TYPES_DETAILS: Record<string, EdgeTypeMeta> = {
  // --- Basic MUD relations (qualifier unspecified) ---
  PV: {
    gloss: 'Practice-or-ability P stands in some PV relation to Vocabulary V (qualifier left unspecified).',
    sourceType: 'practice',
    targetType: 'vocabulary',
    qualifier: null,
    bsdReference: 'BSD ch.1 §1.3',
    example: 'P_asserting -PV-> V_declarative',
    family: 'MUD-basic'
  },
  VP: {
    gloss: 'Vocabulary V stands in some VP relation to Practice P (qualifier left unspecified).',
    sourceType: 'vocabulary',
    targetType: 'practice',
    qualifier: null,
    bsdReference: 'BSD ch.1 §1.3',
    example: 'V_modal -VP-> P_counterfactual',
    family: 'MUD-basic'
  },
  PP: {
    gloss: 'Practice P₁ stands in some PP relation to Practice P₂ (qualifier left unspecified).',
    sourceType: 'practice',
    targetType: 'practice',
    qualifier: null,
    bsdReference: 'BSD ch.1 §1.3',
    example: 'P_addition -PP-> P_multiplication',
    family: 'MUD-basic'
  },
  VV: {
    gloss: 'Vocabulary V₁ stands in some VV relation to Vocabulary V₂ (qualifier left unspecified). Typically used as a resultant MUR.',
    sourceType: 'vocabulary',
    targetType: 'vocabulary',
    qualifier: null,
    bsdReference: 'BSD ch.1 §1.3',
    example: 'V_norm -VV-> V_modal (resultant)',
    family: 'MUD-basic'
  },

  // --- Qualified MUD relations ---
  'PV-suff': {
    gloss: 'Practice-or-ability P is sufficient to deploy Vocabulary V.',
    sourceType: 'practice',
    targetType: 'vocabulary',
    qualifier: 'sufficient',
    bsdReference: 'BSD ch.1 §1.3, ch.4',
    example: 'Practices of associating ranges of counterfactual robustness with material inferences are PV-suff for deploying modal vocabulary.',
    family: 'MUD-qualified'
  },
  'PV-nec': {
    gloss: 'Practice-or-ability P is necessary for deploying Vocabulary V (no V-use without engaging P).',
    sourceType: 'practice',
    targetType: 'vocabulary',
    qualifier: 'necessary',
    bsdReference: 'BSD ch.1 §1.3, ch.4',
    example: 'The practices of giving and asking for reasons are PV-nec for any autonomous discursive practice.',
    family: 'MUD-qualified'
  },
  'VP-suff': {
    gloss: 'Vocabulary V is sufficient to specify (characterise) the practice-or-ability P.',
    sourceType: 'vocabulary',
    targetType: 'practice',
    qualifier: 'sufficient',
    bsdReference: 'BSD ch.1 §1.3, ch.4',
    example: 'Normative vocabulary is VP-suff to specify the practices of giving and asking for reasons.',
    family: 'MUD-qualified'
  },
  'VP-nec': {
    gloss: 'Vocabulary V is necessary to specify the practice-or-ability P (no adequate specification of P without V).',
    sourceType: 'vocabulary',
    targetType: 'practice',
    qualifier: 'necessary',
    bsdReference: 'BSD ch.1 §1.3',
    example: 'V_normative -VP-nec-> P_assertion (no full specification of assertion without normative vocabulary).',
    family: 'MUD-qualified'
  },
  'PP-suff': {
    gloss: 'Practice P₁ is sufficient (typically by algorithmic elaboration) for Practice P₂.',
    sourceType: 'practice',
    targetType: 'practice',
    qualifier: 'sufficient',
    bsdReference: 'BSD ch.1 §1.3, ch.4 (algorithmic elaboration)',
    example: 'The practices of addition and successor are PP-suff (by algorithmic elaboration) for the practice of multiplication.',
    family: 'MUD-qualified'
  },
  'PP-nec': {
    gloss: 'Practice P₁ is necessary for Practice P₂.',
    sourceType: 'practice',
    targetType: 'practice',
    qualifier: 'necessary',
    bsdReference: 'BSD ch.1 §1.3',
    example: 'P_counting -PP-nec-> P_arithmetic',
    family: 'MUD-qualified'
  },
  'VV-suff': {
    gloss: 'Vocabulary V₁ is sufficient (semantically) for Vocabulary V₂; usually appears as a resultant MUR.',
    sourceType: 'vocabulary',
    targetType: 'vocabulary',
    qualifier: 'sufficient',
    bsdReference: 'BSD ch.1, ch.4',
    example: 'V_norm -VV-suff-> V_modal (the pragmatic-metavocabulary resultant of BSD Fig. 4.1).',
    family: 'MUD-qualified'
  },
  'VV-nec': {
    gloss: 'Vocabulary V₁ is necessary for Vocabulary V₂.',
    sourceType: 'vocabulary',
    targetType: 'vocabulary',
    qualifier: 'necessary',
    bsdReference: 'BSD ch.1',
    example: 'V_logical -VV-nec-> V_explicit-inferential',
    family: 'MUD-qualified'
  },

  // --- TOTE relations ---
  sequence: {
    gloss: 'Default control transition (e.g., Operate → Test) in a TOTE cycle.',
    sourceType: 'any',
    targetType: 'any',
    qualifier: null,
    bsdReference: 'Miller et al. 1960 ch.2',
    example: 'Operate(Lift) -sequence-> Test(Hammer-up)',
    family: 'TOTE'
  },
  feedback: {
    gloss: 'Feedback transition that returns control toward a prior Test after a perturbation.',
    sourceType: 'any',
    targetType: 'any',
    qualifier: null,
    bsdReference: 'Miller et al. 1960 ch.2',
    example: 'Operate(Strike) -feedback-> Test(Nail-flush)',
    family: 'TOTE'
  },
  loop: {
    gloss: 'Iterative loop transition (often a self-edge on an Operate or Test).',
    sourceType: 'any',
    targetType: 'any',
    qualifier: null,
    bsdReference: 'Miller et al. 1960 ch.2',
    family: 'TOTE'
  },
  exit: {
    gloss: 'Exit transition out of a TOTE cycle when the Test reports congruence.',
    sourceType: 'any',
    targetType: 'any',
    qualifier: null,
    bsdReference: 'Miller et al. 1960 ch.2',
    family: 'TOTE'
  },
  entry: {
    gloss: 'Entry transition into a TOTE cycle (renders without an arrowhead).',
    sourceType: 'any',
    targetType: 'any',
    qualifier: null,
    bsdReference: 'Miller et al. 1960 ch.2',
    family: 'TOTE'
  },
  'test-pass': {
    gloss: 'Test-Pass branch (congruent): leaves the TOTE via Exit.',
    sourceType: 'test',
    targetType: 'any',
    qualifier: null,
    bsdReference: 'Miller et al. 1960 ch.2',
    family: 'TOTE'
  },
  'test-fail': {
    gloss: 'Test-Fail branch (incongruent): passes control to an Operate.',
    sourceType: 'test',
    targetType: 'operate',
    qualifier: null,
    bsdReference: 'Miller et al. 1960 ch.2',
    family: 'TOTE'
  },

  // --- Other ---
  resultant: {
    gloss: 'A resultant MUR — an edge derived by composition from other MURs. Renders as dashed.',
    sourceType: 'any',
    targetType: 'any',
    qualifier: null,
    bsdReference: 'BSD ch.1 §1.3, ch.4',
    example: 'Res 3: VV-1,2 — VV resultant from edges 1 and 2.',
    family: 'other'
  },
  unmarked: {
    gloss: 'A simple line with no specific MUR semantics; renders in gray.',
    sourceType: 'any',
    targetType: 'any',
    qualifier: null,
    family: 'other'
  },
  custom: {
    gloss: 'A custom edge; semantics carried entirely by its label.',
    sourceType: 'any',
    targetType: 'any',
    qualifier: null,
    family: 'other'
  }
};

// Grouped index by family. This is the legacy shape returned by
// `schema edge-types` and surfaced under `edgeTypes` in `schema all`, kept
// stable for existing LLM/script consumers. The richer per-type semantics
// live additively under EDGE_TYPES_DETAILS / edgeTypeDetails.
const EDGE_TYPES = {
  MUD: {
    basic: ['PV', 'VP', 'PP', 'VV'],
    qualified: ['PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec'],
    description: 'Meaning-use relations between vocabularies and practices (Brandom, Between Saying and Doing).'
  },
  TOTE: {
    types: ['sequence', 'feedback', 'loop', 'exit', 'entry', 'test-pass', 'test-fail'],
    description: 'Control flow in Test-Operate-Test-Exit cycles (Miller, Galanter & Pribram 1960).'
  },
  other: {
    types: ['resultant', 'unmarked', 'custom'],
    description: 'Generic edge types available in all modes.'
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

// Brandom-canonical composition patterns the `derive` engine recognises.
// Kept here so LLM clients can read the list before calling `derive`.
const BRANDOM_COMPOSITION_RULES = [
  {
    name: 'pragmatic-metavocabulary',
    bsdReference: 'BSD ch.4 Fig. 4.1',
    pattern: 'V_A -VP-suff-> P -PV-suff-> V_B',
    yields: 'V_A -VV (resultant)-> V_B',
    reading: 'V_A is a pragmatic metavocabulary for V_B.'
  },
  {
    name: 'LX',
    bsdReference: 'BSD ch.4 Figs. 4.2, 4.4',
    pattern: 'P_base -PV-nec-> V_base ; P_base -PP-suff-> P_alg ; P_alg -PV-suff-> V_LX ; V_LX -VP-suff-> P_base',
    yields: 'V_LX is elaborated-explicating (LX) for V_base',
    reading: 'V_LX can be algorithmically elaborated from practices necessary for V_base, and V_LX is VP-sufficient to specify those very practices. Brandom\'s key formal apparatus.'
  }
];

export function registerSchemaCommands(program: Command): void {
  const schema = program.command('schema').description('Type schema discovery (for LLM self-reference)');

  schema
    .command('all')
    .description('Print full schema (nodes, edges, modes, and Brandom-aware composition rules)')
    .action(() => {
      outputSuccess('schema.all', {
        nodeTypes: NODE_TYPES,
        // Legacy grouped shape — stable for existing consumers.
        edgeTypes: EDGE_TYPES,
        // New additive field — rich per-type semantics for Brandom-aware LLM use.
        edgeTypeDetails: EDGE_TYPES_DETAILS,
        diagramModes: DIAGRAM_MODES,
        brandomCompositionRules: BRANDOM_COMPOSITION_RULES,
        commonNodeFields: {
          id: 'string (auto-generated UUID)',
          type: 'NodeType',
          label: 'string',
          position: '{ x: number, y: number }',
          parentId: 'string | null (for nesting)',
          subscript: 'string (optional) — rendered as italic small text below the label, e.g. "context-homogeneous"',
          secondaryLabel: 'string (optional) — second line in the node',
          style: 'NodeStyle (optional)'
        },
        commonEdgeFields: {
          id: 'string (auto-generated UUID)',
          source: 'string (node ID)',
          target: 'string (node ID)',
          type: 'EdgeType',
          label: 'string (optional)',
          isResultant: 'boolean (optional, renders dashed; set when this edge is a derived MUR)',
          resultantFrom: 'string[] (optional) — IDs of basis edges this resultant was composed from',
          labelPosition: "'start' | 'middle' | 'end' (optional)",
          orderNumber: 'number (optional) — prefix label with "N:" using Brandom\'s MUR numbering'
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
    .description('Print edge type schema (legacy grouped shape; use --details for per-type Brandom semantics)')
    .option('--details', 'Return the per-type metadata map (gloss, qualifier, source/target type, BSD ref, example) instead of the legacy grouped shape')
    .action((opts) => {
      if (opts.details) {
        outputSuccess('schema.edge-types', EDGE_TYPES_DETAILS);
      } else {
        outputSuccess('schema.edge-types', EDGE_TYPES);
      }
    });

  schema
    .command('modes')
    .description('Print diagram mode schema')
    .action(() => {
      outputSuccess('schema.modes', DIAGRAM_MODES);
    });

  schema
    .command('composition-rules')
    .description('Print the Brandom-canonical composition rules the `derive` verb recognises')
    .action(() => {
      outputSuccess('schema.composition-rules', BRANDOM_COMPOSITION_RULES);
    });
}
