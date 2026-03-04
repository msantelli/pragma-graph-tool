import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Node, Edge, Diagram, Point, EntryPoint, ExitPoint } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export interface DiagramState {
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
          modified: new Date().toISOString()
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
      if (state.currentDiagram) {
        const nodeId = action.payload;

        // Collect all descendant node IDs (recursive)
        const getAllDescendants = (parentId: string): string[] => {
          const children = state.currentDiagram!.nodes.filter(n => n.parentId === parentId);
          const childIds = children.map(c => c.id);
          const grandchildIds = childIds.flatMap(id => getAllDescendants(id));
          return [...childIds, ...grandchildIds];
        };

        const descendantIds = getAllDescendants(nodeId);
        const allIdsToDelete = [nodeId, ...descendantIds];

        // Remove the node and all descendants
        state.currentDiagram.nodes = state.currentDiagram.nodes.filter(
          n => !allIdsToDelete.includes(n.id)
        );

        // Remove edges connected to any deleted node
        state.currentDiagram.edges = state.currentDiagram.edges.filter(
          e => !allIdsToDelete.includes(e.source) && !allIdsToDelete.includes(e.target)
        );

        // Clear selection of deleted items
        state.selectedItems = state.selectedItems.filter(id => !allIdsToDelete.includes(id));
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
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
      state.currentDiagram = action.payload;
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

    // Nesting: Set or remove parent for a node
    setNodeParent: (state, action: PayloadAction<{
      nodeId: string;
      parentId: string | null;
      newPosition: Point;  // Position in new coordinate system (relative if parenting, absolute if unparenting)
    }>) => {
      if (state.currentDiagram) {
        const { nodeId, parentId, newPosition } = action.payload;
        const nodeIndex = state.currentDiagram.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return;

        const node = state.currentDiagram.nodes[nodeIndex];

        // Validate: can't parent to self
        if (parentId === nodeId) return;

        // Validate: can't create cycles (parent can't be a descendant of node)
        if (parentId) {
          const isDescendant = (ancestorId: string, descendantId: string): boolean => {
            const desc = state.currentDiagram!.nodes.find(n => n.id === descendantId);
            if (!desc || !desc.parentId) return false;
            if (desc.parentId === ancestorId) return true;
            return isDescendant(ancestorId, desc.parentId);
          };
          if (isDescendant(nodeId, parentId)) return;

          // Validate: max depth of 4
          const getDepth = (nId: string): number => {
            const n = state.currentDiagram!.nodes.find(nd => nd.id === nId);
            if (!n || !n.parentId) return 0;
            return 1 + getDepth(n.parentId);
          };
          const parentDepth = getDepth(parentId);

          const getSubtreeDepth = (nId: string): number => {
            const children = state.currentDiagram!.nodes.filter(n => n.parentId === nId);
            if (children.length === 0) return 0;
            return 1 + Math.max(...children.map(c => getSubtreeDepth(c.id)));
          };
          const subtreeDepth = getSubtreeDepth(nodeId);

          if (parentDepth + 1 + subtreeDepth > 4) return;
        }

        // Update the node
        state.currentDiagram.nodes[nodeIndex] = {
          ...node,
          parentId: parentId ?? undefined,
          position: newPosition
        } as Node;

        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    // Group multiple nodes into a new container node
    groupNodesIntoContainer: (state, action: PayloadAction<{
      nodeIds: string[];
      containerLabel: string;
      containerType: Node['type'];
    }>) => {
      if (!state.currentDiagram) return;
      const { nodeIds, containerLabel, containerType } = action.payload;

      // Must have at least 2 nodes to group
      if (nodeIds.length < 2) return;

      // Get the nodes to group
      const nodesToGroup = state.currentDiagram.nodes.filter(n => nodeIds.includes(n.id));
      if (nodesToGroup.length < 2) return;

      // Validate: none of the nodes should already have a parent (only group top-level nodes)
      if (nodesToGroup.some(n => n.parentId)) return;

      // Calculate the centroid of selected nodes
      const centroid = {
        x: nodesToGroup.reduce((sum, n) => sum + n.position.x, 0) / nodesToGroup.length,
        y: nodesToGroup.reduce((sum, n) => sum + n.position.y, 0) / nodesToGroup.length
      };

      // Create the container node at the centroid
      const containerId = uuidv4();
      const containerNode: Node = {
        id: containerId,
        type: containerType,
        position: centroid,
        label: containerLabel
      } as Node;

      state.currentDiagram.nodes.push(containerNode);

      // Reparent all selected nodes to the container
      // Convert their positions to be relative to the container
      for (const nodeId of nodeIds) {
        const nodeIndex = state.currentDiagram.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
          const node = state.currentDiagram.nodes[nodeIndex];
          state.currentDiagram.nodes[nodeIndex] = {
            ...node,
            parentId: containerId,
            position: {
              x: node.position.x - centroid.x,
              y: node.position.y - centroid.y
            }
          } as Node;
        }
      }

      state.currentDiagram.metadata.modified = new Date().toISOString();
    },

    // Ungroup a container node: move children back to top level and remove container
    ungroupContainer: (state, action: PayloadAction<string>) => {
      if (!state.currentDiagram) return;
      const containerId = action.payload;

      const containerIndex = state.currentDiagram.nodes.findIndex(n => n.id === containerId);
      if (containerIndex === -1) return;

      const containerNode = state.currentDiagram.nodes[containerIndex];

      // Find all immediate children
      const children = state.currentDiagram.nodes.filter(n => n.parentId === containerId);

      // Reparent children to top-level (parentId = undefined)
      // Convert positions from relative (to container) to absolute
      children.forEach(child => {
        const childIndex = state.currentDiagram!.nodes.findIndex(n => n.id === child.id);
        if (childIndex !== -1) {
          state.currentDiagram!.nodes[childIndex] = {
            ...child,
            parentId: undefined,
            position: {
              x: containerNode.position.x + child.position.x,
              y: containerNode.position.y + child.position.y
            }
          } as Node;
        }
      });

      // Remove the container node
      state.currentDiagram.nodes.splice(containerIndex, 1);

      // Update selection: select the formerly grouped children
      state.selectedItems = children.map(c => c.id);
      state.selectedNodes = children.map(c => c.id);

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
  setNodeParent,
  groupNodesIntoContainer,
  ungroupContainer
} = diagramSlice.actions;

export default diagramSlice.reducer;
