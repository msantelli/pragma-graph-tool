import React from 'react';

interface HeaderProps {
  // Mode and settings
  diagramMode: 'MUD' | 'TOTE' | 'HYBRID' | 'GENERIC';
  onModeChange: (mode: 'MUD' | 'TOTE' | 'HYBRID' | 'GENERIC') => void;
  autoDetectEdges: boolean;
  onAutoDetectChange: (value: boolean) => void;
  showUnmarkedEdges: boolean;
  onUnmarkedEdgesChange: (value: boolean) => void;

  // Grid settings
  showGrid: boolean;
  onShowGridChange: (value: boolean) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (value: boolean) => void;
  gridSpacing: number;
  onGridSpacingChange: (value: number) => void;

  // Tools
  selectedTool: string;
  availableTools: string[];
  onToolSelect: (tool: string) => void;

  // Actions
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: () => void;
  onExportJSON: () => void;
  onExportSVG: () => void;
  onExportLatex: () => void;

  // Grouping
  canGroup: boolean;
  onGroup: () => void;
  canUngroup: boolean;
  onUngroup: () => void;

  // State
  hasNodes: boolean;
}

// Tool icons as simple SVG components
const ToolIcons: Record<string, React.ReactNode> = {
  select: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  ),
  vocabulary: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
  ),
  practice: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="12" rx="3" />
    </svg>
  ),
  test: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l10 10-10 10L2 12 12 2z" />
    </svg>
  ),
  operate: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" />
    </svg>
  ),
  edge: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="15 5 19 5 19 9" />
    </svg>
  ),
  entry: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 2v6M12 16v6" />
    </svg>
  ),
  exit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  custom: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};

// Keyboard shortcuts for tools
const ToolShortcuts: Record<string, string> = {
  select: 'S',
  vocabulary: 'V',
  practice: 'P',
  test: 'T',
  operate: 'O',
  edge: 'E',
  entry: 'N',
  exit: 'X',
  custom: 'C',
};

// Mode descriptions
const ModeDescriptions: Record<string, string> = {
  MUD: 'Meaning-Use Diagrams: Vocabulary & Practice nodes with PV/VP/PP/VV edges',
  TOTE: 'Test-Operate-Test-Exit cycles: Test & Operate nodes with sequence/feedback edges',
  HYBRID: 'Combined MUD + TOTE: All node types and edge types available',
  GENERIC: 'Generic mode: Basic nodes and custom edges',
};

// Separator component
const Separator: React.FC = () => (
  <div style={{
    width: '1px',
    height: '24px',
    background: 'rgba(255,255,255,0.2)',
    margin: '0 0.5rem'
  }} />
);

// Section label component
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'rgba(255,255,255,0.5)',
    marginRight: '0.5rem'
  }}>
    {children}
  </span>
);

export const Header: React.FC<HeaderProps> = ({
  diagramMode,
  onModeChange,
  autoDetectEdges,
  onAutoDetectChange,
  showUnmarkedEdges,
  onUnmarkedEdgesChange,
  showGrid,
  onShowGridChange,
  snapToGrid,
  onSnapToGridChange,
  gridSpacing,
  onGridSpacingChange,
  selectedTool,
  availableTools,
  onToolSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onImport,
  onExportJSON,
  onExportSVG,
  onExportLatex,
  canGroup,
  onGroup,
  canUngroup,
  onUngroup,
  hasNodes
}) => {
  const [showModeHint, setShowModeHint] = React.useState(false);
  const [lastMode, setLastMode] = React.useState(diagramMode);

  // Show hint when mode changes
  React.useEffect(() => {
    if (diagramMode !== lastMode) {
      setShowModeHint(true);
      setLastMode(diagramMode);
      const timer = setTimeout(() => setShowModeHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [diagramMode, lastMode]);

  // Common button style
  const getButtonStyle = (isActive: boolean, isDisabled: boolean, color?: string): React.CSSProperties => ({
    padding: '0.4rem 0.75rem',
    border: '1px solid rgba(255,255,255,0.2)',
    background: isDisabled
      ? 'rgba(255,255,255,0.05)'
      : isActive
        ? 'rgba(255,255,255,0.25)'
        : color || 'rgba(255,255,255,0.1)',
    color: isDisabled ? 'rgba(255,255,255,0.3)' : 'white',
    borderRadius: '6px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.15s ease',
    opacity: isDisabled ? 0.5 : 1,
  });

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #1E88E5 100%)',
        color: 'white',
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      {/* Top row: Title, Mode, Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '200px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.5px' }}>
            Pragma Graph Tool
          </h1>
          <a
            href="https://orcid.org/0000-0002-4422-3535"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
            }}
          >
            by Mauro Santelli
          </a>
        </div>

        <Separator />

        {/* Mode selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SectionLabel>Mode</SectionLabel>
          <div style={{
            display: 'flex',
            gap: '2px',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '8px',
            padding: '3px',
            position: 'relative'
          }}>
            {(['MUD', 'TOTE', 'HYBRID', 'GENERIC'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                title={ModeDescriptions[mode]}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  background: diagramMode === mode ? 'white' : 'transparent',
                  color: diagramMode === mode ? '#1565C0' : 'rgba(255,255,255,0.8)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: diagramMode === mode ? 600 : 400,
                  transition: 'all 0.2s ease',
                  minWidth: '60px'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Mode-specific options */}
        {diagramMode === 'MUD' && (
          <>
            <Separator />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={autoDetectEdges}
                onChange={(e) => onAutoDetectChange(e.target.checked)}
                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
              />
              Auto-detect edges
            </label>
          </>
        )}

        {diagramMode !== 'GENERIC' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={showUnmarkedEdges}
              onChange={(e) => onUnmarkedEdgesChange(e.target.checked)}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            Unmarked edges
          </label>
        )}

        <Separator />

        {/* Grid controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SectionLabel>Grid</SectionLabel>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => onShowGridChange(e.target.checked)}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            Show
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => onSnapToGridChange(e.target.checked)}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            Snap
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <input
              type="range"
              min="10"
              max="200"
              value={gridSpacing}
              onChange={(e) => onGridSpacingChange(Number(e.target.value))}
              style={{ width: '60px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', minWidth: '28px', opacity: 0.7 }}>{gridSpacing}px</span>
          </div>
        </div>
      </div>

      {/* Mode change hint */}
      {showModeHint && (
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: '1rem' }}>💡</span>
          <span>{ModeDescriptions[diagramMode]}</span>
        </div>
      )}

      {/* Bottom row: Tools and Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {/* Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SectionLabel>Tools</SectionLabel>
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(0,0,0,0.1)',
            padding: '4px',
            borderRadius: '8px'
          }}>
            {availableTools.map(tool => (
              <button
                key={tool}
                onClick={() => onToolSelect(tool)}
                title={`${tool.charAt(0).toUpperCase() + tool.slice(1)} (${ToolShortcuts[tool] || '?'})`}
                style={{
                  ...getButtonStyle(selectedTool === tool, false),
                  background: selectedTool === tool ? 'rgba(255,255,255,0.9)' : 'transparent',
                  color: selectedTool === tool ? '#1565C0' : 'white',
                  border: 'none',
                  padding: '0.4rem 0.6rem',
                }}
              >
                {ToolIcons[tool] || <span>•</span>}
                <span style={{ fontSize: '0.8rem' }}>{tool}</span>
                <span style={{
                  fontSize: '0.65rem',
                  opacity: 0.5,
                  marginLeft: '2px',
                  fontFamily: 'monospace'
                }}>
                  {ToolShortcuts[tool]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* History */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <SectionLabel>History</SectionLabel>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            style={getButtonStyle(false, !canUndo)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            style={getButtonStyle(false, !canRedo)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
            </svg>
          </button>
        </div>

        <Separator />

        {/* Grouping */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={onGroup}
            disabled={!canGroup}
            title="Group selected nodes (select 2+ nodes)"
            style={getButtonStyle(false, !canGroup, 'rgba(0,150,136,0.7)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            <span>Group</span>
          </button>
          <button
            onClick={onUngroup}
            disabled={!canUngroup}
            title="Ungroup selected container"
            style={getButtonStyle(false, !canUngroup, 'rgba(255,87,34,0.7)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
            </svg>
            <span>Ungroup</span>
          </button>
        </div>

        <Separator />

        {/* Import/Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <SectionLabel>File</SectionLabel>
          <button
            onClick={onImport}
            title="Import diagram from JSON file"
            style={getButtonStyle(false, false, 'rgba(103,58,183,0.7)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Import</span>
          </button>
          <button
            onClick={onExportJSON}
            disabled={!hasNodes}
            title="Export as JSON (for re-importing)"
            style={getButtonStyle(false, !hasNodes, 'rgba(76,175,80,0.7)')}
          >
            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 600 }}>{'{}'}</span>
            <span>JSON</span>
          </button>
          <button
            onClick={onExportSVG}
            disabled={!hasNodes}
            title="Export as SVG (for presentations)"
            style={getButtonStyle(false, !hasNodes, 'rgba(255,152,0,0.7)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>SVG</span>
          </button>
          <button
            onClick={onExportLatex}
            disabled={!hasNodes}
            title="Export as LaTeX/TikZ (for papers)"
            style={getButtonStyle(false, !hasNodes, 'rgba(233,30,99,0.7)')}
          >
            <span style={{ fontFamily: 'serif', fontSize: '0.8rem', fontStyle: 'italic' }}>T<sub>E</sub>X</span>
          </button>
        </div>
      </div>
    </div>
  );
};
