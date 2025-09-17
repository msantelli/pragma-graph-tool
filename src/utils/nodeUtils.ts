import type { Node } from '../types/all';

const DEFAULT_NODE_COLORS: Record<string, { background: string; border: string }> = {
  vocabulary: { background: '#E3F2FD', border: '#1976D2' },
  practice: { background: '#FFF3E0', border: '#F57C00' },
  test: { background: '#E8F5E8', border: '#4CAF50' },
  operate: { background: '#FFF8E1', border: '#FFC107' },
  exit: { background: '#FFEBEE', border: '#F44336' },
  custom: { background: '#F5F5F5', border: '#757575' }
};

const normalizeHexColor = (value: string | undefined, fallback: string): string => {
  const source = (value ?? fallback).trim();

  if (source.startsWith('#')) {
    let hex = source.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(ch => ch + ch).join('');
    }
    if (hex.length === 6) {
      return `#${hex.toUpperCase()}`;
    }
  }

  const rgbMatch = source.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1, 4).map(component => {
      const parsed = parseInt(component, 10);
      return Math.min(255, Math.max(0, parsed));
    });

    const hex = [r, g, b]
      .map(component => component.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    return `#${hex}`;
  }

  const fallbackHex = fallback.startsWith('#') ? fallback : `#${fallback}`;
  return fallbackHex.slice(0, 7).padEnd(7, '0').toUpperCase();
};

export const getNodeColors = (node: Node) => {
  const defaults = DEFAULT_NODE_COLORS[node.type] || DEFAULT_NODE_COLORS.vocabulary;
  return {
    background: node.style?.backgroundColor || defaults.background,
    border: node.style?.borderColor || defaults.border
  };
};

export const getNodeFillColor = (node: Node): string => {
  const defaults = DEFAULT_NODE_COLORS[node.type] || DEFAULT_NODE_COLORS.vocabulary;
  return normalizeHexColor(node.style?.backgroundColor, defaults.background);
};

export const getNodeStrokeColor = (node: Node): string => {
  const defaults = DEFAULT_NODE_COLORS[node.type] || DEFAULT_NODE_COLORS.vocabulary;
  return normalizeHexColor(node.style?.borderColor, defaults.border);
};

export const getNodeTextColor = (node: Node): string => normalizeHexColor(node.style?.textColor, '#333333');

export const getNodeShape = (node: Node): string => {
  if (node.style?.shape) {
    return node.style.shape;
  }

  const defaultShapes = {
    vocabulary: 'ellipse',
    practice: 'rectangle',
    test: 'diamond',
    operate: 'rectangle',
    exit: 'rectangle',
    custom: 'circle'
  };

  return defaultShapes[node.type] || 'circle';
};

export const getNodeDimensions = (node: Node) => {
  const size = node.style?.size || 'medium';
  const sizeMultiplier = size === 'small' ? 0.8 : size === 'large' ? 1.3 : 1;
  const shape = getNodeShape(node);

  if (shape === 'diamond' || node.type === 'test') {
    const baseSize = 70;
    const adjustedSize = Math.round(baseSize * sizeMultiplier);
    return {
      width: adjustedSize,
      height: adjustedSize,
      radius: adjustedSize / 2
    };
  } else if (shape === 'circle') {
    const baseRadius = 40;
    const adjustedRadius = Math.round(baseRadius * sizeMultiplier);
    return {
      width: adjustedRadius * 2,
      height: adjustedRadius * 2,
      radius: adjustedRadius
    };
  } else {
    const baseWidth = 100;
    const baseHeight = 50;
    return {
      width: Math.round(baseWidth * sizeMultiplier),
      height: Math.round(baseHeight * sizeMultiplier),
      radius: Math.round(25 * sizeMultiplier)
    };
  }
};

export const getNodeFontSize = (node: Node): number => {
  if (node.style?.fontSize) {
    return node.style.fontSize;
  }

  const size = node.style?.size || 'medium';
  switch (size) {
    case 'small':
      return 12;
    case 'large':
      return 18;
    default:
      return 14;
  }
};
