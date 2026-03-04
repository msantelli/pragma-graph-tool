import type { Edge } from '../types/all';

type DiagramMode = 'MUD' | 'TOTE' | 'HYBRID' | 'GENERIC';

export const getAvailableEdgeTypes = (
  mode: DiagramMode,
  _sourceType?: string,
  _targetType?: string,
  isAutoDetect: boolean = true
): Edge['type'][] => {
  let baseTypes: Edge['type'][] = [];

  if (mode === 'MUD') {
    if (isAutoDetect) {
      baseTypes = ['PV', 'VP', 'PP', 'VV'] as Edge['type'][];
    } else {
      // Manual mode: return qualified types
      baseTypes = ['PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec'] as Edge['type'][];
    }
  } else if (mode === 'TOTE') {
    baseTypes = ['sequence', 'feedback', 'loop', 'exit', 'entry', 'test-pass', 'test-fail'] as Edge['type'][];
  } else if (mode === 'GENERIC') {
    // GENERIC mode: simple edges for any type of graph
    baseTypes = ['custom', 'unmarked'] as Edge['type'][];
  } else {
    // HYBRID mode
    const mudTypes = isAutoDetect ? ['PV', 'VP', 'PP', 'VV'] as Edge['type'][] : ['PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec'] as Edge['type'][];
    baseTypes = [...mudTypes, 'sequence', 'feedback', 'loop', 'exit', 'entry', 'test-pass', 'test-fail'] as Edge['type'][];
  }

  // Include unmarked edges for non-generic modes
  if (mode !== 'GENERIC') {
    return [...baseTypes, 'unmarked'] as Edge['type'][];
  }

  return baseTypes;
};

export const getBaseEdgeType = (edgeType: string): string => {
  return edgeType.replace('-suff', '').replace('-nec', '');
};

export const getEdgeQualifier = (edgeType: string): 'suff' | 'nec' | null => {
  if (edgeType.includes('-suff')) return 'suff';
  if (edgeType.includes('-nec')) return 'nec';
  return null;
};

export const getEdgeColor = (type: string, isResultant: boolean = false): string => {
  const baseType = getBaseEdgeType(type);

  // Monochrome style matching Brandom's MUD conventions
  // Edges are differentiated by labels, not colors
  let baseColor;
  switch (baseType) {
    // MUD relations — all black (Brandom style)
    case 'PV': baseColor = '#333333'; break;
    case 'VP': baseColor = '#333333'; break;
    case 'PP': baseColor = '#333333'; break;
    case 'VV': baseColor = '#333333'; break;
    // TOTE relations — dark gray
    case 'sequence': baseColor = '#333333'; break;
    case 'feedback': baseColor = '#333333'; break;
    case 'loop': baseColor = '#555555'; break;
    case 'exit': baseColor = '#333333'; break;
    case 'entry': baseColor = '#333333'; break;
    case 'test-pass': baseColor = '#333333'; break;
    case 'test-fail': baseColor = '#333333'; break;
    case 'unmarked': baseColor = '#999999'; break;
    case 'custom': baseColor = '#333333'; break;
    default: baseColor = '#333333'; break;
  }

  if (isResultant) {
    // Lighter gray for resultant (dashed) edges
    return '#999999';
  }

  return baseColor;
};

export const shouldShowArrowhead = (edgeType: string): boolean => {
  // Show arrowheads on all edges except entry arrows (which have no source)
  return edgeType !== 'entry';
};

export const getEdgeTypeDescription = (edgeType: Edge['type']): string => {
  // Simple MUD relations
  if (edgeType === 'PV') return 'Practice → Vocabulary';
  else if (edgeType === 'VP') return 'Vocabulary → Practice';
  else if (edgeType === 'PP') return 'Practice → Practice';
  else if (edgeType === 'VV') return 'Vocabulary → Vocabulary';
  // Qualified MUD relations
  else if (edgeType === 'PV-suff') return 'Practice → Vocabulary (Sufficient)';
  else if (edgeType === 'PV-nec') return 'Practice → Vocabulary (Necessary)';
  else if (edgeType === 'VP-suff') return 'Vocabulary → Practice (Sufficient)';
  else if (edgeType === 'VP-nec') return 'Vocabulary → Practice (Necessary)';
  else if (edgeType === 'PP-suff') return 'Practice → Practice (Sufficient)';
  else if (edgeType === 'PP-nec') return 'Practice → Practice (Necessary)';
  else if (edgeType === 'VV-suff') return 'Vocabulary → Vocabulary (Sufficient)';
  else if (edgeType === 'VV-nec') return 'Vocabulary → Vocabulary (Necessary)';
  // TOTE relations
  else if (edgeType === 'sequence') return 'Sequential action';
  else if (edgeType === 'feedback') return 'Feedback loop';
  else if (edgeType === 'test-pass') return 'Test Passed (Success)';
  else if (edgeType === 'test-fail') return 'Test Failed (Retry)';
  else if (edgeType === 'loop') return 'Iterative loop';
  else if (edgeType === 'exit') return 'Exit condition';
  else if (edgeType === 'entry') return 'Entry point';
  else if (edgeType === 'unmarked') return 'Simple line (no label)';
  else if (edgeType === 'custom') return 'Custom edge (use label for description)';

  return edgeType; // Fallback to the type name
};