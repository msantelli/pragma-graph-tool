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

  // Deduplicate edges to prevent double rendering
  const uniqueEdges = edges.filter((edge, index, self) =>
    index === self.findIndex((t) => (
      t.source === edge.source &&
      t.target === edge.target &&
      t.type === edge.type &&
      t.label === edge.label
    ))
  );

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
    // Only register colors for custom nodes or containers
    // Semantic nodes (vocabulary, practice, test, operate) use predefined stylistic colors
    const isSemantic = ['vocabulary', 'practice', 'test', 'operate'].includes(node.type);
    const children = getChildNodes(node.id, nodes);
    const isContainer = children.length > 0;

    if (!isSemantic || isContainer || node.type === 'custom') {
      registerColor(getNodeFillColor(node));
      registerColor(getNodeStrokeColor(node));
      registerColor(getNodeTextColor(node));
    }
  });

  colorMap.forEach((name, hex) => {
    // Convert hex to grayscale for academic style where possible, or keep as defined
    // For now, mapping everything to gray scale approximations if it looks like a color
    tikz += `\\definecolor{${name}}{HTML}{${hex}}\n`;
  });

  if (colorMap.size > 0) {
    tikz += '\n';
  }

  // Sort nodes for proper rendering and add with clean naming
  const sortedNodes = sortNodesForRendering(nodes);
  const nodeMap = new Map<string, string>(); // Map UUID -> nodeX

  // First pass: render containers as backgrounds
  tikz += '% Container backgrounds\n';
  sortedNodes.forEach((node, index) => {
    const children = getChildNodes(node.id, nodes);
    if (children.length === 0) return; // Not a container

    // Calculate container bounds based on children (returns pixel dimensions)
    const containerBounds = calculateContainerBounds(children, nodes);
    const parentPos = toAbsolutePosition(node, nodes);

    // Container center in absolute coordinates
    const containerCenterX = parentPos.x + containerBounds.centerX;
    const containerCenterY = parentPos.y + containerBounds.centerY;

    // Convert position to LaTeX coordinates (apply scale for position)
    const x = ((containerCenterX - centerX) * scale).toFixed(2);
    const y = (-(containerCenterY - centerY) * scale).toFixed(2);

    // Convert dimensions: pixel dimensions / 40 = cm (same as regular nodes)
    const widthCm = (containerBounds.width / 40).toFixed(2);
    const heightCm = (containerBounds.height / 40).toFixed(2);

    const strokeColorName = registerColor(getNodeStrokeColor(node));
    const fillColorName = registerColor(getNodeFillColor(node));

    // Register container ID for edges (though usually edges go to content)
    const containerId = `container${index + 1}`;
    nodeMap.set(node.id, containerId);

    // Render container as solid rectangle with label above (removed dashed)
    tikz += `\\node[rectangle, rounded corners=4pt, draw=${strokeColorName}, fill=${fillColorName}, fill opacity=0.15, minimum width=${widthCm}cm, minimum height=${heightCm}cm] (${containerId}) at (${x}, ${y}) {};\n`;
    tikz += `\\node[above=0.1cm of ${containerId}, font=\\small] {${escapeLaTeXText(node.label)}};\n`;
  });

  tikz += '\n% Nodes\n';
  sortedNodes.forEach((node, index) => {
    const children = getChildNodes(node.id, nodes);
    if (children.length > 0) return; // Skip containers

    const pos = toAbsolutePosition(node, nodes);
    const x = ((pos.x - centerX) * scale).toFixed(2);
    const y = (-(pos.y - centerY) * scale).toFixed(2);

    let labelContent = escapeLaTeXText(node.label);
    if (node.secondaryLabel) {
      labelContent += `\\\\ ${escapeLaTeXText(node.secondaryLabel)}`;
    }
    if (node.subscript) {
      labelContent = `$\\text{${labelContent}}_{\\text{${escapeLaTeXText(node.subscript)}}}$`;
    } else if (isLaTeXContent(node.label)) {
      // Detect if user likely wants math mode but hasn't fully wrapped it, or if it's already wrapped
      const trimmed = node.label.trim();
      const isWrapped = trimmed.startsWith('$') && trimmed.endsWith('$');

      if (!isWrapped && (node.label.includes('_') || node.label.includes('^'))) {
        labelContent = `$${labelContent}$`;
      }
    }

    const nodeId = `node${index + 1}`;
    nodeMap.set(node.id, nodeId);

    const dimensions = getNodeDimensions(node);
    const widthCm = (dimensions.width / 40).toFixed(2);
    const heightCm = (dimensions.height / 40).toFixed(2);

    let nodeStyle = '';
    switch (node.type) {
      case 'vocabulary':
        nodeStyle = `ellipse, fill=vocabfill, draw=vocabcolor, text=textcolor, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
      case 'practice':
        nodeStyle = `rectangle, rounded corners=3pt, fill=practicefill, draw=practicecolor, text=textcolor, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
      case 'test':
        nodeStyle = `diamond, fill=testfill, draw=testcolor, text=textcolor, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
      case 'operate':
        nodeStyle = `rectangle, fill=operatefill, draw=operatecolor, text=textcolor, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
      case 'custom':
      default:
        const fillColorName = registerColor(getNodeFillColor(node));
        const strokeColorName = registerColor(getNodeStrokeColor(node));
        const textColorName = registerColor(getNodeTextColor(node));
        const shape = node.style?.shape || 'circle';

        let shapeStyle = 'circle';
        if (shape === 'rectangle') shapeStyle = 'rectangle, rounded corners=3pt';
        else if (shape === 'ellipse') shapeStyle = 'ellipse';
        else if (shape === 'diamond') shapeStyle = 'diamond';

        nodeStyle = `${shapeStyle}, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=${widthCm}cm, minimum height=${heightCm}cm`;
        break;
    }

    nodeStyle += ', align=center';
    tikz += `\\node[${nodeStyle}] (${nodeId}) at (${x}, ${y}) {${labelContent}};\n`;
  });

  const convertPoint = (point: Point) => ({
    x: ((point.x - centerX) * scale).toFixed(2),
    y: (-(point.y - centerY) * scale).toFixed(2)
  });

  tikz += '\n% Edges\n';
  uniqueEdges.forEach((edge, edgeIndex) => {
    const sourceId = nodeMap.get(edge.source);
    const targetId = nodeMap.get(edge.target);

    // If nodes not found (e.g. filtered out), skip
    if (!sourceId || !targetId) return;

    // We still use computeEdgeGeometry to get control points for curves
    const geometry = computeEdgeGeometryForExport(edge, nodes, uniqueEdges);
    if (!geometry) return;

    const styleParts = ['->', 'thick'];
    if (edge.isResultant) {
      styleParts.push('dashed');
    }

    // Coloring (keep existing logic but default to black for academic)
    // Actually, user wants academic look. So force black mostly?
    // User verified 'academic colors'.
    // In our manual .tex we used 'black' or 'red!70!black'.
    // Let's keep the color logic but maybe simplify or make it overridable.
    // For now, I'll keep the existing color logic as it mapped to TikZ colors which we can redefine globally if needed.
    // But wait, the manual .tex used 'black' for most.

    switch (edge.type) {
      case 'VV': styleParts.push('red!70!black'); break; // Keep distinctive
      case 'unmarked': styleParts.push('gray!50'); break;
      default: styleParts.push('black'); break; // Default everything else to black
    }

    const edgeStyle = styleParts.join(', ');

    // Use ANCHORING: (sourceId) -- (targetId)
    // Use control points if curve/loop

    let path = '';
    if (geometry.type === 'curve' && geometry.control) {
      const control = convertPoint(geometry.control);
      path = `(${sourceId}) .. controls (${control.x}, ${control.y}) .. (${targetId})`;
    } else if (geometry.type === 'loop' && geometry.control && geometry.control2) {
      const control1 = convertPoint(geometry.control);
      const control2 = convertPoint(geometry.control2);
      // For loops, we need to respect the entry/exit angles which control points define
      // Using (node) .. controls .. (node) works but might not look like a loop if start/end are same center.
      // Ideally use specific anchors or coordinates for loops.
      // But 'computeLoopEdgeGeometry' returns start/end on the border.
      // Let's stick to coordinates for LOOPS only, as anchoring a loop to center-center is weird.
      const start = convertPoint(geometry.start);
      const end = convertPoint(geometry.end);
      path = `(${start.x}, ${start.y}) .. controls (${control1.x}, ${control1.y}) and (${control2.x}, ${control2.y}) .. (${end.x}, ${end.y})`;
    } else {
      // Straight edge
      path = `(${sourceId}) -- (${targetId})`;
    }

    tikz += `\\draw[${edgeStyle}] ${path};\n`;

    // Labels
    let labelText = edge.label || (edge.type === 'unmarked' || edge.type === 'custom' ? '' : edge.type);

    // Auto-numbering: Add index + 1
    // Note: User manual fix used 1..N.
    // We can use edgeIndex + 1.
    if (labelText) {
      labelText = `${edgeIndex + 1}: ${labelText}`;
    }

    if (labelText) {
      // Position label
      // We use the computed label position from geometry, which is accurate enough
      const labelPos = convertPoint(geometry.labelPosition);
      const rotate = geometry.labelAngle ? `rotate=${geometry.labelAngle.toFixed(2)}` : '';

      tikz += `  \\node[font=\\scriptsize, fill=white, inner sep=1pt${rotate ? ', ' + rotate : ''}] at (${labelPos.x}, ${labelPos.y}) {${escapeLaTeXText(labelText)}};\n`;
    }
  });

  tikz += `\n\\end{tikzpicture}`;
  return tikz;
};

// Export diagram as LaTeX
export const exportAsLaTeX = (diagram: Diagram) => {
  const { nodes, edges } = diagram;
  const tikzCode = generateTikZCode(nodes, edges);

  // Generate diagram metadata



  const latexDocument = `\\documentclass[tikz,border=2pt]{standalone}
\\usepackage{amsmath} % For \\text command
\\usetikzlibrary{positioning,shapes.geometric,arrows.meta,fit,backgrounds}

% Academic color palette (grayscale/monochrome)
\\definecolor{vocabcolor}{gray}{0.0}      % Black borders
\\definecolor{practicecolor}{gray}{0.0}    % Black borders
\\definecolor{testcolor}{gray}{0.0}        % Black borders
\\definecolor{operatecolor}{gray}{0.0}     % Black borders

% Node fill colors (light grays)
\\definecolor{vocabfill}{gray}{1.0}
\\definecolor{practicefill}{gray}{0.9}
\\definecolor{testfill}{gray}{0.95}
\\definecolor{operatefill}{gray}{0.85}

% Text color
\\definecolor{textcolor}{gray}{0.2}

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
