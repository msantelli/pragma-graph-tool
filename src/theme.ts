/**
 * Print-room chrome tokens for JS consumers (inline styles, D3 attributes,
 * SVG presentation attributes that cannot resolve CSS variables).
 * Values mirror the custom properties in src/index.css — keep in sync.
 *
 * These color the INSTRUMENT only. Diagram content colors (node fills,
 * edge ink) live in @pragma-graph/core so exports stay identical.
 */
export const theme = {
  paper: '#FBFAF8',
  ink: '#1F1E1C',
  inkMuted: '#6D6A64',
  hairline: '#E3E1DC',
  cloth: '#27476E',
  clothHover: '#1D3A5D',
  annotation: '#A63A2B',
  /* selection halo: annotation at low alpha, canvas-only */
  annotationHalo: 'rgba(166, 58, 43, 0.35)'
} as const;
