import { getNodeFontSize, getNodeFillColor, getNodeStrokeColor, getNodeTextColor } from './nodeUtils';
import type { Diagram, Node, Edge } from '../types/all';

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

  // Add edges
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    const strokeDasharray = edge.isResultant ? '5,5' : 'none';
    const edgeColor = getEdgeColorSVG(edge.type);
    
    svgContent += `  <line x1="${sourceNode.position.x}" y1="${sourceNode.position.y}" 
                        x2="${targetNode.position.x}" y2="${targetNode.position.y}" 
                        stroke="${edgeColor}" stroke-width="2" 
                        stroke-dasharray="${strokeDasharray}" 
                        marker-end="url(#arrowhead)" />
`;
    
    // Add edge label
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2 - 10;
    const label = edge.label || edge.type;
    
    svgContent += `  ${generateSVGText(label, midX, midY, 12, edgeColor, 'edge-text')}
`;
  });

  svgContent += `  
  <!-- Nodes -->
`;

  // Add nodes
  nodes.forEach(node => {
    const fillColor = getNodeFillColor(node);
    const strokeColor = getNodeStrokeColor(node);
    
    if (node.type === 'vocabulary') {
      svgContent += `  <ellipse cx="${node.position.x}" cy="${node.position.y}" 
                               rx="60" ry="40" 
                               fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />
`;
    } else if (node.type === 'practice') {
      svgContent += `  <rect x="${node.position.x - 60}" y="${node.position.y - 30}" 
                           width="120" height="60" rx="10" 
                           fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />
`;
    } else if (node.type === 'test') {
      const diamond = `M ${node.position.x},${node.position.y - 40} L ${node.position.x + 50},${node.position.y} L ${node.position.x},${node.position.y + 40} L ${node.position.x - 50},${node.position.y} Z`;
      svgContent += `  <path d="${diamond}" 
                           fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />
`;
    } else if (node.type === 'operate') {
      svgContent += `  <rect x="${node.position.x - 50}" y="${node.position.y - 25}" 
                           width="100" height="50" 
                           fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" />
`;
    }
    
    // Add node text
    const nodeFontSize = getNodeFontSize(node);
    const textColor = getNodeTextColor(node);
    const maxWidth = node.style?.size === 'small' ? 70 : node.style?.size === 'large' ? 140 : 100;
    svgContent +=
      '  ' +
      generateSVGText(
        node.label,
        node.position.x,
        node.position.y,
        nodeFontSize,
        textColor,
        'node-text',
        maxWidth
      ) +
      '\n';
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

    let nodeStyle = '';
    switch (node.type) {
      case 'vocabulary':
        nodeStyle = `ellipse, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=2.5cm, minimum height=1.5cm`;
        break;
      case 'practice':
        nodeStyle = `rectangle, rounded corners=3pt, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=2.5cm, minimum height=1.2cm`;
        break;
      case 'test':
        nodeStyle = `diamond, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=2cm, minimum height=2cm`;
        break;
      case 'operate':
        nodeStyle = `rectangle, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum width=2cm, minimum height=1cm`;
        break;
      case 'custom':
        nodeStyle = `circle, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum size=1.5cm`;
        break;
      default:
        nodeStyle = `circle, fill=${fillColorName}, draw=${strokeColorName}, text=${textColorName}, minimum size=1.5cm`;
        break;
    }

    tikz += `\\node[${nodeStyle}] (${nodeId}) at (${x}, ${y}) {${label}};\n`;
  });
  
  tikz += '\n% Edges\n';
  edges.forEach(edge => {
    const sourceIndex = nodes.findIndex(n => n.id === edge.source);
    const targetIndex = nodes.findIndex(n => n.id === edge.target);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const sourceNodeId = `node${sourceIndex + 1}`;
    const targetNodeId = `node${targetIndex + 1}`;
    
    let edgeStyle = '->';
    let edgeOptions = '';
    
    // Add edge type specific styling
    if (edge.isResultant) {
      edgeOptions += 'dashed, ';
    }
    
    switch (edge.type) {
      case 'PV': edgeOptions += 'green!70!black, thick'; break;
      case 'VP': edgeOptions += 'orange!80!black, thick'; break;
      case 'PP': edgeOptions += 'purple!70!black, thick'; break;
      case 'VV': edgeOptions += 'red!70!black, thick'; break;
      case 'sequence': edgeOptions += 'blue!70!black, thick'; break;
      case 'feedback': edgeOptions += 'red!70!black, thick'; break;
      case 'loop': edgeOptions += 'gray!70!black, thick'; break;
      case 'unmarked': edgeOptions += 'gray!50, thick'; break;
      case 'custom': edgeOptions += 'black, thick'; break;
      default: edgeOptions += 'black, thick';
    }
    
    // Handle edge labels
    let labelText = '';
    if (edge.label) {
      labelText = escapeLaTeXText(edge.label);
    } else if (edge.type !== 'unmarked' && edge.type !== 'custom') {
      labelText = edge.type;
    }
    
    const labelNode = labelText ? ` node[midway, above, sloped, fill=white, inner sep=1pt] {\\small \\textbf{${labelText}}}` : '';
    
    tikz += `\\draw[${edgeOptions}] (${sourceNodeId}) ${edgeStyle} (${targetNodeId})${labelNode};\n`;
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
