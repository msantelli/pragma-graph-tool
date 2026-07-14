// Strict Brandom-canonical derivation engine.
//
// Where validate.ts asks "is what the author wrote internally coherent?",
// derive.ts asks "what compositions does Brandom's BSD §3-4 license?".
// The engine refuses to propose resultants whose composition is not in the
// explicit table below. Author retains creative control via --apply.

import type { Diagram, Edge, Node, EdgeType } from './types.js';
import { toBasicMUD } from './validate.js';

export type CompositionRuleName = 'pragmatic-metavocabulary' | 'LX';

// A suggested resultant: what edge would be added, derived from which basis,
// by which Brandom rule.
export interface SuggestedResultant {
  rule: CompositionRuleName;
  bsdReference: string;
  source: string;
  target: string;
  type: EdgeType; // The canonical resultant type
  basisEdgeIds: string[];
  narrative: string; // One-line gloss of the inference
}

// A detected LX relation: V_LX is LX for V_base via P_base ↔ P_alg.
export interface DetectedLX {
  fromVocab: string; // V_base
  toVocab: string; // V_LX (the LX vocabulary)
  basePracticeId: string;
  algPracticeId: string;
  witnessEdges: {
    pvNec: string; // P_base -PV-nec-> V_base
    ppSuff: string; // P_base -PP-suff-> P_alg
    pvSuff: string; // P_alg -PV-suff-> V_LX
    vpSuff: string; // V_LX  -VP-suff-> P_base
  };
  narrative: string;
}

// A detected pragmatic-metavocabulary relation: V_A is pragmatic
// metavocabulary for V_B via practice P.
export interface DetectedPragmaticMetavocabulary {
  metavocabId: string; // V_A
  baseVocabId: string; // V_B
  practiceId: string; // P
  witnessEdges: {
    vpSuff: string; // V_A -VP-suff-> P
    pvSuff: string; // P  -PV-suff-> V_B
  };
  narrative: string;
}

// --- Helpers ------------------------------------------------------------

function nodeName(nodes: Node[], id: string): string {
  const n = nodes.find(x => x.id === id);
  return n?.label ?? id;
}

// --- Pragmatic-metavocabulary detection (BSD Fig 4.1) ------------------

export function detectPragmaticMetavocabulary(
  diagram: Diagram
): DetectedPragmaticMetavocabulary[] {
  const nodes = diagram.nodes;
  const edges = diagram.edges;
  const out: DetectedPragmaticMetavocabulary[] = [];
  const seenPairs = new Set<string>();

  // Pattern: V_A -VP-suff-> P, P -PV-suff-> V_B  (and V_A ≠ V_B)
  const vpSuffEdges = edges.filter(e => e.type === 'VP-suff' && !e.isResultant);
  for (const vp of vpSuffEdges) {
    const va = nodes.find(n => n.id === vp.source);
    const p = nodes.find(n => n.id === vp.target);
    if (!va || va.type !== 'vocabulary') continue;
    if (!p || p.type !== 'practice') continue;
    const pvSuffsFromP = edges.filter(
      e => e.type === 'PV-suff' && !e.isResultant && e.source === p.id
    );
    for (const pv of pvSuffsFromP) {
      const vb = nodes.find(n => n.id === pv.target);
      if (!vb || vb.type !== 'vocabulary') continue;
      if (vb.id === va.id) continue;
      const pairKey = `${va.id}::${vb.id}::${p.id}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      out.push({
        metavocabId: va.id,
        baseVocabId: vb.id,
        practiceId: p.id,
        witnessEdges: { vpSuff: vp.id, pvSuff: pv.id },
        narrative: `${nodeName(nodes, va.id)} is a pragmatic metavocabulary for ${nodeName(nodes, vb.id)} via the practice ${nodeName(nodes, p.id)}.`
      });
    }
  }
  return out;
}

// --- LX detection (BSD Figs 4.2, 4.4) ----------------------------------

export function detectLXRelations(diagram: Diagram): DetectedLX[] {
  const nodes = diagram.nodes;
  const edges = diagram.edges;
  const out: DetectedLX[] = [];
  const seen = new Set<string>();

  // The LX pattern, for a candidate (V_base, P_base, P_alg, V_LX):
  //   1. P_base -PV-nec-> V_base
  //   2. P_base -PP-suff-> P_alg
  //   3. P_alg  -PV-suff-> V_LX
  //   4. V_LX   -VP-suff-> P_base
  //
  // We anchor the search on (1) — every PV-nec edge picks out a (P_base, V_base) pair.

  const pvNecs = edges.filter(e => e.type === 'PV-nec' && !e.isResultant);
  for (const e1 of pvNecs) {
    const pBase = nodes.find(n => n.id === e1.source);
    const vBase = nodes.find(n => n.id === e1.target);
    if (!pBase || pBase.type !== 'practice') continue;
    if (!vBase || vBase.type !== 'vocabulary') continue;

    // (2) P_base -PP-suff-> P_alg
    const ppSuffs = edges.filter(
      x => x.type === 'PP-suff' && !x.isResultant && x.source === pBase.id
    );
    for (const e2 of ppSuffs) {
      const pAlg = nodes.find(n => n.id === e2.target);
      if (!pAlg || pAlg.type !== 'practice') continue;

      // (3) P_alg -PV-suff-> V_LX
      const pvSuffs = edges.filter(
        x => x.type === 'PV-suff' && !x.isResultant && x.source === pAlg.id
      );
      for (const e3 of pvSuffs) {
        const vLx = nodes.find(n => n.id === e3.target);
        if (!vLx || vLx.type !== 'vocabulary') continue;
        if (vLx.id === vBase.id) continue; // V_LX must differ from V_base

        // (4) V_LX -VP-suff-> P_base
        const e4candidates = edges.filter(
          x =>
            x.type === 'VP-suff' &&
            !x.isResultant &&
            x.source === vLx.id &&
            x.target === pBase.id
        );
        if (e4candidates.length === 0) continue;
        const e4 = e4candidates[0];

        const key = `${vBase.id}::${vLx.id}::${pBase.id}::${pAlg.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        out.push({
          fromVocab: vBase.id,
          toVocab: vLx.id,
          basePracticeId: pBase.id,
          algPracticeId: pAlg.id,
          witnessEdges: { pvNec: e1.id, ppSuff: e2.id, pvSuff: e3.id, vpSuff: e4.id },
          narrative: `${nodeName(nodes, vLx.id)} is LX (elaborated-explicating) for ${nodeName(nodes, vBase.id)}: the practice ${nodeName(nodes, pAlg.id)} is algorithmically elaborated from ${nodeName(nodes, pBase.id)} (PV-necessary for ${nodeName(nodes, vBase.id)}), is PV-sufficient to deploy ${nodeName(nodes, vLx.id)}, and ${nodeName(nodes, vLx.id)} is VP-sufficient to specify ${nodeName(nodes, pBase.id)}.`
        });
      }
    }
  }
  return out;
}

// --- Composition: VV from pragmatic-metavocabulary -----------------------

// The pragmatic-metavocabulary pattern licenses a VV resultant from V_A to V_B.
// We emit one SuggestedResultant per detected pattern, deduped by (source, target).
export function deriveResultants(diagram: Diagram): SuggestedResultant[] {
  const out: SuggestedResultant[] = [];
  const existingResultants = new Set<string>(
    diagram.edges
      .filter(e => e.isResultant)
      .map(e => `${e.source}::${e.target}::${toBasicMUD(e.type) ?? e.type}`)
  );
  const seen = new Set<string>();

  // Pragmatic-metavocabulary → VV resultant
  for (const pm of detectPragmaticMetavocabulary(diagram)) {
    const key = `${pm.metavocabId}::${pm.baseVocabId}::VV`;
    if (seen.has(key)) continue;
    if (existingResultants.has(key)) continue;
    seen.add(key);
    out.push({
      rule: 'pragmatic-metavocabulary',
      bsdReference: 'BSD ch.4 Fig. 4.1',
      source: pm.metavocabId,
      target: pm.baseVocabId,
      type: 'VV',
      basisEdgeIds: [pm.witnessEdges.vpSuff, pm.witnessEdges.pvSuff],
      narrative: pm.narrative
    });
  }

  // LX detection also licenses a VV resultant from V_LX to V_base, but the
  // *named* relation is LX itself rather than a bare VV. We report it as
  // rule = 'LX', source = V_LX, target = V_base, type = VV (with label "LX").
  for (const lx of detectLXRelations(diagram)) {
    const key = `${lx.toVocab}::${lx.fromVocab}::VV`;
    if (seen.has(key)) continue;
    if (existingResultants.has(key)) continue;
    seen.add(key);
    out.push({
      rule: 'LX',
      bsdReference: 'BSD ch.4 Figs. 4.2, 4.4',
      source: lx.toVocab,
      target: lx.fromVocab,
      type: 'VV',
      basisEdgeIds: [
        lx.witnessEdges.pvNec,
        lx.witnessEdges.ppSuff,
        lx.witnessEdges.pvSuff,
        lx.witnessEdges.vpSuff
      ],
      narrative: lx.narrative
    });
  }

  return out;
}

// --- "Apply" helper: build the Edge payload for dispatching to the store --

export function buildResultantEdgePayload(
  suggestion: SuggestedResultant,
  existingMaxOrder: number
): Omit<Edge, 'id'> {
  const orderNumber = existingMaxOrder + 1;
  // Brandom convention: "Res k: <type>" or "LX: <type>". The TikZ exporter
  // already prefixes the orderNumber as "k:", so the label here should NOT
  // include it — only the resultant *kind* (Res / LX) and the MUR type.
  const labelKind = suggestion.rule === 'LX' ? 'LX' : 'Res';
  const label = `${labelKind} ${suggestion.type}`;
  return {
    source: suggestion.source,
    target: suggestion.target,
    type: suggestion.type,
    label,
    isResultant: true,
    resultantFrom: suggestion.basisEdgeIds,
    orderNumber
  };
}
