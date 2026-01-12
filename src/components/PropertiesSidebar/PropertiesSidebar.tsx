import React from 'react';
import type { Node, Edge } from '../../types/all';

interface PropertiesSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeUpdate: (id: string, updates: Partial<Node>) => void;
  onEdgeUpdate: (id: string, updates: Partial<Edge>) => void;
  onOpenNodeCustomization: () => void;
  onOpenEdgeModification: () => void;
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  isOpen,
  onToggle,
  selectedNode,
  selectedEdge,
  onNodeUpdate,
  onEdgeUpdate,
  onOpenNodeCustomization,
  onOpenEdgeModification,
}) => {
  const hasSelection = selectedNode || selectedEdge;

  return (
    <div style={{
      width: isOpen ? '280px' : '40px',
      height: '100%',
      background: 'white',
      borderLeft: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          padding: '0.75rem',
          background: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          cursor: 'pointer',
          minHeight: '48px',
        }}
      >
        {isOpen && (
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>
            Properties
          </span>
        )}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#666"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          {!hasSelection ? (
            <div style={{
              textAlign: 'center',
              color: '#999',
              padding: '2rem 1rem',
            }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ opacity: 0.3, marginBottom: '0.5rem' }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Select a node or edge to view its properties
              </p>
            </div>
          ) : selectedNode ? (
            <NodeProperties
              node={selectedNode}
              onUpdate={onNodeUpdate}
              onOpenCustomization={onOpenNodeCustomization}
            />
          ) : selectedEdge ? (
            <EdgeProperties
              edge={selectedEdge}
              onUpdate={onEdgeUpdate}
              onOpenModification={onOpenEdgeModification}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

// Node properties panel
const NodeProperties: React.FC<{
  node: Node;
  onUpdate: (id: string, updates: Partial<Node>) => void;
  onOpenCustomization: () => void;
}> = ({ node, onUpdate, onOpenCustomization }) => {
  const [label, setLabel] = React.useState(node.label);

  React.useEffect(() => {
    setLabel(node.label);
  }, [node.label]);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  const handleLabelBlur = () => {
    if (label !== node.label) {
      onUpdate(node.id, { label });
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #eee',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: node.style?.fillColor || getDefaultNodeColor(node.type),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
            {node.type.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>
            {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node
          </div>
          <div style={{ fontSize: '0.7rem', color: '#999' }}>
            ID: {node.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#666',
          marginBottom: '0.25rem',
        }}>
          Label
        </label>
        <input
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleLabelBlur()}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.85rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#666',
          marginBottom: '0.25rem',
        }}>
          Position
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{
            flex: 1,
            padding: '0.5rem',
            background: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '0.8rem',
            textAlign: 'center',
          }}>
            X: {Math.round(node.position.x)}
          </div>
          <div style={{
            flex: 1,
            padding: '0.5rem',
            background: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '0.8rem',
            textAlign: 'center',
          }}>
            Y: {Math.round(node.position.y)}
          </div>
        </div>
      </div>

      <button
        onClick={onOpenCustomization}
        style={{
          width: '100%',
          padding: '0.6rem',
          background: '#1976D2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Customize Node
      </button>
    </div>
  );
};

// Edge properties panel
const EdgeProperties: React.FC<{
  edge: Edge;
  onUpdate: (id: string, updates: Partial<Edge>) => void;
  onOpenModification: () => void;
}> = ({ edge, onUpdate, onOpenModification }) => {
  const [label, setLabel] = React.useState(edge.label || '');

  React.useEffect(() => {
    setLabel(edge.label || '');
  }, [edge.label]);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  const handleLabelBlur = () => {
    if (label !== (edge.label || '')) {
      onUpdate(edge.id, { label: label || undefined });
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #eee',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: getEdgeTypeColor(edge.type),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="5" y1="19" x2="19" y2="5" />
            <polyline points="15 5 19 5 19 9" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>
            {edge.type.toUpperCase()} Edge
          </div>
          <div style={{ fontSize: '0.7rem', color: '#999' }}>
            ID: {edge.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#666',
          marginBottom: '0.25rem',
        }}>
          Label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleLabelBlur()}
          placeholder="Add label..."
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.85rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#666',
          marginBottom: '0.25rem',
        }}>
          Connection
        </label>
        <div style={{
          padding: '0.5rem',
          background: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '0.8rem',
        }}>
          {edge.source.slice(0, 8)}... → {edge.target.slice(0, 8)}...
        </div>
      </div>

      {edge.isResultant && (
        <div style={{
          padding: '0.5rem',
          background: 'rgba(156, 39, 176, 0.1)',
          borderRadius: '4px',
          fontSize: '0.8rem',
          color: '#9C27B0',
          marginBottom: '1rem',
        }}>
          ✓ Resultant Edge
        </div>
      )}

      <button
        onClick={onOpenModification}
        style={{
          width: '100%',
          padding: '0.6rem',
          background: '#1976D2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit Edge
      </button>
    </div>
  );
};

// Helper functions
function getDefaultNodeColor(type: string): string {
  switch (type) {
    case 'vocabulary': return '#1976D2';
    case 'practice': return '#F57C00';
    case 'test': return '#4CAF50';
    case 'operate': return '#FFC107';
    default: return '#9E9E9E';
  }
}

function getEdgeTypeColor(type: string): string {
  switch (type) {
    case 'PV': return '#4CAF50';
    case 'VP': return '#FF9800';
    case 'PP': return '#9C27B0';
    case 'VV': return '#F44336';
    case 'sequence': return '#2196F3';
    case 'feedback': return '#FF5722';
    case 'exit': return '#8BC34A';
    default: return '#666';
  }
}

export default PropertiesSidebar;
