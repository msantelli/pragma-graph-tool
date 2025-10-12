import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Node, Edge, Diagram, Point, EntryPoint, ExitPoint } from '../types/all';
import { v4 as uuidv4 } from 'uuid';
import { migrateToV2, validateDiagramV2 } from '../utils/migrationUtils';

interface DiagramState {
  currentDiagram: Diagram | null;
  selectedItems: string[];
  selectedNodes: string[];
  selectedEdges: string[];
  history: {
    past: Diagram[];
    future: Diagram[];
    maxSize: number;
  };
}

const initialState: DiagramState = {
  currentDiagram: null,
  selectedItems: [],
  selectedNodes: [],
  selectedEdges: [],
  history: {
    past: [],
    future: [],
    maxSize: 50
  }
};

const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    createDiagram: (state, action: PayloadAction<{ name: string; type: Diagram['type'] }>) => {
      state.currentDiagram = {
        id: uuidv4(),
        name: action.payload.name,
        type: action.payload.type,
        nodes: [],
        edges: [],
        entryPoints: [],
        exitPoints: [],
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          version: '2.0' // v2.0 schema
        }
      };
      state.selectedItems = [];
    },
    
    addNode: (state, action: PayloadAction<Omit<Node, 'id'>>) => {
      if (state.currentDiagram) {
        const newNode: Node = {
          ...action.payload,
          id: uuidv4()
        } as Node;
        state.currentDiagram.nodes.push(newNode);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },
    
    addEdge: (state, action: PayloadAction<Omit<Edge, 'id'>>) => {
      if (state.currentDiagram) {
        const newEdge: Edge = {
          ...action.payload,
          id: uuidv4()
        };
        state.currentDiagram.edges.push(newEdge);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },
    
    updateNode: (state, action: PayloadAction<{ id: string; updates: Partial<Node> }>) => {
      if (state.currentDiagram) {
        const nodeIndex = state.currentDiagram.nodes.findIndex(n => n.id === action.payload.id);
        if (nodeIndex !== -1) {
          state.currentDiagram.nodes[nodeIndex] = {
            ...state.currentDiagram.nodes[nodeIndex],
            ...action.payload.updates
          } as Node;
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
    },
    
    updateNodePosition: (state, action: PayloadAction<{ id: string; position: Point }>) => {
      if (state.currentDiagram) {
        const nodeIndex = state.currentDiagram.nodes.findIndex(n => n.id === action.payload.id);
        if (nodeIndex !== -1) {
          state.currentDiagram.nodes[nodeIndex].position = action.payload.position;
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
    },
    
    deleteNode: (state, action: PayloadAction<string>) => {
      if (!state.currentDiagram) return;

      const nodeId = action.payload;

      // Get all descendants (v2.0 cascade delete)
      const getDescendants = (id: string): string[] => {
        const result: string[] = [];
        const queue = [id];
        const seen = new Set<string>();

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (seen.has(current)) continue;
          seen.add(current);

          const node = state.currentDiagram!.nodes.find(n => n.id === current);
          if (node?.childIds) {
            result.push(...node.childIds);
            queue.push(...node.childIds);
          }
        }
        return result;
      };

      const descendants = getDescendants(nodeId);
      const toDelete = [nodeId, ...descendants];

      // Remove from parent's childIds (v2.0)
      const node = state.currentDiagram.nodes.find(n => n.id === nodeId);
      if (node?.parentId) {
        const parent = state.currentDiagram.nodes.find(n => n.id === node.parentId);
        if (parent) {
          parent.childIds = parent.childIds?.filter(id => id !== nodeId);
        }
      }

      // Remove all nodes
      state.currentDiagram.nodes = state.currentDiagram.nodes.filter(n => !toDelete.includes(n.id));

      // Remove connected edges
      state.currentDiagram.edges = state.currentDiagram.edges.filter(
        e => !toDelete.includes(e.source) && !toDelete.includes(e.target)
      );

      // Clear selections
      state.selectedItems = state.selectedItems.filter(id => !toDelete.includes(id));
      state.currentDiagram.metadata.modified = new Date().toISOString();
    },
    
    deleteEdge: (state, action: PayloadAction<string>) => {
      if (state.currentDiagram) {
        const edgeId = action.payload;
        state.currentDiagram.edges = state.currentDiagram.edges.filter(e => e.id !== edgeId);
        state.selectedItems = state.selectedItems.filter(id => id !== edgeId);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },
    
    updateEdge: (state, action: PayloadAction<{ id: string; updates: Partial<Edge> }>) => {
      if (state.currentDiagram) {
        const edgeIndex = state.currentDiagram.edges.findIndex(e => e.id === action.payload.id);
        if (edgeIndex !== -1) {
          state.currentDiagram.edges[edgeIndex] = {
            ...state.currentDiagram.edges[edgeIndex],
            ...action.payload.updates
          } as Edge;
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
    },
    
    selectItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload;
    },
    
    selectItem: (state, action: PayloadAction<string>) => {
      state.selectedItems = [action.payload];
    },
    
    addToSelection: (state, action: PayloadAction<string>) => {
      if (!state.selectedItems.includes(action.payload)) {
        state.selectedItems.push(action.payload);
      }
    },
    
    clearSelection: (state) => {
      state.selectedItems = [];
    },
    
    loadDiagram: (state, action: PayloadAction<Diagram>) => {
      let diagram = action.payload;

      // Auto-migrate v1 diagrams to v2
      if (!diagram.metadata?.version || diagram.metadata.version < '2.0') {
        console.info('[Diagram] Migrating diagram to v2.0 schema');
        diagram = migrateToV2(diagram);
      }

      // Validate diagram structure
      const validation = validateDiagramV2(diagram);
      if (!validation.valid) {
        console.error('[Diagram] Validation errors:', validation.errors);
        // Still load but log errors for debugging
      }

      state.currentDiagram = diagram;
      state.selectedItems = [];
      state.selectedNodes = [];
      state.selectedEdges = [];
      state.history = { past: [], future: [], maxSize: 50 };
    },
    
    // Enhanced selection management
    selectNodes: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload;
      state.selectedItems = [...action.payload, ...state.selectedEdges];
    },
    
    selectEdges: (state, action: PayloadAction<string[]>) => {
      state.selectedEdges = action.payload;
      state.selectedItems = [...state.selectedNodes, ...action.payload];
    },
    
    selectAll: (state) => {
      if (state.currentDiagram) {
        state.selectedNodes = state.currentDiagram.nodes.map(n => n.id);
        state.selectedEdges = state.currentDiagram.edges.map(e => e.id);
        state.selectedItems = [...state.selectedNodes, ...state.selectedEdges];
      }
    },
    
    // History management
    saveToHistory: (state) => {
      if (state.currentDiagram) {
        // Clone the current diagram for history
        const diagramSnapshot = JSON.parse(JSON.stringify(state.currentDiagram));
        
        // Add to past, remove oldest if over limit
        state.history.past.push(diagramSnapshot);
        if (state.history.past.length > state.history.maxSize) {
          state.history.past.shift();
        }
        
        // Clear future when new action is taken
        state.history.future = [];
      }
    },
    
    undo: (state) => {
      if (state.history.past.length > 0 && state.currentDiagram) {
        // Save current state to future
        const currentSnapshot = JSON.parse(JSON.stringify(state.currentDiagram));
        state.history.future.unshift(currentSnapshot);
        
        // Restore from past
        const previousState = state.history.past.pop()!;
        state.currentDiagram = previousState;
        
        // Clear selections
        state.selectedItems = [];
        state.selectedNodes = [];
        state.selectedEdges = [];
      }
    },
    
    redo: (state) => {
      if (state.history.future.length > 0 && state.currentDiagram) {
        // Save current state to past
        const currentSnapshot = JSON.parse(JSON.stringify(state.currentDiagram));
        state.history.past.push(currentSnapshot);
        
        // Restore from future
        const nextState = state.history.future.shift()!;
        state.currentDiagram = nextState;
        
        // Clear selections
        state.selectedItems = [];
        state.selectedNodes = [];
        state.selectedEdges = [];
      }
    },
    
    setHistoryMaxSize: (state, action: PayloadAction<number>) => {
      state.history.maxSize = Math.max(1, action.payload);
      // Trim if necessary
      while (state.history.past.length > state.history.maxSize) {
        state.history.past.shift();
      }
    },

    // Entry/Exit point management
    addEntryPoint: (state, action: PayloadAction<Omit<EntryPoint, 'id'>>) => {
      if (state.currentDiagram) {
        const newEntryPoint: EntryPoint = {
          id: uuidv4(),
          ...action.payload
        };
        state.currentDiagram.entryPoints.push(newEntryPoint);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    addExitPoint: (state, action: PayloadAction<Omit<ExitPoint, 'id'>>) => {
      if (state.currentDiagram) {
        const newExitPoint: ExitPoint = {
          id: uuidv4(),
          ...action.payload
        };
        state.currentDiagram.exitPoints.push(newExitPoint);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    deleteEntryPoint: (state, action: PayloadAction<string>) => {
      if (state.currentDiagram) {
        state.currentDiagram.entryPoints = state.currentDiagram.entryPoints.filter(ep => ep.id !== action.payload);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    deleteExitPoint: (state, action: PayloadAction<string>) => {
      if (state.currentDiagram) {
        state.currentDiagram.exitPoints = state.currentDiagram.exitPoints.filter(ep => ep.id !== action.payload);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    updateEntryPoint: (state, action: PayloadAction<Partial<EntryPoint> & { id: string }>) => {
      if (state.currentDiagram) {
        const index = state.currentDiagram.entryPoints.findIndex(ep => ep.id === action.payload.id);
        if (index !== -1) {
          state.currentDiagram.entryPoints[index] = { ...state.currentDiagram.entryPoints[index], ...action.payload };
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
    },

    updateExitPoint: (state, action: PayloadAction<Partial<ExitPoint> & { id: string }>) => {
      if (state.currentDiagram) {
        const index = state.currentDiagram.exitPoints.findIndex(ep => ep.id === action.payload.id);
        if (index !== -1) {
          state.currentDiagram.exitPoints[index] = { ...state.currentDiagram.exitPoints[index], ...action.payload };
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
    },

    // v2.0 Containment Operations
    setNodeParent: (state, action: PayloadAction<{ nodeId: string; parentId: string | null }>) => {
      if (!state.currentDiagram) return;

      const { nodeId, parentId } = action.payload;
      const node = state.currentDiagram.nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Validate no circular reference
      if (parentId) {
        const getAncestors = (id: string): string[] => {
          const ancestors: string[] = [];
          let currentId: string | null | undefined = id;
          const seen = new Set<string>();

          while (currentId) {
            if (seen.has(currentId)) break;
            seen.add(currentId);
            const n = state.currentDiagram!.nodes.find(nd => nd.id === currentId);
            if (!n?.parentId) break;
            ancestors.push(n.parentId);
            currentId = n.parentId;
          }
          return ancestors;
        };

        const ancestors = getAncestors(parentId);
        if (ancestors.includes(nodeId)) {
          console.error('Cannot set parent: would create circular reference');
          return;
        }
      }

      // Remove from old parent's childIds
      if (node.parentId) {
        const oldParent = state.currentDiagram.nodes.find(n => n.id === node.parentId);
        if (oldParent) {
          oldParent.childIds = oldParent.childIds?.filter(id => id !== nodeId) ?? [];
        }
      }

      // Update node's parentId
      node.parentId = parentId;

      // Add to new parent's childIds
      if (parentId) {
        const newParent = state.currentDiagram.nodes.find(n => n.id === parentId);
        if (newParent) {
          newParent.childIds = [...(newParent.childIds ?? []), nodeId];
          newParent.isContainer = true; // Auto-enable container mode
        }
      }

      state.currentDiagram.metadata.modified = new Date().toISOString();
    },

    // v2.0 Lock Group Operations
    createLockGroup: (state, action: PayloadAction<string[]>) => {
      if (!state.currentDiagram) return;

      const groupId = uuidv4();
      action.payload.forEach(nodeId => {
        const node = state.currentDiagram!.nodes.find(n => n.id === nodeId);
        if (node) {
          node.lockGroupId = groupId;
        }
      });

      state.currentDiagram.metadata.modified = new Date().toISOString();
    },

    unlockGroup: (state, action: PayloadAction<string>) => {
      if (!state.currentDiagram) return;

      const groupId = action.payload;
      state.currentDiagram.nodes.forEach(node => {
        if (node.lockGroupId === groupId) {
          node.lockGroupId = undefined;
        }
      });

      state.currentDiagram.metadata.modified = new Date().toISOString();
    },

    toggleNodeLock: (state, action: PayloadAction<string>) => {
      if (!state.currentDiagram) return;

      const node = state.currentDiagram.nodes.find(n => n.id === action.payload);
      if (node) {
        node.locked = !node.locked;
      }

      state.currentDiagram.metadata.modified = new Date().toISOString();
    },

    // v2.0 Container Operations
    toggleContainer: (state, action: PayloadAction<string>) => {
      if (!state.currentDiagram) return;

      const node = state.currentDiagram.nodes.find(n => n.id === action.payload);
      if (node) {
        node.isContainer = !node.isContainer;
        if (node.isContainer) {
          node.childIds = node.childIds ?? [];
          node.containerPadding = node.containerPadding ?? 20;
        }
      }

      state.currentDiagram.metadata.modified = new Date().toISOString();
    },

    setContainerPadding: (state, action: PayloadAction<{ nodeId: string; padding: number }>) => {
      if (!state.currentDiagram) return;

      const node = state.currentDiagram.nodes.find(n => n.id === action.payload.nodeId);
      if (node?.isContainer) {
        node.containerPadding = Math.max(0, action.payload.padding);
      }

      state.currentDiagram.metadata.modified = new Date().toISOString();
    },

    setManualContainerSize: (state, action: PayloadAction<{
      nodeId: string;
      width: number;
      height: number;
    }>) => {
      if (!state.currentDiagram) return;

      const node = state.currentDiagram.nodes.find(n => n.id === action.payload.nodeId);
      if (node?.isContainer) {
        node.manualSize = {
          width: Math.max(50, action.payload.width),
          height: Math.max(50, action.payload.height)
        };
      }

      state.currentDiagram.metadata.modified = new Date().toISOString();
    },

    fitContainerToChildren: (state, action: PayloadAction<string>) => {
      if (!state.currentDiagram) return;

      const node = state.currentDiagram.nodes.find(n => n.id === action.payload);
      if (node?.isContainer) {
        node.manualSize = undefined; // Clear manual override, will auto-fit
      }

      state.currentDiagram.metadata.modified = new Date().toISOString();
    }
  }
});

export const {
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
  // v2.0 actions
  setNodeParent,
  createLockGroup,
  unlockGroup,
  toggleNodeLock,
  toggleContainer,
  setContainerPadding,
  setManualContainerSize,
  fitContainerToChildren
} = diagramSlice.actions;

export default diagramSlice.reducer;