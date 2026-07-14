import { Command } from 'commander';
import {
  detectLXRelations,
  detectPragmaticMetavocabulary,
  type Diagram,
  type DetectedLX,
  type DetectedPragmaticMetavocabulary,
  type Node
} from '@pragma-graph/core';
import { requireDiagram } from '../backend.js';
import {
  outputSuccess,
  outputError,
  outputRaw,
  isJsonExplicit
} from '../output/formatter.js';

type Lang = 'en' | 'es';
type Style = 'narrative' | 'structured';

function nodeLabel(diagram: Diagram, id: string): string {
  const n = diagram.nodes.find((x: Node) => x.id === id);
  return n?.label ?? id;
}

// ---------------------------------------------------------------------------
// Phrase templates. Spanish wording matches tesis/research-aux/TERMINOLOGY.md:
//   Análisis Significado-Uso, elaborado-explicitante, vocabulario LX,
//   metavocabulario pragmático, PV-suficiencia, etc.

function lxNarrative(diagram: Diagram, lx: DetectedLX, lang: Lang): string {
  const vBase = nodeLabel(diagram, lx.fromVocab);
  const vLx = nodeLabel(diagram, lx.toVocab);
  const pBase = nodeLabel(diagram, lx.basePracticeId);
  const pAlg = nodeLabel(diagram, lx.algPracticeId);

  if (lang === 'es') {
    return (
      `${vLx} es un vocabulario LX (elaborado-explicitante) para ${vBase}. ` +
      `La práctica ${pAlg} se elabora algorítmicamente a partir de ${pBase} ` +
      `(que es PV-necesaria para ${vBase}); ${pAlg} es PV-suficiente para desplegar ` +
      `${vLx}; y ${vLx} es VP-suficiente para especificar ${pBase}. ` +
      `Esta es la estructura formal del análisis significado-uso que Brandom expone ` +
      `en Between Saying and Doing (caps. 3-4).`
    );
  }
  return (
    `${vLx} is LX (elaborated-explicating) for ${vBase}. The practice ${pAlg} is ` +
    `algorithmically elaborated from ${pBase} (which is PV-necessary for ${vBase}); ` +
    `${pAlg} is PV-sufficient to deploy ${vLx}; and ${vLx} is VP-sufficient to ` +
    `specify ${pBase}. This is the four-MUR composition Brandom uses to articulate ` +
    `pragmatically mediated semantic relations (Between Saying and Doing, ch. 3-4).`
  );
}

function pragmaticMetavocabNarrative(
  diagram: Diagram,
  pm: DetectedPragmaticMetavocabulary,
  lang: Lang
): string {
  const vA = nodeLabel(diagram, pm.metavocabId);
  const vB = nodeLabel(diagram, pm.baseVocabId);
  const p = nodeLabel(diagram, pm.practiceId);
  if (lang === 'es') {
    return (
      `${vA} es un metavocabulario pragmático para ${vB}: ${vA} es VP-suficiente ` +
      `para especificar la práctica ${p}, y ${p} es PV-suficiente para desplegar ${vB}. ` +
      `La composición resultante es una MUR VV de ${vA} a ${vB} (BSD Fig. 4.1).`
    );
  }
  return (
    `${vA} is a pragmatic metavocabulary for ${vB}: ${vA} is VP-sufficient to ` +
    `specify the practice ${p}, and ${p} is PV-sufficient to deploy ${vB}. ` +
    `The resultant composition is a VV MUR from ${vA} to ${vB} (BSD Fig. 4.1).`
  );
}

// ---------------------------------------------------------------------------

function buildNarrative(diagram: Diagram, lang: Lang): string {
  const lxs = detectLXRelations(diagram);
  const pms = detectPragmaticMetavocabulary(diagram);

  if (lxs.length === 0 && pms.length === 0) {
    if (lang === 'es') {
      return `El diagrama "${diagram.name}" no contiene relaciones LX ni metavocabularios pragmáticos detectables según las reglas canónicas de BSD §3-4.`;
    }
    return `Diagram "${diagram.name}" contains no LX relations or pragmatic-metavocabulary patterns detectable under the canonical BSD §3-4 rules.`;
  }

  const parts: string[] = [];
  const header =
    lang === 'es'
      ? `Análisis del diagrama "${diagram.name}":`
      : `Analysis of diagram "${diagram.name}":`;
  parts.push(header);

  for (const lx of lxs) parts.push(lxNarrative(diagram, lx, lang));
  // Pragmatic-metavocab patterns that are part of an LX are subsumed; report
  // only those that don't have a corresponding LX.
  const lxKeys = new Set(lxs.map(l => `${l.toVocab}::${l.fromVocab}`));
  for (const pm of pms) {
    const key = `${pm.metavocabId}::${pm.baseVocabId}`;
    if (lxKeys.has(key)) continue;
    parts.push(pragmaticMetavocabNarrative(diagram, pm, lang));
  }

  return parts.join('\n\n');
}

function buildStructured(diagram: Diagram, lang: Lang): unknown {
  const lxs = detectLXRelations(diagram).map(lx => ({
    rule: 'LX',
    reading: lxNarrative(diagram, lx, lang),
    fromVocab: nodeLabel(diagram, lx.fromVocab),
    toVocab: nodeLabel(diagram, lx.toVocab),
    basePractice: nodeLabel(diagram, lx.basePracticeId),
    algPractice: nodeLabel(diagram, lx.algPracticeId),
    witnessEdges: lx.witnessEdges
  }));
  const pms = detectPragmaticMetavocabulary(diagram).map(pm => ({
    rule: 'pragmatic-metavocabulary',
    reading: pragmaticMetavocabNarrative(diagram, pm, lang),
    metavocab: nodeLabel(diagram, pm.metavocabId),
    baseVocab: nodeLabel(diagram, pm.baseVocabId),
    practice: nodeLabel(diagram, pm.practiceId),
    witnessEdges: pm.witnessEdges
  }));

  return {
    diagram: { id: diagram.id, name: diagram.name, type: diagram.type },
    lang,
    lxRelations: lxs,
    pragmaticMetavocabularies: pms,
    basicMURs: diagram.edges
      .filter(e => !e.isResultant)
      .map(e => ({
        id: e.id,
        type: e.type,
        source: nodeLabel(diagram, e.source),
        target: nodeLabel(diagram, e.target),
        label: e.label
      }))
  };
}

export function registerExplainCommand(program: Command): void {
  program
    .command('explain')
    .description(
      'Emit a Brandom-style summary of the diagram: LX relations, pragmatic metavocabularies, and basic MURs. Built on top of the `derive` engine.'
    )
    .option('--style <s>', "'narrative' or 'structured'", 'narrative')
    .option('--lang <l>', "'en' or 'es'", 'en')
    .action(async (opts) => {
      try {
        const diagram = await requireDiagram();
        const lang: Lang = opts.lang === 'es' ? 'es' : 'en';
        const style: Style = opts.style === 'structured' ? 'structured' : 'narrative';

        if (style === 'narrative') {
          const text = buildNarrative(diagram, lang);
          // Narrative is plain text by design. Stay raw under shell redirection
          // (`explain > notes.tex`, pipes into thesis tooling, etc.) and only
          // switch to the JSON envelope when the user explicitly asks for JSON.
          if (isJsonExplicit()) {
            outputSuccess('explain', { lang, style, text });
          } else {
            outputRaw(text + '\n');
          }
        } else {
          outputSuccess('explain', buildStructured(diagram, lang));
        }
      } catch (e) {
        outputError('explain', 'NO_DIAGRAM', (e as Error).message);
      }
    });
}
