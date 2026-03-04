import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { InstallPrompt, PWAStatus } from './components/PWAComponents';
import MobileWarning from './components/MobileWarning';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { EdgeTypeSelector } from './components/EdgeTypeSelector';
import { NodeCustomizationPanel } from './components/NodeCustomizationPanel';
import { EdgeModificationPanel } from './components/EdgeModificationPanel';
import { Legend } from './components/Legend';
import { PropertiesSidebar } from './components/PropertiesSidebar';
import { useAppSelector, useAppDispatch } from './store/hooks';
import {
  setDiagramMode,
  setAutoDetectEdges,
  setShowUnmarkedEdges,
  setShowGrid,
  setSnapToGrid,
  setGridSpacing,
  setSelectedTool,
  setShowEdgeTypeSelector,
  setShowCustomizationPanel,
  setShowEdgeModificationPanel,
  setSelectedNodeForCustomization,
  setSelectedEdgeForModification
} from './store/uiSlice';
import {
  createDiagram,
  undo,
  redo,
  selectNodes,
  loadDiagram,
  groupNodesIntoContainer,
  ungroupContainer,
  saveToHistory,
  updateNode,
  updateEdge
} from './store/diagramSlice';
import { getAvailableTools } from './utils/diagramUtils';
import { exportAsJSON, exportAsSVG, exportAsLaTeX, importFromJSON } from './utils/exportUtils';
import type { Node, Edge } from './types/all';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  // Local UI state
  const [legendCollapsed, setLegendCollapsed] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = React.useState(false);

  // UI state selectors
  const diagramMode = useAppSelector(state => state.ui.diagramMode);
  const selectedTool = useAppSelector(state => state.ui.selectedTool);
  const autoDetectEdges = useAppSelector(state => state.ui.autoDetectEdges);
  const showUnmarkedEdges = useAppSelector(state => state.ui.showUnmarkedEdges);
  const showGrid = useAppSelector(state => state.ui.showGrid);
  const snapToGrid = useAppSelector(state => state.ui.snapToGrid);
  const gridSpacing = useAppSelector(state => state.ui.gridSpacing);
  const showEdgeTypeSelector = useAppSelector(state => state.ui.showEdgeTypeSelector);
  const showCustomizationPanel = useAppSelector(state => state.ui.showCustomizationPanel);
  const showEdgeModificationPanel = useAppSelector(state => state.ui.showEdgeModificationPanel);

  // Diagram state selectors
  const currentDiagram = useAppSelector(state => state.diagram.currentDiagram);
  const selectedItems = useAppSelector(state => state.diagram.selectedItems);
  const canUndo = useAppSelector(state => state.diagram.history.past.length > 0);
  const canRedo = useAppSelector(state => state.diagram.history.future.length > 0);
  const hasNodes = useAppSelector(state => (state.diagram.currentDiagram?.nodes.length ?? 0) > 0);

  // Get selected node and edge for properties sidebar
  const selectedNode = React.useMemo(() => {
    if (!currentDiagram || selectedItems.length !== 1) return null;
    return currentDiagram.nodes.find(n => n.id === selectedItems[0]) || null;
  }, [currentDiagram, selectedItems]);

  const selectedEdge = React.useMemo(() => {
    if (!currentDiagram || selectedItems.length !== 1) return null;
    return currentDiagram.edges.find(e => e.id === selectedItems[0]) || null;
  }, [currentDiagram, selectedItems]);

  // Compute if grouping is available (2+ top-level nodes selected)
  const canGroup = React.useMemo(() => {
    if (!currentDiagram || selectedItems.length < 2) return false;
    const selectedNodes = currentDiagram.nodes.filter(
      n => selectedItems.includes(n.id) && !n.parentId
    );
    return selectedNodes.length >= 2;
  }, [currentDiagram, selectedItems]);

  // Compute if ungrouping is available (single container node selected)
  const canUngroup = React.useMemo(() => {
    if (!currentDiagram || selectedItems.length !== 1) return false;
    const nodeId = selectedItems[0];
    const nodeChildren = currentDiagram.nodes.filter(n => n.parentId === nodeId);
    return nodeChildren.length > 0;
  }, [currentDiagram, selectedItems]);

  // Initialize diagram if none exists
  React.useEffect(() => {
    if (!currentDiagram) {
      dispatch(createDiagram({ name: 'Untitled Diagram', type: diagramMode }));
    }
  }, [currentDiagram, diagramMode, dispatch]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Show keyboard help with ?
      if (e.key === '?') {
        setShowKeyboardHelp(prev => !prev);
        return;
      }

      // Tool shortcuts
      const toolShortcuts: Record<string, string> = {
        's': 'select',
        'v': 'vocabulary',
        'p': 'practice',
        't': 'test',
        'o': 'operate',
        'e': 'edge',
        'n': 'entry',
        'x': 'exit',
        'c': 'custom',
      };

      const tool = toolShortcuts[e.key.toLowerCase()];
      if (tool) {
        const available = getAvailableTools(diagramMode) as readonly string[];
        if (available.includes(tool)) {
          dispatch(setSelectedTool(tool as Parameters<typeof setSelectedTool>[0]));
        }
        return;
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch(redo());
        } else {
          dispatch(undo());
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        dispatch(redo());
        return;
      }

      // Toggle grid with G
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
        dispatch(setShowGrid(!showGrid));
        return;
      }

      // Escape to deselect and switch to select tool
      if (e.key === 'Escape') {
        dispatch(selectNodes([]));
        dispatch(setSelectedTool('select'));
        setShowKeyboardHelp(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, diagramMode, showGrid]);

  // Header event handlers
  const handleModeChange = (mode: 'MUD' | 'TOTE' | 'HYBRID' | 'GENERIC') => {
    dispatch(setDiagramMode(mode));
    dispatch(setSelectedTool('select'));
  };

  const handleAutoDetectChange = (value: boolean) => {
    dispatch(setAutoDetectEdges(value));
  };

  const handleUnmarkedEdgesChange = (value: boolean) => {
    dispatch(setShowUnmarkedEdges(value));
  };

  const handleShowGridChange = (value: boolean) => {
    dispatch(setShowGrid(value));
  };

  const handleSnapToGridChange = (value: boolean) => {
    dispatch(setSnapToGrid(value));
  };

  const handleGridSpacingChange = (value: number) => {
    dispatch(setGridSpacing(value));
  };

  const handleToolSelect = (tool: string) => {
    dispatch(setSelectedTool(tool as Parameters<typeof setSelectedTool>[0]));
    dispatch(selectNodes([]));
  };

  const handleUndo = () => {
    dispatch(undo());
  };

  const handleRedo = () => {
    dispatch(redo());
  };

  const handleGroup = () => {
    if (!currentDiagram || !canGroup) return;
    const selectedNodeIds = currentDiagram.nodes
      .filter(n => selectedItems.includes(n.id) && !n.parentId)
      .map(n => n.id);
    if (selectedNodeIds.length >= 2) {
      dispatch(saveToHistory());
      dispatch(groupNodesIntoContainer({
        nodeIds: selectedNodeIds,
        containerLabel: 'Group',
        containerType: 'vocabulary'
      }));
    }
  };

  const handleUngroup = () => {
    if (!currentDiagram || !canUngroup) return;
    const containerId = selectedItems[0];
    dispatch(saveToHistory());
    dispatch(ungroupContainer(containerId));
  };

  const handleImport = () => {
    importFromJSON((diagram) => {
      dispatch(loadDiagram(diagram));
    });
  };

  const handleExportJSON = () => {
    if (currentDiagram) {
      exportAsJSON(currentDiagram);
    }
  };

  const handleExportSVG = () => {
    if (currentDiagram) {
      exportAsSVG(currentDiagram);
    }
  };

  const handleExportLatex = () => {
    if (currentDiagram) {
      exportAsLaTeX(currentDiagram);
    }
  };

  const handleCloseEdgeTypeSelector = () => {
    dispatch(setShowEdgeTypeSelector(false));
  };

  const handleCloseCustomizationPanel = () => {
    dispatch(setShowCustomizationPanel(false));
  };

  const handleCloseEdgeModificationPanel = () => {
    dispatch(setShowEdgeModificationPanel(false));
  };

  // Properties sidebar handlers
  const handleNodeUpdate = (id: string, updates: Partial<Node>) => {
    dispatch(saveToHistory());
    dispatch(updateNode({ id, updates }));
  };

  const handleEdgeUpdate = (id: string, updates: Partial<Edge>) => {
    dispatch(saveToHistory());
    dispatch(updateEdge({ id, updates }));
  };

  const handleOpenNodeCustomization = () => {
    if (selectedNode) {
      dispatch(setSelectedNodeForCustomization(selectedNode.id));
    }
  };

  const handleOpenEdgeModification = () => {
    if (selectedEdge) {
      dispatch(setSelectedEdgeForModification(selectedEdge.id));
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Warning */}
      <MobileWarning />

      {/* PWA Components */}
      <PWAStatus />
      <InstallPrompt />

      {/* Header */}
      <Header
        diagramMode={diagramMode}
        onModeChange={handleModeChange}
        autoDetectEdges={autoDetectEdges}
        onAutoDetectChange={handleAutoDetectChange}
        showUnmarkedEdges={showUnmarkedEdges}
        onUnmarkedEdgesChange={handleUnmarkedEdgesChange}
        showGrid={showGrid}
        onShowGridChange={handleShowGridChange}
        snapToGrid={snapToGrid}
        onSnapToGridChange={handleSnapToGridChange}
        gridSpacing={gridSpacing}
        onGridSpacingChange={handleGridSpacingChange}
        selectedTool={selectedTool}
        availableTools={[...getAvailableTools(diagramMode)]}
        onToolSelect={handleToolSelect}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onImport={handleImport}
        onExportJSON={handleExportJSON}
        onExportSVG={handleExportSVG}
        onExportLatex={handleExportLatex}
        canGroup={canGroup}
        onGroup={handleGroup}
        canUngroup={canUngroup}
        onUngroup={handleUngroup}
        hasNodes={hasNodes}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas />

          {/* Legend */}
          <Legend
            diagramMode={diagramMode}
            isCollapsed={legendCollapsed}
            onToggle={() => setLegendCollapsed(!legendCollapsed)}
          />
        </div>

        {/* Properties Sidebar */}
        <PropertiesSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeUpdate={handleNodeUpdate}
          onEdgeUpdate={handleEdgeUpdate}
          onOpenNodeCustomization={handleOpenNodeCustomization}
          onOpenEdgeModification={handleOpenEdgeModification}
        />
      </div>

      {/* Modals */}
      <EdgeTypeSelector
        isOpen={showEdgeTypeSelector}
        onClose={handleCloseEdgeTypeSelector}
      />
      <NodeCustomizationPanel
        isOpen={showCustomizationPanel}
        onClose={handleCloseCustomizationPanel}
      />
      <EdgeModificationPanel
        isOpen={showEdgeModificationPanel}
        onClose={handleCloseEdgeModificationPanel}
      />

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '400px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Keyboard Shortcuts</h2>

            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: 600, color: '#666', marginTop: '0.5rem' }}>Tools</div>
              <ShortcutRow keys={['S']} description="Select tool" />
              <ShortcutRow keys={['V']} description="Vocabulary node" />
              <ShortcutRow keys={['P']} description="Practice node" />
              <ShortcutRow keys={['T']} description="Test node" />
              <ShortcutRow keys={['O']} description="Operate node" />
              <ShortcutRow keys={['E']} description="Edge tool" />
              <ShortcutRow keys={['C']} description="Custom node" />

              <div style={{ fontWeight: 600, color: '#666', marginTop: '0.5rem' }}>Actions</div>
              <ShortcutRow keys={['Ctrl', 'Z']} description="Undo" />
              <ShortcutRow keys={['Ctrl', 'Y']} description="Redo" />
              <ShortcutRow keys={['G']} description="Toggle grid" />
              <ShortcutRow keys={['Delete']} description="Delete selection" />
              <ShortcutRow keys={['Esc']} description="Deselect / Cancel" />
              <ShortcutRow keys={['?']} description="Toggle this help" />
            </div>

            <button
              onClick={() => setShowKeyboardHelp(false)}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.6rem',
                background: '#1976D2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for keyboard shortcuts
const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ color: '#666' }}>{description}</span>
    <div style={{ display: 'flex', gap: '4px' }}>
      {keys.map((key, i) => (
        <React.Fragment key={key}>
          {i > 0 && <span style={{ color: '#999' }}>+</span>}
          <kbd style={{
            background: '#f0f0f0',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            border: '1px solid #ddd',
          }}>
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  </div>
);

// Main App component with Redux Provider
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
