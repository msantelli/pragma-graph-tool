import React from 'react';

interface LegendProps {
  diagramMode: 'MUD' | 'TOTE' | 'HYBRID' | 'GENERIC';
  isCollapsed: boolean;
  onToggle: () => void;
}

const nodeTypes = {
  MUD: [
    { name: 'Vocabulary', shape: 'ellipse', color: '#333333', description: 'Linguistic/conceptual vocabulary' },
    { name: 'Practice', shape: 'rounded-rect', color: '#333333', description: 'Ability, skill, or behavior' },
  ],
  TOTE: [
    { name: 'Test', shape: 'diamond', color: '#333333', description: 'Condition check / decision point' },
    { name: 'Operate', shape: 'rectangle', color: '#333333', description: 'Action or operation' },
  ],
  HYBRID: [
    { name: 'Vocabulary', shape: 'ellipse', color: '#333333', description: 'Linguistic/conceptual vocabulary' },
    { name: 'Practice', shape: 'rounded-rect', color: '#333333', description: 'Ability, skill, or behavior' },
    { name: 'Test', shape: 'diamond', color: '#333333', description: 'Condition check / decision point' },
    { name: 'Operate', shape: 'rectangle', color: '#333333', description: 'Action or operation' },
  ],
  GENERIC: [
    { name: 'Custom', shape: 'circle', color: '#555555', description: 'Generic node' },
  ],
};

const edgeTypes = {
  MUD: [
    { name: 'PV', color: '#333333', description: 'Practice → Vocabulary (deployment)' },
    { name: 'VP', color: '#333333', description: 'Vocabulary → Practice (elaboration)' },
    { name: 'PP', color: '#333333', description: 'Practice → Practice (presupposition)' },
    { name: 'VV', color: '#333333', description: 'Vocabulary → Vocabulary (entailment)' },
  ],
  TOTE: [
    { name: 'Sequence', color: '#333333', description: 'Flow from Test to Operate' },
    { name: 'Feedback', color: '#333333', description: 'Return from Operate to Test' },
    { name: 'Exit', color: '#333333', description: 'Exit from Test when condition met' },
  ],
  HYBRID: [
    { name: 'PV', color: '#333333', description: 'Practice → Vocabulary' },
    { name: 'VP', color: '#333333', description: 'Vocabulary → Practice' },
    { name: 'PP', color: '#333333', description: 'Practice → Practice' },
    { name: 'VV', color: '#333333', description: 'Vocabulary → Vocabulary' },
    { name: 'Sequence', color: '#333333', description: 'TOTE sequence flow' },
    { name: 'Feedback', color: '#333333', description: 'TOTE feedback loop' },
  ],
  GENERIC: [
    { name: 'Custom', color: '#555555', description: 'Generic edge' },
  ],
};

// Shape renderers
const ShapeIcon: React.FC<{ shape: string; color: string; size?: number }> = ({ shape, color, size = 16 }) => {
  switch (shape) {
    case 'ellipse':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="10" ry="6" fill={color} stroke={color} strokeWidth="1" fillOpacity="0.3" />
        </svg>
      );
    case 'rounded-rect':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="12" rx="4" fill={color} stroke={color} strokeWidth="1" fillOpacity="0.3" />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 2l10 10-10 10L2 12 12 2z" fill={color} stroke={color} strokeWidth="1" fillOpacity="0.3" />
        </svg>
      );
    case 'rectangle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x="2" y="4" width="20" height="16" fill={color} stroke={color} strokeWidth="1" fillOpacity="0.3" />
        </svg>
      );
    case 'circle':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill={color} stroke={color} strokeWidth="1" fillOpacity="0.3" />
        </svg>
      );
  }
};

export const Legend: React.FC<LegendProps> = ({ diagramMode, isCollapsed, onToggle }) => {
  const nodes = nodeTypes[diagramMode];
  const edges = edgeTypes[diagramMode];

  return (
    <div style={{
      position: 'absolute',
      bottom: '1rem',
      left: '1rem',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      fontSize: '0.75rem',
      maxWidth: isCollapsed ? '40px' : '280px',
      transition: 'all 0.2s ease',
      overflow: 'hidden',
      zIndex: 100,
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          cursor: 'pointer',
          background: '#f5f5f5',
          borderBottom: isCollapsed ? 'none' : '1px solid #e0e0e0',
        }}
      >
        {!isCollapsed && (
          <span style={{ fontWeight: 600, color: '#333' }}>Legend</span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#666"
          strokeWidth="2"
          style={{
            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div style={{ padding: '0.75rem' }}>
          {/* Node Types */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#999',
              marginBottom: '0.4rem'
            }}>
              Node Types
            </div>
            {nodes.map(node => (
              <div key={node.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0',
              }}>
                <ShapeIcon shape={node.shape} color={node.color} />
                <div>
                  <div style={{ fontWeight: 500, color: '#333' }}>{node.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#888' }}>{node.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Edge Types */}
          <div>
            <div style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#999',
              marginBottom: '0.4rem'
            }}>
              Edge Types
            </div>
            {edges.map(edge => (
              <div key={edge.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0',
              }}>
                <svg width="20" height="16" viewBox="0 0 24 16">
                  <line x1="2" y1="8" x2="18" y2="8" stroke={edge.color} strokeWidth="2" />
                  <polygon points="22,8 16,4 16,12" fill={edge.color} />
                </svg>
                <div>
                  <div style={{ fontWeight: 500, color: '#333' }}>{edge.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#888' }}>{edge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Legend;
