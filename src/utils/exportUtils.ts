import { getNodeFontSize, getNodeFillColor, getNodeStrokeColor, getNodeTextColor, getNodeDimensions, getNodeShape } from './nodeUtils';
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

const getNodeConnectionPointForExport = (node: Node, targetPos: Point): Point => {
  const { x: nodeX, y: nodeY } = node.position;
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

const computeCurvedEdgeGeometry = (sourceNode: Node, targetNode: Node, offset: number): ExportEdgeGeometry => {
  const midX = (sourceNode.position.x + targetNode.position.x) / 2;
  const midY = (sourceNode.position.y + targetNode.position.y) / 2;
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    const start = sourceNode.position;
    const end = targetNode.position;
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
  const start = getNodeConnectionPointForExport(sourceNode, controlPos);
  const end = getNodeConnectionPointForExport(targetNode, controlPos);
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

const computeStraightEdgeGeometry = (sourceNode: Node, targetNode: Node): ExportEdgeGeometry => {
  const start = getNodeConnectionPointForExport(sourceNode, targetNode.position);
  const end = getNodeConnectionPointForExport(targetNode, sourceNode.position);
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

const computeLoopEdgeGeometry = (node: Node): ExportEdgeGeometry => {
  const dimensions = getNodeDimensions(node);
  const shape = getNodeShape(node);

  let loopStartX: number;
  let loopStartY: number;
  let loopEndX: number;
  let loopEndY: number;

  if (shape === 'rectangle') {
    loopStartX = node.position.x + dimensions.width / 2;
    loopStartY = node.position.y - dimensions.height / 4;
    loopEndX = node.position.x + dimensions.width / 2;
    loopEndY = node.position.y + dimensions.height / 4;
  } else {
    const radius = dimensions.radius;
    loopStartX = node.position.x + radius * 0.7;
    loopStartY = node.position.y - radius * 0.7;
    loopEndX = node.position.x + radius * 0.7;
    loopEndY = node.position.y + radius * 0.7;
  }

  const loopSize = Math.max(dimensions.width, dimensions.height) * 0.8;
  const control1 = { x: loopStartX + loopSize, y: loopStartY };
  const control2 = { x: loopEndX + loopSize, y: loopEndY };
  const path = `M ${loopStartX} ${loopStartY} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${loopEndX} ${loopEndY}`;

  const labelPosition = {
    x: node.position.x + Math.max(dimensions.width, dimensions.height) * 0.8,
    y: node.position.y - Math.max(dimensions.height, 40) * 0.6
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
    return computeLoopEdgeGeometry(sourceNode);
  }

  const offset = getEdgeOffsetForExport(edge, allEdges);

  if (offset === 0) {
    return computeStraightEdgeGeometry(sourceNode, targetNode);
  }

  return computeCurvedEdgeGeometry(sourceNode, targetNode, offset);
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
    const padding = 100; // Add padding around nodes
    minX = Math.min(minX, node.position.x - padding);
    minY = Math.min(minY, node.position.y - padding);
    maxX = Math.max(maxX, node.position.x + padding);
    maxY = Math.max(maxY, node.position.y + padding);
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

  // Add nodes
  nodes.forEach(node => {
    const fillColor = getNodeFillColor(node);
    const strokeColor = getNodeStrokeColor(node);
    const textColor = getNodeTextColor(node);
    const dimensions = getNodeDimensions(node);
    const shape = node.style?.shape || getNodeShape(node);

    const cx = node.position.x;
    const cy = node.position.y;

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
    case 'PV': return '#4CAF50';
    case 'VP': return '#FF9800';
    case 'PP': return '#9C27B0';
    case 'VV': return '#F44336';
    case 'sequence': return '#2196F3';
    case 'feedback': return '#FF5722';
    case 'loop': return '#607D8B';
    case 'exit': return '#8BC34A';
    case 'entry': return '#4CAF50';
    default: return '#666';
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
const generateTikZCode = (nodes: Node[], edges: Edge[]): string => {
  if (nodes.length === 0) return '\\begin{tikzpicture}\n\\end{tikzpicture}';
  
  // Calculate bounds and normalize coordinates
  const bounds = calculateDiagramBounds(nodes);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  
  // Scale to fit within reasonable LaTeX coordinates (roughly -10 to 10)
  const maxDimension = Math.max(bounds.width, bounds.height);
  const scale = maxDimension > 0 ? 15 / maxDimension : 1; // Target max coordinate of ±7.5
  
  let tikz = `\\begin{tikzpicture}\n\n`;

  const colorMap = new Map<string, string>();
  const registerColor = (color: string): string => {
    const normalized = (color || '#000000').replace('#', '').slice(0, 6).padEnd(6, '0').toUpperCase();
    if (!colorMap.has(normalized)) {
      colorMap.set(normalized, `customcolor${colorMap.size + 1}`);
    }
    return colorMap.get(normalized)!;
  };

  nodes.forEach(node => {
    registerColor(getNodeFillColor(node));
    registerColor(getNodeStrokeColor(node));
    registerColor(getNodeTextColor(node));
  });

  colorMap.forEach((name, hex) => {
    tikz += `\\definecolor{${name}}{HTML}{${hex}}\n`;
  });

  if (colorMap.size > 0) {
    tikz += '\n';
  }

  // Add nodes with clean naming and normalized coordinates
  tikz += '% Nodes\n';
  nodes.forEach((node, index) => {
    // Normalize coordinates relative to center and scale appropriately
    const x = ((node.position.x - centerX) * scale).toFixed(2);
    const y = (-(node.position.y - centerY) * scale).toFixed(2); // Flip Y axis for LaTeX
    const label = escapeLaTeXText(node.label);
    const nodeId = `node${index + 1}`; // Clean, readable node names
    const fillColorName = registerColor(getNodeFillColor(node));
    const strokeColorName = registerColor(getNodeStrokeColor(node));
    const textColorName = registerColor(getNodeTextColor(node));
    const dimensions = getNodeDimensions(node);
    const widthCm = (dimensions.width / 40).toFixed(2);
    const heightCm = (dimensions.height / 40).toFixed(2);

    let nodeStyle = '';
    switch (node.type) {
      case 'vocabulary':
        nodeStyle = `ellipse, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
      case 'practice':
        nodeStyle = `rectangle, rounded corners=3pt, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
      case 'test':
        nodeStyle = `diamond, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
      case 'operate':
        nodeStyle = `rectangle, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
      case 'custom':
        nodeStyle = `circle, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum size=${widthCm}cm`;
        break;
      default:
        nodeStyle = `circle, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum size=${widthCm}cm`;
        break;
    }

    tikz += `\\node[${nodeStyle}] (${nodeId}) at (${x}, ${y}) {${label}};\n`;
  });
  
  const convertPoint = (point: Point) => ({
    x: ((point.x - centerX) * scale).toFixed(2),
    y: (-(point.y - centerY) * scale).toFixed(2)
  });

  tikz += '\n% Edges\n';
  edges.forEach(edge => {
    const geometry = computeEdgeGeometryForExport(edge, nodes, edges);
    if (!geometry) return;

    const styleParts = ['->', 'thick'];
    if (edge.isResultant) {
      styleParts.push('dashed');
    }

    switch (edge.type) {
      case 'PV': styleParts.push('green!70!black'); break;
      case 'VP': styleParts.push('orange!80!black'); break;
      case 'PP': styleParts.push('purple!70!black'); break;
      case 'VV': styleParts.push('red!70!black'); break;
      case 'sequence': styleParts.push('blue!70!black'); break;
      case 'feedback': styleParts.push('red!70!black'); break;
      case 'loop': styleParts.push('gray!70!black'); break;
      case 'unmarked': styleParts.push('gray!50'); break;
      case 'custom': styleParts.push('black'); break;
      default: styleParts.push('black'); break;
    }

    const edgeStyle = styleParts.join(', ');
    const start = convertPoint(geometry.start);
    const end = convertPoint(geometry.end);

    if (geometry.type === 'curve' && geometry.control) {
      const control = convertPoint(geometry.control);
      tikz += `\\draw[${edgeStyle}] (${start.x}, ${start.y}) .. controls (${control.x}, ${control.y}) .. (${end.x}, ${end.y});\n`;
    } else if (geometry.type === 'loop' && geometry.control && geometry.control2) {
      const control1 = convertPoint(geometry.control);
      const control2 = convertPoint(geometry.control2);
      tikz += `\\draw[${edgeStyle}] (${start.x}, ${start.y}) .. controls (${control1.x}, ${control1.y}) and (${control2.x}, ${control2.y}) .. (${end.x}, ${end.y});\n`;
    } else {
      tikz += `\\draw[${edgeStyle}] (${start.x}, ${start.y}) -- (${end.x}, ${end.y});\n`;
    }

    const labelText = edge.label || (edge.type === 'unmarked' || edge.type === 'custom' ? '' : edge.type);
    if (!labelText) return;

    const labelPoint = convertPoint(geometry.labelPosition);
    const angle = geometry.labelAngle !== null ? geometry.labelAngle.toFixed(2) : null;
    const rotateOption = angle ? `, rotate=${angle}` : '';

    tikz += `  \\node[font=\\scriptsize, fill=white, inner sep=1pt${rotateOption}] at (${labelPoint.x}, ${labelPoint.y}) {${escapeLaTeXText(labelText)}};\n`;
  });
  
  tikz += '\n\\end{tikzpicture}';
  
  return tikz;
};

// Export diagram as LaTeX
export const exportAsLaTeX = (diagram: Diagram) => {
  const { nodes, edges } = diagram;
  const tikzCode = generateTikZCode(nodes, edges);
  
  // Generate diagram metadata
  const diagramTitle = diagram.name || 'Pragma Graph Diagram';
  const hasVocab = nodes.some(n => n.type === 'vocabulary');
  const hasPractice = nodes.some(n => n.type === 'practice');
  const hasTest = nodes.some(n => n.type === 'test');
  const hasOperate = nodes.some(n => n.type === 'operate');
  const hasResultant = edges.some(e => e.isResultant);
  
  const latexDocument = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{tikz}
\\usepackage{caption}
\\usetikzlibrary{positioning,shapes.geometric,arrows.meta}

% Define academic-friendly colors
\\definecolor{vocabcolor}{RGB}{25,118,210}
\\definecolor{practicecolor}{RGB}{245,124,0}
\\definecolor{testcolor}{RGB}{76,175,80}
\\definecolor{operatecolor}{RGB}{255,193,7}

\\begin{document}

\\title{${escapeLaTeXText(diagramTitle)}}
\\author{Generated by Pragma Graph Tool}
\\date{\\today}
\\maketitle

\\begin{figure}[h]
\\centering
${tikzCode}
\\caption{${escapeLaTeXText(diagramTitle)} - ${diagram.type} diagram showing ${nodes.length} nodes and ${edges.length} edges.}
\\end{figure}

% Uncomment the following section to include a legend
% \\section*{Legend}
% \\begin{itemize}
${hasVocab ? '% \\item \\textcolor{vocabcolor}{\\textbf{Vocabulary nodes}} (ellipses): Represent linguistic or conceptual vocabularies' : ''}
${hasPractice ? '% \\item \\textcolor{practicecolor}{\\textbf{Practice nodes}} (rounded rectangles): Represent abilities, skills, or behavioral patterns' : ''}
${hasTest ? '% \\item \\textcolor{testcolor}{\\textbf{Test nodes}} (diamonds): Represent condition checking or decision points in TOTE cycles' : ''}
${hasOperate ? '% \\item \\textcolor{operatecolor}{\\textbf{Operate nodes}} (rectangles): Represent actions or operations in TOTE cycles' : ''}
${hasResultant ? '% \\item \\textbf{Dashed edges}: Resultant relationships (derived or indirect)' : ''}
% \\item \\textbf{Solid edges}: Direct relationships between nodes
% \\end{itemize}

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
