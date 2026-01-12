// Inline types to avoid import issues
export interface EdgeStyle {
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  strokeWidth: number;
  color: string;
  arrowType: 'default' | 'hollow' | 'filled';
}

export type EdgeType =
  | 'PV' | 'VP' | 'PP' | 'VV'
  | 'PV-suff' | 'PV-nec' | 'VP-suff' | 'VP-nec' | 'PP-suff' | 'PP-nec' | 'VV-suff' | 'VV-nec'
  | 'resultant' | 'feedback' | 'exit' | 'test-pass' | 'test-fail'
  | 'sequence' | 'loop' | 'entry' | 'unmarked' | 'custom';

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  style?: EdgeStyle;
  isResultant?: boolean;
  resultantFrom?: string[]; // For resultant MURs - IDs of the source edges
  // Optional: Label fine-tuning
  showLabelBackground?: boolean;
  labelOffset?: { x: number; y: number };
  orderNumber?: number;
  labelPosition?: 'start' | 'middle' | 'end';
}