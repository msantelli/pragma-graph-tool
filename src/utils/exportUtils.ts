import {
  getNodeFontSize,
  getNodeFillColor,
  getNodeStrokeColor,
  getNodeTextColor,
  getNodeDimensions,
  getNodeShape,
  toAbsolutePosition,
  sortNodesForRendering,
  getChildNodes,
  getNestingDepth,
  calculateContainerBounds
} from './nodeUtils';
import type { Diagram, Node, Edge, Point } from '../types/all';

const EDGE_OFFSET_RANGE = 60;
const EDGE_LABEL_OFFSET = 14;

type EdgeGeometryType = 'straight' | 'curve' | 'loop';

interface ExportEdgeGeometry {
  type: EdgeGeometryType;
  start: Point;
  end: Point;
  control?: Point;
  control2?: Point;
  path: string;
  labelPosition: Point;
  labelAngle: number | null;
}

const normalizeAngle = (angleDeg: number): number => {
  let angle = angleDeg;
  if (angle > 180) angle -= 360;
  if (angle <= -180) angle += 360;
  if (angle > 90) angle -= 180;
  if (angle <= -90) angle += 180;
  return angle;
};

const getEdgeOffsetForExport = (currentEdge: Edge, allEdges: Edge[]): number => {
  const relatedEdges = allEdges.filter(edge =>
    (edge.source === currentEdge.source && edge.target === currentEdge.target) ||
    (edge.source === currentEdge.target && edge.target === currentEdge.source)
  );

  if (relatedEdges.length <= 1) return 0;

  relatedEdges.sort((a, b) => a.id.localeCompare(b.id));
  const currentIndex = relatedEdges.findIndex(edge => edge.id === currentEdge.id);
  const totalEdges = relatedEdges.length;
  const orientationSign = currentEdge.source < currentEdge.target ? 1 : -1;

  if (totalEdges === 2) {
    const baseOffset = currentIndex === 0 ? -EDGE_OFFSET_RANGE / 2 : EDGE_OFFSET_RANGE / 2;
    return baseOffset * orientationSign;
  }

  const step = totalEdges > 1 ? EDGE_OFFSET_RANGE / (totalEdges - 1) : 0;
  const baseOffset = (currentIndex - (totalEdges - 1) / 2) * step;
  return baseOffset * orientationSign;
};

const getNodeConnectionPointForExport = (node: Node, targetPos: Point, allNodes: Node[]): Point => {
  // Use absolute position for nested nodes
  const nodePos = toAbsolutePosition(node, allNodes);
  const { x: nodeX, y: nodeY } = nodePos;
  const { x: targetX, y: targetY } = targetPos;

  const dx = targetX - nodeX;
  const dy = targetY - nodeY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return { x: nodeX, y: nodeY };

  const normalizedDx = dx / distance;
  const normalizedDy = dy / distance;

  const dimensions = getNodeDimensions(node);
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
        offsetY = (normalizedDy * w) / Math.abs(normalizedDx || 1);
      } else {
        offsetX = (normalizedDx * h) / Math.abs(normalizedDy || 1);
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

  return {
    x: nodeX + offsetX,
    y: nodeY + offsetY
  };
};

const computeCurvedEdgeGeometry = (sourceNode: Node, targetNode: Node, offset: number, allNodes: Node[]): ExportEdgeGeometry => {
  // Use absolute positions for nested nodes
  const sourcePos = toAbsolutePosition(sourceNode, allNodes);
  const targetPos = toAbsolutePosition(targetNode, allNodes);

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
      labelPosition: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      labelAngle: 0
    };
  }

  const perpX = -dy / length;
  const perpY = dx / length;
  const controlX = midX + perpX * offset;
  const controlY = midY + perpY * offset;

  const controlPos = { x: controlX, y: controlY };
  const start = getNodeConnectionPointForExport(sourceNode, controlPos, allNodes);
  const end = getNodeConnectionPointForExport(targetNode, controlPos, allNodes);
  const path = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;

  const t = 0.5;
  const oneMinusT = 1 - t;
  const midPoint = {
    x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * controlX + t * t * end.x,
    y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * controlY + t * t * end.y
  };

  const dxdt =
    2 * oneMinusT * (controlX - start.x) +
    2 * t * (end.x - controlX);
  const dydt =
    2 * oneMinusT * (controlY - start.y) +
    2 * t * (end.y - controlY);
  const tangentLength = Math.sqrt(dxdt * dxdt + dydt * dydt) || 1;
  const normalX = (-dydt / tangentLength) * Math.sign(offset || 1);
  const normalY = (dxdt / tangentLength) * Math.sign(offset || 1);

  const labelPosition = {
    x: midPoint.x + normalX * EDGE_LABEL_OFFSET,
    y: midPoint.y + normalY * EDGE_LABEL_OFFSET
  };

  const labelAngle = normalizeAngle((Math.atan2(dydt, dxdt) * 180) / Math.PI);

  return {
    type: 'curve',
    start,
    end,
    control: { x: controlX, y: controlY },
    path,
    labelPosition,
    labelAngle
  };
};

const computeStraightEdgeGeometry = (sourceNode: Node, targetNode: Node, allNodes: Node[]): ExportEdgeGeometry => {
  // Use absolute positions for nested nodes
  const sourcePos = toAbsolutePosition(sourceNode, allNodes);
  const targetPos = toAbsolutePosition(targetNode, allNodes);

  const start = getNodeConnectionPointForExport(sourceNode, targetPos, allNodes);
  const end = getNodeConnectionPointForExport(targetNode, sourcePos, allNodes);
  const path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;

  const labelPosition = {
    x: midX + normalX * (EDGE_LABEL_OFFSET - 2),
    y: midY + normalY * (EDGE_LABEL_OFFSET - 2)
  };

  const labelAngle = normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI);

  return {
    type: 'straight',
    start,
    end,
    path,
    labelPosition,
    labelAngle
  };
};

const computeLoopEdgeGeometry = (node: Node, allNodes: Node[]): ExportEdgeGeometry => {
  const dimensions = getNodeDimensions(node);
  const shape = getNodeShape(node);
  // Use absolute position for nested nodes
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
  const control1 = { x: loopStartX + loopSize, y: loopStartY };
  const control2 = { x: loopEndX + loopSize, y: loopEndY };
  const path = `M ${loopStartX} ${loopStartY} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${loopEndX} ${loopEndY}`;

  const labelPosition = {
    x: pos.x + Math.max(dimensions.width, dimensions.height) * 0.8,
    y: pos.y - Math.max(dimensions.height, 40) * 0.6
  };

  return {
    type: 'loop',
    start: { x: loopStartX, y: loopStartY },
    end: { x: loopEndX, y: loopEndY },
    control: control1,
    control2,
    path,
    labelPosition,
    labelAngle: null
  };
};

const computeEdgeGeometryForExport = (edge: Edge, nodes: Node[], allEdges: Edge[]): ExportEdgeGeometry | null => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  if (edge.source === edge.target) {
    return computeLoopEdgeGeometry(sourceNode, nodes);
  }

  const offset = getEdgeOffsetForExport(edge, allEdges);

  if (offset === 0) {
    return computeStraightEdgeGeometry(sourceNode, targetNode, nodes);
  }

  return computeCurvedEdgeGeometry(sourceNode, targetNode, offset, nodes);
};

// Type for import callback
export type ImportDiagramCallback = (diagram: Diagram) => void;

// Helper function to calculate diagram bounds
export const calculateDiagramBounds = (nodes: Node[]) => {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 400, maxY: 300, width: 400, height: 300 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    // Use absolute position for nested nodes
    const pos = toAbsolutePosition(node, nodes);
    const padding = 100; // Add padding around nodes
    minX = Math.min(minX, pos.x - padding);
    minY = Math.min(minY, pos.y - padding);
    maxX = Math.max(maxX, pos.x + padding);
    maxY = Math.max(maxY, pos.y + padding);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
};

// Export diagram as JSON
export const exportAsJSON = (diagram: Diagram) => {
  const exportData = {
    ...diagram,
    metadata: {
      ...diagram.metadata,
      exported: new Date().toISOString(),
      version: '1.1'
    }
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${diagram.name || 'pragma-graph'}.json`;
  link.click();

  URL.revokeObjectURL(url);
};

// SVG text wrapping helper
const wrapSVGText = (text: string, maxWidth: number, fontSize: number) => {
  const words = text.split(/\s+/);
  if (words.length <= 1) return [text];

  const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

// Generate SVG text element(s) with proper wrapping
const generateSVGText = (
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  className: string,
  maxWidth?: number
) => {
  if (!maxWidth || text.length <= 20) {
    return `<text x="${x}" y="${y}" font-size="${fontSize}" class="${className}" fill="${fill}" text-anchor="middle">${text}</text>`;
  }

  const lines = wrapSVGText(text, maxWidth, fontSize);
  const lineHeight = fontSize * 1.2;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  return lines.map((line, index) =>
    `<text x="${x}" y="${startY + index * lineHeight}" font-size="${fontSize}" class="${className}" fill="${fill}" text-anchor="middle">${line}</text>`
  ).join('\n');
};

// Export diagram as SVG
export const exportAsSVG = (diagram: Diagram) => {
  const { nodes, edges } = diagram;
  const bounds = calculateDiagramBounds(nodes);

  // SVG header with proper sizing
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}"
     width="${bounds.width}" height="${bounds.height}">
  
  <!-- Styles -->
  <style>
    .node-text { font-family: Arial, sans-serif; text-anchor: middle; }
    .edge-text { font-family: Arial, sans-serif; text-anchor: middle; font-size: 12px; }
  </style>
  
  <!-- Arrow markers -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
            refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
    </marker>
  </defs>
  
  <!-- Edges -->
`;

  const formatNumber = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0';

  // Add edges
  edges.forEach(edge => {
    const geometry = computeEdgeGeometryForExport(edge, nodes, edges);
    if (!geometry) return;

    const edgeColor = getEdgeColorSVG(edge.type);
    const strokeDasharray = edge.isResultant ? '8,4' : 'none';

    let pathData: string;
    if (geometry.type === 'curve' && geometry.control) {
      pathData = `M ${formatNumber(geometry.start.x)} ${formatNumber(geometry.start.y)} Q ${formatNumber(geometry.control.x)} ${formatNumber(geometry.control.y)} ${formatNumber(geometry.end.x)} ${formatNumber(geometry.end.y)}`;
    } else if (geometry.type === 'loop' && geometry.control && geometry.control2) {
      pathData = `M ${formatNumber(geometry.start.x)} ${formatNumber(geometry.start.y)} C ${formatNumber(geometry.control.x)} ${formatNumber(geometry.control.y)} ${formatNumber(geometry.control2.x)} ${formatNumber(geometry.control2.y)} ${formatNumber(geometry.end.x)} ${formatNumber(geometry.end.y)}`;
    } else {
      pathData = `M ${formatNumber(geometry.start.x)} ${formatNumber(geometry.start.y)} L ${formatNumber(geometry.end.x)} ${formatNumber(geometry.end.y)}`;
    }

    svgContent += `  <path d="${pathData}" stroke="${edgeColor}" stroke-width="2" stroke-dasharray="${strokeDasharray}" fill="none" marker-end="url(#arrowhead)" stroke-linecap="round" />
`;

    const labelText = edge.label || (edge.type === 'unmarked' || edge.type === 'custom' ? '' : edge.type);
    if (!labelText) return;

    const labelX = formatNumber(geometry.labelPosition.x);
    const labelY = formatNumber(geometry.labelPosition.y);
    const transform = geometry.labelAngle !== null
      ? ` transform="rotate(${geometry.labelAngle.toFixed(2)}, ${labelX}, ${labelY})"`
      : '';

    svgContent += `  <text class="edge-text" x="${labelX}" y="${labelY}"${transform} fill="${edgeColor}" font-size="12" paint-order="stroke fill" stroke="white" stroke-width="3">${labelText}</text>
`;
  });

  svgContent += `
  <!-- Nodes -->
`;

  // Sort nodes for proper rendering (parents before children)
  const sortedNodes = sortNodesForRendering(nodes);

  // Add nodes
  sortedNodes.forEach(node => {
    const fillColor = getNodeFillColor(node);
    const strokeColor = getNodeStrokeColor(node);
    const textColor = getNodeTextColor(node);
    const dimensions = getNodeDimensions(node);
    const shape = node.style?.shape || getNodeShape(node);

    // Use absolute position for nested nodes
    const pos = toAbsolutePosition(node, nodes);
    const cx = pos.x;
    const cy = pos.y;

    // Check if node is a container (has children)
    const children = getChildNodes(node.id, nodes);
    const isContainer = children.length > 0;

    // Render container background if node has children
    if (isContainer) {
      const containerBounds = calculateContainerBounds(children, nodes);
      // Container position is parent position + center offset of children bounds
      const containerX = (cx + containerBounds.centerX - containerBounds.width / 2).toFixed(2);
      const containerY = (cy + containerBounds.centerY - containerBounds.height / 2).toFixed(2);
      svgContent += `  <rect x="${containerX}" y="${containerY}" width="${containerBounds.width.toFixed(2)}" height="${containerBounds.height.toFixed(2)}" rx="8" fill="${fillColor}" fill-opacity="0.2" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="6,3" />\n`;
      // Add container label above the dashed rectangle
      const labelY = (cy + containerBounds.centerY - containerBounds.height / 2 - 10).toFixed(2);
      svgContent += `  <text x="${cx}" y="${labelY}" font-size="12" class="node-text" fill="${textColor}" text-anchor="middle">${node.label}</text>\n`;
      // Skip rendering the regular node shape for containers
      return;
    }

    switch (shape) {
      case 'ellipse': {
        const rx = (dimensions.width / 2).toFixed(2);
        const ry = (dimensions.height / 2).toFixed(2);
        svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />\n`;
        break;
      }
      case 'rectangle': {
        const width = dimensions.width;
        const height = dimensions.height;
        const x = (cx - width / 2).toFixed(2);
        const y = (cy - height / 2).toFixed(2);
        svgContent += `  <rect x="${x}" y="${y}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" rx="10" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />\n`;
        break;
      }
      case 'diamond': {
        const halfWidth = dimensions.width / 2;
        const halfHeight = dimensions.height / 2;
        const diamond = `M ${cx.toFixed(2)},${(cy - halfHeight).toFixed(2)} L ${(cx + halfWidth).toFixed(2)},${cy.toFixed(2)} L ${cx.toFixed(2)},${(cy + halfHeight).toFixed(2)} L ${(cx - halfWidth).toFixed(2)},${cy.toFixed(2)} Z`;
        svgContent += `  <path d="${diamond}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />\n`;
        break;
      }
      case 'circle': {
        const radius = dimensions.radius.toFixed(2);
        svgContent += `  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />\n`;
        break;
      }
      default: {
        const rx = (dimensions.width / 2).toFixed(2);
        const ry = (dimensions.height / 2).toFixed(2);
        svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />\n`;
        break;
      }
    }

    const nodeFontSize = getNodeFontSize(node);
    const maxWidth = dimensions.width * 0.8;
    svgContent += '  ' + generateSVGText(
      node.label,
      cx,
      cy,
      nodeFontSize,
      textColor,
      'node-text',
      maxWidth
    ) + '\n';
  });

  svgContent += '</svg>';

  const dataBlob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${diagram.name || 'pragma-graph'}.svg`;
  link.click();

  URL.revokeObjectURL(url);
};

// Helper functions for SVG colors
const getEdgeColorSVG = (edgeType: string): string => {
  switch (edgeType) {
    case 'PV': return '#333333';
    case 'VP': return '#333333';
    case 'PP': return '#333333';
    case 'VV': return '#333333';
    case 'sequence': return '#333333';
    case 'feedback': return '#333333';
    case 'loop': return '#555555';
    case 'exit': return '#333333';
    case 'entry': return '#333333';
    case 'unmarked': return '#999999';
    default: return '#333333';
  }
};

// LaTeX content detection and escaping
const isLaTeXContent = (text: string): boolean => {
  const latexPatterns = [
    /\\\w+/, // LaTeX commands like \alpha, \beta
    /\$.*?\$/, // Math mode
    /\\[{}]/, // Escaped braces
    /[_^]/, // Subscripts and superscripts
    /\\frac\{/, // Fractions
    /\\mathbb\{/, // Blackboard bold
    /\\mathcal\{/, // Calligraphic
    /\\text\{/, // Text in math mode
  ];

  return latexPatterns.some(pattern => pattern.test(text));
};

const escapeLaTeXText = (text: string): string => {
  if (isLaTeXContent(text)) {
    // Preserve LaTeX content, only escape TikZ-breaking characters
    return text.replace(/([&%])/g, '\\$1');
  }

  // Regular text escaping
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}');
};

// Generate TikZ code for LaTeX export
// Uses native TikZ node references, fit library for containers,
// and bend left/right for curved edges (idiomatic TikZ).
const generateTikZCode = (nodes: Node[], edges: Edge[], diagramType: string): string => {
  if (nodes.length === 0) return '\\begin{tikzpicture}\n\\end{tikzpicture}';

  // Calculate bounds and normalize coordinates
  const bounds = calculateDiagramBounds(nodes);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  // Scale to fit within reasonable LaTeX coordinates
  const maxDimension = Math.max(bounds.width, bounds.height);
  const scale = maxDimension > 0 ? 15 / maxDimension : 1;

  // --- Build node ID map: node.id -> TikZ name ---
  // Use semantic prefixes: V1, P1, T1, O1, C1 for readability
  const nodeIdMap = new Map<string, string>();
  const counters: Record<string, number> = {};
  const sortedNodes = sortNodesForRendering(nodes);

  sortedNodes.forEach(node => {
    const children = getChildNodes(node.id, nodes);
    const isContainer = children.length > 0;
    let prefix: string;
    if (isContainer) {
      prefix = 'G'; // Group/container
    } else {
      switch (node.type) {
        case 'vocabulary': prefix = 'V'; break;
        case 'practice': prefix = 'P'; break;
        case 'test': prefix = 'T'; break;
        case 'operate': prefix = 'O'; break;
        case 'exit': prefix = 'X'; break;
        case 'custom': prefix = 'C'; break;
        default: prefix = 'N'; break;
      }
    }
    counters[prefix] = (counters[prefix] || 0) + 1;
    nodeIdMap.set(node.id, `${prefix}${counters[prefix]}`);
  });

  // --- Determine which edge pairs need bending ---
  const edgePairKey = (a: string, b: string) => [a, b].sort().join('::');
  const edgePairCounts = new Map<string, Edge[]>();
  edges.forEach(edge => {
    const key = edgePairKey(edge.source, edge.target);
    if (!edgePairCounts.has(key)) edgePairCounts.set(key, []);
    edgePairCounts.get(key)!.push(edge);
  });

  const edgeBendAngles = new Map<string, number>();
  edgePairCounts.forEach((group) => {
    if (group.length <= 1) return;
    // Assign symmetric bend angles
    const step = Math.min(30, 60 / group.length);
    group.forEach((edge, i) => {
      const angle = (i - (group.length - 1) / 2) * step;
      edgeBendAngles.set(edge.id, angle);
    });
  });

  // --- Start tikzpicture ---
  let tikz = `\\begin{tikzpicture}[>=Stealth, thick, font=\\small]\n\n`;

  // --- Emit style definitions based on diagram type ---
  const isMUD = ['MUD', 'HYBRID'].includes(diagramType) ||
    nodes.some(n => n.type === 'vocabulary' || n.type === 'practice');
  const isTOTE = ['TOTE', 'HYBRID'].includes(diagramType) ||
    nodes.some(n => n.type === 'test' || n.type === 'operate');

  tikz += '% --- Node styles ---\n';
  tikz += '\\tikzset{\n';

  if (isMUD) {
    tikz += '  % MUD styles (Brandom, Between Saying and Doing)\n';
    tikz += '  vocabulary/.style={ellipse, draw=black, thick,\n';
    tikz += '    minimum width=2.8cm, minimum height=1.2cm,\n';
    tikz += '    text centered, align=center},\n';
    tikz += '  practice/.style={rectangle, rounded corners=3pt, draw=black, thick,\n';
    tikz += '    minimum width=2.8cm, minimum height=1.2cm,\n';
    tikz += '    text centered, align=center},\n';
  }

  if (isTOTE) {
    tikz += '  % TOTE styles (Miller et al., Plans and the Structure of Behavior)\n';
    tikz += '  test/.style={diamond, draw=black, thick, aspect=2,\n';
    tikz += '    minimum width=2cm, text centered, align=center},\n';
    tikz += '  operate/.style={rectangle, draw=black, thick,\n';
    tikz += '    minimum width=2.5cm, minimum height=1cm,\n';
    tikz += '    text centered, align=center},\n';
    tikz += '  exitnode/.style={rectangle, draw=black, thick,\n';
    tikz += '    minimum width=1.5cm, minimum height=0.8cm,\n';
    tikz += '    text centered, align=center},\n';
  }

  tikz += '  custom/.style={circle, draw=black, thick,\n';
  tikz += '    minimum size=1.5cm, text centered, align=center},\n';
  tikz += '  container/.style={rectangle, draw=black, dashed, rounded corners=4pt,\n';
  tikz += '    inner sep=12pt},\n';
  tikz += '  % Edge styles\n';

  if (isMUD) {
    tikz += '  pv/.style={->, thick},\n';
    tikz += '  vp/.style={->, thick},\n';
    tikz += '  pp/.style={->, thick},\n';
    tikz += '  vv/.style={->, thick},\n';
    tikz += '  resultant/.style={->, thick, dashed},\n';
  }

  if (isTOTE) {
    tikz += '  sequence/.style={->, thick},\n';
    tikz += '  feedback/.style={->, thick},\n';
    tikz += '  exitedge/.style={->, thick},\n';
  }

  tikz += '  unmarked/.style={->, thick, gray!60},\n';
  tikz += '  customedge/.style={->, thick},\n';
  tikz += '}\n\n';

  // --- First pass: emit leaf nodes (non-containers) ---
  tikz += '% --- Nodes ---\n';
  sortedNodes.forEach(node => {
    const children = getChildNodes(node.id, nodes);
    if (children.length > 0) return; // Skip containers for now

    const tikzId = nodeIdMap.get(node.id)!;
    const pos = toAbsolutePosition(node, nodes);
    const x = ((pos.x - centerX) * scale).toFixed(2);
    const y = (-(pos.y - centerY) * scale).toFixed(2);

    // Build label
    let labelContent = escapeLaTeXText(node.label);
    if (node.secondaryLabel) {
      labelContent += `\\\\ ${escapeLaTeXText(node.secondaryLabel)}`;
    }
    if (node.subscript) {
      labelContent += `\\\\ {\\scriptsize\\itshape ${escapeLaTeXText(node.subscript)}}`;
    }

    // Determine TikZ style name
    let styleName: string;
    switch (node.type) {
      case 'vocabulary': styleName = 'vocabulary'; break;
      case 'practice': styleName = 'practice'; break;
      case 'test': styleName = 'test'; break;
      case 'operate': styleName = 'operate'; break;
      case 'exit': styleName = 'exitnode'; break;
      case 'custom': styleName = 'custom'; break;
      default: styleName = 'custom'; break;
    }

    tikz += `\\node[${styleName}] (${tikzId}) at (${x}, ${y}) {${labelContent}};\n`;
  });

  // --- Second pass: emit containers using fit ---
  const containerNodes = sortedNodes.filter(n => getChildNodes(n.id, nodes).length > 0);
  if (containerNodes.length > 0) {
    tikz += '\n% --- Containers (using fit) ---\n';

    // Process containers from deepest to shallowest so inner fit nodes exist first
    const sortedContainers = [...containerNodes].sort((a, b) => {
      const depthA = getNestingDepth(a, nodes);
      const depthB = getNestingDepth(b, nodes);
      return depthB - depthA; // deepest first
    });

    sortedContainers.forEach(node => {
      const tikzId = nodeIdMap.get(node.id)!;
      const children = getChildNodes(node.id, nodes);

      // Collect all descendant TikZ IDs for the fit
      const fitTargets = children.map(child => `(${nodeIdMap.get(child.id)!})`).join(' ');

      tikz += `\\node[container, fit=${fitTargets}, label=above:{${escapeLaTeXText(node.label)}}] (${tikzId}) {};\n`;
    });
  }

  // --- Edges ---
  tikz += '\n% --- Edges ---\n';
  edges.forEach(edge => {
    const sourceTikzId = nodeIdMap.get(edge.source);
    const targetTikzId = nodeIdMap.get(edge.target);
    if (!sourceTikzId || !targetTikzId) return;

    // Determine TikZ edge style name
    let edgeStyleName: string;
    if (edge.isResultant) {
      edgeStyleName = 'resultant';
    } else {
      switch (edge.type) {
        case 'PV': edgeStyleName = 'pv'; break;
        case 'VP': edgeStyleName = 'vp'; break;
        case 'PP': edgeStyleName = 'pp'; break;
        case 'VV': edgeStyleName = 'vv'; break;
        case 'PV-suff': case 'PV-nec': edgeStyleName = 'pv'; break;
        case 'VP-suff': case 'VP-nec': edgeStyleName = 'vp'; break;
        case 'PP-suff': case 'PP-nec': edgeStyleName = 'pp'; break;
        case 'VV-suff': case 'VV-nec': edgeStyleName = 'vv'; break;
        case 'sequence': edgeStyleName = 'sequence'; break;
        case 'feedback': edgeStyleName = 'feedback'; break;
        case 'exit': edgeStyleName = 'exitedge'; break;
        case 'entry': edgeStyleName = 'sequence'; break;
        case 'loop': edgeStyleName = 'feedback'; break;
        case 'test-pass': edgeStyleName = 'exitedge'; break;
        case 'test-fail': edgeStyleName = 'sequence'; break;
        case 'unmarked': edgeStyleName = 'unmarked'; break;
        case 'custom': edgeStyleName = 'customedge'; break;
        case 'resultant': edgeStyleName = 'resultant'; break;
        default: edgeStyleName = 'customedge'; break;
      }
    }

    // Build label text
    let labelText = edge.label || '';
    if (!labelText && edge.type !== 'unmarked' && edge.type !== 'custom') {
      labelText = edge.type;
    }
    if (edge.orderNumber !== undefined) {
      labelText = `${edge.orderNumber}: ${labelText}`;
    }

    // Determine bend angle for parallel edges
    const bendAngle = edgeBendAngles.get(edge.id);

    // Self-loop
    if (edge.source === edge.target) {
      const labelPart = labelText
        ? ` node[above, font=\\scriptsize] {${escapeLaTeXText(labelText)}}`
        : '';
      tikz += `\\draw[${edgeStyleName}] (${sourceTikzId}) to[loop above, looseness=5]${labelPart} (${sourceTikzId});\n`;
      return;
    }

    // Label positioning
    const labelPosSuffix = edge.labelPosition === 'start' ? 'near start'
      : edge.labelPosition === 'end' ? 'near end'
        : 'midway';

    const labelPart = labelText
      ? ` node[${labelPosSuffix}, fill=white, inner sep=1pt, font=\\scriptsize] {${escapeLaTeXText(labelText)}}`
      : '';

    if (bendAngle !== undefined && bendAngle !== 0) {
      // Curved edge using bend
      const bendDir = bendAngle > 0 ? 'bend left' : 'bend right';
      const bendVal = Math.abs(bendAngle).toFixed(0);
      tikz += `\\draw[${edgeStyleName}] (${sourceTikzId}) to[${bendDir}=${bendVal}]${labelPart} (${targetTikzId});\n`;
    } else {
      // Straight edge using native node references
      tikz += `\\draw[${edgeStyleName}] (${sourceTikzId}) --${labelPart} (${targetTikzId});\n`;
    }
  });

  tikz += '\n\\end{tikzpicture}';

  return tikz;
};

// Export diagram as LaTeX
export const exportAsLaTeX = (diagram: Diagram) => {
  const { nodes, edges } = diagram;

  // Infer diagram type from content
  let inferredType = diagram.type;
  if (diagram.type === 'GENERIC' || !diagram.type) {
    const hasVocab = nodes.some(n => n.type === 'vocabulary');
    const hasPractice = nodes.some(n => n.type === 'practice');
    const hasTest = nodes.some(n => n.type === 'test');
    const hasOperate = nodes.some(n => n.type === 'operate');
    const hasMUDNodes = hasVocab || hasPractice;
    const hasTOTENodes = hasTest || hasOperate;
    const hasMUDEdges = edges.some(e => ['PV', 'VP', 'PP', 'VV'].includes(e.type));
    const hasTOTEEdges = edges.some(e => ['sequence', 'feedback', 'exit'].includes(e.type));

    if ((hasMUDNodes || hasMUDEdges) && (hasTOTENodes || hasTOTEEdges)) {
      inferredType = 'HYBRID';
    } else if (hasMUDNodes || hasMUDEdges) {
      inferredType = 'MUD';
    } else if (hasTOTENodes || hasTOTEEdges) {
      inferredType = 'TOTE';
    }
  }

  const tikzCode = generateTikZCode(nodes, edges, inferredType);

  const latexDocument = `\\documentclass[border=5mm]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{positioning, shapes.geometric, arrows.meta, fit, backgrounds}

\\begin{document}

${tikzCode}

\\end{document}`;

  const dataBlob = new Blob([latexDocument], { type: 'text/plain' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${diagram.name || 'pragma-graph'}.tex`;
  link.click();

  URL.revokeObjectURL(url);
};

// Import diagram from JSON file
export const importFromJSON = (onImport: ImportDiagramCallback) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonStr = e.target?.result as string;
        const importedData = JSON.parse(jsonStr);

        // Validate the diagram structure
        if (!importedData.nodes || !Array.isArray(importedData.nodes)) {
          throw new Error('Invalid diagram format: missing or invalid nodes array');
        }
        if (!importedData.edges || !Array.isArray(importedData.edges)) {
          throw new Error('Invalid diagram format: missing or invalid edges array');
        }

        // Entry/exit points are optional (for backward compatibility)
        if (importedData.entryPoints && !Array.isArray(importedData.entryPoints)) {
          throw new Error('Invalid diagram format: entryPoints must be an array');
        }
        if (importedData.exitPoints && !Array.isArray(importedData.exitPoints)) {
          throw new Error('Invalid diagram format: exitPoints must be an array');
        }

        // Validate node structure
        for (const node of importedData.nodes) {
          if (!node.id || !node.type || !node.position || !node.label) {
            throw new Error('Invalid node structure in diagram');
          }
          if (!['vocabulary', 'practice', 'test', 'operate', 'exit'].includes(node.type)) {
            throw new Error(`Invalid node type: ${node.type}`);
          }
        }

        // Validate edge structure
        for (const edge of importedData.edges) {
          if (!edge.id || !edge.type) {
            throw new Error('Invalid edge structure in diagram');
          }
          // Entry/exit edges can have null source/target
          if (edge.type !== 'entry' && edge.type !== 'exit') {
            if (!edge.source || !edge.target) {
              throw new Error('Invalid edge: missing source or target');
            }
          }
        }

        // Create proper diagram object
        const diagram: Diagram = {
          id: importedData.id || Date.now().toString(),
          name: importedData.name || 'Imported Diagram',
          type: importedData.type || 'HYBRID',
          nodes: importedData.nodes,
          edges: importedData.edges,
          entryPoints: importedData.entryPoints || [],
          exitPoints: importedData.exitPoints || [],
          metadata: {
            created: importedData.metadata?.created || new Date().toISOString(),
            modified: new Date().toISOString(),
            author: importedData.metadata?.author,
            description: importedData.metadata?.description
          }
        };

        // Confirm replacement and import
        if (confirm('This will replace your current diagram. Continue?')) {
          onImport(diagram);
        }

      } catch (error) {
        console.error('Failed to import diagram:', error);
        alert(`Failed to import diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    reader.readAsText(file);
  };

  input.click();
};
