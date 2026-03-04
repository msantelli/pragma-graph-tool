// Types
export * from './types.js';

// Store
export { createStore, store, type RootState, type AppDispatch } from './store.js';
export type { DiagramState } from './diagramSlice.js';
export type { UIState } from './uiSlice.js';

// Diagram slice actions
export {
  default as diagramReducer,
  createDiagram,
  addNode,
  addEdge,
  updateNode,
  updateNodePosition,
  deleteNode,
  deleteEdge,
  updateEdge,
  selectItems,
  selectItem,
  addToSelection,
  clearSelection,
  loadDiagram,
  selectNodes,
  selectEdges,
  selectAll,
  saveToHistory,
  undo,
  redo,
  setHistoryMaxSize,
  addEntryPoint,
  addExitPoint,
  deleteEntryPoint,
  deleteExitPoint,
  updateEntryPoint,
  updateExitPoint,
  setNodeParent,
  groupNodesIntoContainer,
  ungroupContainer
} from './diagramSlice.js';

// UI slice actions
export {
  default as uiReducer,
  setSelectedTool,
  togglePropertyPanel,
  setPropertyPanelOpen,
  setZoom,
  setPanOffset,
  setCanvasSize,
  setDragging,
  resetView,
  setDiagramMode,
  setAutoDetectEdges,
  setShowUnmarkedEdges,
  setShowGrid,
  setSnapToGrid,
  setGridSpacing,
  setPendingEdge,
  clearPendingEdge,
  setPendingEntryExit,
  setShowEdgeTypeSelector,
  setShowCustomizationPanel,
  setShowEdgeModificationPanel,
  setSelectedNodeForCustomization,
  setSelectedEdgeForModification
} from './uiSlice.js';

// Node utilities
export {
  getNodeColors,
  getNodeFillColor,
  getNodeStrokeColor,
  getNodeTextColor,
  getNodeShape,
  getNodeDimensions,
  getNodeFontSize,
  toAbsolutePosition,
  toRelativePosition,
  getChildNodes,
  getAllDescendants,
  hasChildren,
  getNestingDepth,
  calculateContainerBounds,
  isPointInsideNode,
  isValidDropTarget,
  findContainerAtPosition,
  sortNodesForRendering
} from './nodeUtils.js';

// Edge utilities
export {
  getAvailableEdgeTypes,
  getBaseEdgeType,
  getEdgeQualifier,
  getEdgeColor,
  shouldShowArrowhead,
  getEdgeTypeDescription
} from './edgeUtils.js';

// Grid utilities
export {
  snapToGrid,
  getSnappedPosition,
  getGridAlignedBounds,
  getNearestGridPoint,
  isNearGridPoint
} from './gridUtils.js';

// Diagram utilities
export {
  getAvailableTools,
  getModeDescription
} from './diagramUtils.js';

// Export utilities (pure generators)
export {
  type ExportEdgeGeometry,
  computeEdgeGeometryForExport,
  calculateDiagramBounds,
  isLaTeXContent,
  escapeLaTeXText,
  generateTikZCode,
  generateSVGContent,
  generateLaTeXDocument,
  generateJSONExport,
  validateDiagramImport
} from './exportUtils.js';
