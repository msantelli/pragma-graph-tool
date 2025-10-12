# Implementation Plan: Nested Nodes, Manual Anchors & Layout Locking

**Feature Branch**: `feature/nested-nodes-brandom`
**Target Version**: v2.0
**Duration**: 8 weeks
**Status**: Planning Complete → Implementation Started

---

## Executive Summary

This plan extends the MUD-TOTE diagram tool to support hierarchical node containment, manual edge anchor positioning, and layout locking for complex Brandom-style diagrams (see Figures 2.6, 2.9 from Between Saying and Doing).

**Core Requirements**:
1. **Nested Nodes**: Vocabularies can contain vocabularies, practices can contain practices
2. **Container Auto-sizing**: Containers auto-fit children with toggleable manual override
3. **Manual Anchors**: Advanced users can position edge connection points precisely
4. **Lock Groups**: Multiple nodes move together as a unit
5. **Export Fidelity**: All features preserved in JSON, SVG, and TikZ exports

**Design Principles**:
- Progressive disclosure: Advanced features opt-in via "Advanced Mode"
- Backward compatibility: v1 diagrams auto-migrate transparently
- Preserve workflow: Current intuitive canvas interaction unchanged

---

## Architecture Overview

### Type System Changes (v2.0)

**Before** (v1.0):
```typescript
interface BaseNode {
  id: string;
  type: NodeType;
  position: Point;  // Absolute canvas coordinates
  label: string;
  style?: NodeStyle;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  style?: EdgeStyle;
}
```

**After** (v2.0):
```typescript
interface BaseNode {
  id: string;
  type: NodeType;
  position: Point;              // Relative to parent if parentId exists
  label: string;
  style?: NodeStyle;

  // Containment
  parentId?: string | null;     // Parent container node
  childIds?: string[];          // Managed by Redux, not user-editable

  // Layout Control
  locked?: boolean;             // Prevent dragging
  lockGroupId?: string;         // Nodes with same ID move together

  // Container Behavior
  isContainer?: boolean;        // Enables container rendering
  containerPadding?: number;    // Padding around children (default: 20px)
  manualSize?: {                // Override auto-fit when set
    width: number;
    height: number;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  style?: EdgeStyle;
  isResultant?: boolean;
  resultantFrom?: string[];

  // Manual Anchors
  sourceAnchor?: Point | 'auto';  // Relative to source node center
  targetAnchor?: Point | 'auto';  // Relative to target node center
  labelOffset?: Point;            // Manual label positioning offset
}
```

### State Management Architecture

**New Redux Actions** (src/store/diagramSlice.ts):

```typescript
// Containment
setNodeParent(nodeId, parentId)     // Update containment relationship
getDescendants(nodeId)              // Return all nested children
cascadeDelete(nodeId)               // Delete node and all descendants

// Lock Groups
createLockGroup(nodeIds)            // Assign shared lockGroupId
unlockGroup(groupId)                // Clear lockGroupId for all members
moveGroup(groupId, delta)           // Move all nodes in group

// Container Management
toggleContainer(nodeId)             // Set/unset isContainer flag
setContainerPadding(nodeId, px)     // Update padding
fitContainerToChildren(nodeId)      // Auto-calculate bounds, clear manualSize
setManualContainerSize(nodeId, w, h) // Override auto-fit

// Anchor Editing
updateEdgeAnchor(edgeId, 'source'|'target', point)
resetEdgeAnchors(edgeId)            // Revert to 'auto'
```

**New Selectors** (src/store/selectors.ts):

```typescript
selectSubtree(state, nodeId)        // BFS to collect all descendants
selectAncestors(state, nodeId)      // Walk up parentId chain
selectLockGroup(state, groupId)     // All nodes with matching lockGroupId
selectAbsolutePosition(state, nodeId) // Cumulative position (handles nesting)
selectContainerBounds(state, nodeId)  // Calculate bounding box for children
isNodeOrAncestorLocked(state, nodeId) // Check lock status up hierarchy
```

### Rendering Pipeline

**Depth-First Rendering** (src/components/Canvas/Canvas.tsx):

```
renderNodesDepthFirst(parentId=null, depth=0):
  1. Get all nodes where node.parentId === parentId
  2. For each node:
     a. If isContainer, render background frame (dashed rect)
     b. Render node shape (existing logic)
     c. Recurse: renderNodesDepthFirst(node.id, depth+1)
```

**Container Frame Rendering**:
- Background: `#f5f5f5` fill
- Border: `2px dashed #ccc`
- Corner radius: `8px`
- Auto-sized to children bounds + padding
- Rendered before children (z-order)

**Drag Constraints**:
- Check `isNodeOrAncestorLocked()` before allowing drag
- If `lockGroupId` present, move entire group with `delta`
- If node `isContainer` and children moved, recalculate bounds
- Show tooltip when drag blocked by lock

---

## Phase 1: Schema Extensions & Migration (Week 1)

### 1.1 Update Type Definitions

**File**: `src/types/all.ts`

**Tasks**:
- [ ] Add containment fields to `BaseNode` (parentId, childIds, isContainer, containerPadding, manualSize)
- [ ] Add lock fields to `BaseNode` (locked, lockGroupId)
- [ ] Add anchor fields to `Edge` (sourceAnchor, targetAnchor, labelOffset)
- [ ] Set all new fields as optional with sensible defaults
- [ ] Update exported types in index.ts

**Validation**:
```bash
npx tsc --noEmit  # Should pass with no errors
```

### 1.2 Create Migration Utility

**File**: `src/utils/migrationUtils.ts` (new)

```typescript
export const CURRENT_SCHEMA_VERSION = '2.0';

export const migrateToV2 = (diagram: Diagram): Diagram => {
  // Check if already v2
  if (diagram.metadata?.version === '2.0') return diagram;

  return {
    ...diagram,
    nodes: diagram.nodes.map(node => ({
      ...node,
      parentId: node.parentId ?? null,
      childIds: node.childIds ?? [],
      locked: node.locked ?? false,
      lockGroupId: node.lockGroupId ?? undefined,
      isContainer: node.isContainer ?? false,
      containerPadding: node.containerPadding ?? 20,
      manualSize: node.manualSize ?? undefined
    })),
    edges: diagram.edges.map(edge => ({
      ...edge,
      sourceAnchor: edge.sourceAnchor ?? 'auto',
      targetAnchor: edge.targetAnchor ?? 'auto',
      labelOffset: edge.labelOffset ?? undefined
    })),
    metadata: {
      ...diagram.metadata,
      version: '2.0',
      migrated: new Date().toISOString()
    }
  };
};

export const validateDiagramV2 = (diagram: Diagram): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for circular parent references
  const visited = new Set<string>();
  const checkCycle = (nodeId: string, path: Set<string>) => {
    if (path.has(nodeId)) {
      errors.push(`Circular parent reference detected: ${Array.from(path).join(' → ')} → ${nodeId}`);
      return;
    }
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = diagram.nodes.find(n => n.id === nodeId);
    if (node?.parentId) {
      checkCycle(node.parentId, new Set([...path, nodeId]));
    }
  };

  diagram.nodes.forEach(node => checkCycle(node.id, new Set()));

  // Validate parent-child consistency
  diagram.nodes.forEach(node => {
    if (node.parentId) {
      const parent = diagram.nodes.find(n => n.id === node.parentId);
      if (!parent) {
        errors.push(`Node ${node.id} references non-existent parent ${node.parentId}`);
      } else if (!parent.childIds?.includes(node.id)) {
        errors.push(`Parent ${node.parentId} does not list child ${node.id} in childIds`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
};
```

**Tests**: `src/utils/__tests__/migrationUtils.test.ts`
- [ ] Migrate v1 diagram with no loss
- [ ] Detect circular references
- [ ] Validate parent-child consistency
- [ ] Handle malformed input gracefully

### 1.3 Integrate Migration into Load Path

**File**: `src/store/diagramSlice.ts`

```typescript
loadDiagram: (state, action: PayloadAction<Diagram>) => {
  let diagram = action.payload;

  // Auto-migrate old diagrams
  if (!diagram.metadata?.version || diagram.metadata.version < '2.0') {
    diagram = migrateToV2(diagram);
    console.info('Migrated diagram to v2.0 schema');
  }

  // Validate before loading
  const validation = validateDiagramV2(diagram);
  if (!validation.valid) {
    console.error('Invalid diagram:', validation.errors);
    // Optionally show error to user
    return;
  }

  state.currentDiagram = diagram;
  state.selectedItems = [];
  state.selectedNodes = [];
  state.selectedEdges = [];
  state.history = { past: [], future: [], maxSize: 50 };
}
```

**Deliverables**:
- Updated type definitions with new fields
- Migration utility with validation
- Unit tests for migration logic
- Auto-migration on diagram load

---

## Phase 2: State Management Updates (Week 2)

### 2.1 Containment Operations

**File**: `src/store/diagramSlice.ts`

```typescript
setNodeParent: (state, action: PayloadAction<{ nodeId: string; parentId: string | null }>) => {
  if (!state.currentDiagram) return;

  const { nodeId, parentId } = action.payload;
  const node = state.currentDiagram.nodes.find(n => n.id === nodeId);
  if (!node) return;

  // Validate no circular reference
  if (parentId) {
    const ancestors = getAncestorsHelper(state.currentDiagram.nodes, parentId);
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

  // Convert position: absolute → relative or vice versa
  const absolutePos = selectAbsolutePositionHelper(state.currentDiagram.nodes, nodeId);
  if (parentId) {
    const parentAbsPos = selectAbsolutePositionHelper(state.currentDiagram.nodes, parentId);
    node.position = {
      x: absolutePos.x - parentAbsPos.x,
      y: absolutePos.y - parentAbsPos.y
    };
  } else {
    node.position = absolutePos;
  }

  state.currentDiagram.metadata.modified = new Date().toISOString();
},

deleteNode: (state, action: PayloadAction<string>) => {
  if (!state.currentDiagram) return;

  const nodeId = action.payload;
  const descendants = getDescendantsHelper(state.currentDiagram.nodes, nodeId);
  const toDelete = [nodeId, ...descendants];

  // Remove nodes
  state.currentDiagram.nodes = state.currentDiagram.nodes.filter(n => !toDelete.includes(n.id));

  // Remove connected edges
  state.currentDiagram.edges = state.currentDiagram.edges.filter(
    e => !toDelete.includes(e.source) && !toDelete.includes(e.target)
  );

  // Clean up parent's childIds
  const node = state.currentDiagram.nodes.find(n => n.id === nodeId);
  if (node?.parentId) {
    const parent = state.currentDiagram.nodes.find(n => n.id === node.parentId);
    if (parent) {
      parent.childIds = parent.childIds?.filter(id => id !== nodeId);
    }
  }

  // Clear selections
  state.selectedItems = state.selectedItems.filter(id => !toDelete.includes(id));
  state.currentDiagram.metadata.modified = new Date().toISOString();
}
```

**Helper Functions** (src/utils/containmentUtils.ts - new):

```typescript
export const getDescendants = (nodes: Node[], nodeId: string): string[] => {
  const result: string[] = [];
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = nodes.find(n => n.id === current);
    if (node?.childIds) {
      result.push(...node.childIds);
      queue.push(...node.childIds);
    }
  }

  return result;
};

export const getAncestors = (nodes: Node[], nodeId: string): string[] => {
  const ancestors: string[] = [];
  let currentId: string | null | undefined = nodeId;

  while (currentId) {
    const node = nodes.find(n => n.id === currentId);
    if (!node?.parentId) break;
    ancestors.push(node.parentId);
    currentId = node.parentId;
  }

  return ancestors;
};

export const getAbsolutePosition = (nodes: Node[], nodeId: string): Point => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };

  let pos = { ...node.position };
  let currentId = node.parentId;

  while (currentId) {
    const parent = nodes.find(n => n.id === currentId);
    if (!parent) break;
    pos.x += parent.position.x;
    pos.y += parent.position.y;
    currentId = parent.parentId;
  }

  return pos;
};

export const calculateContainerBounds = (
  nodes: Node[],
  containerId: string
): { x: number; y: number; width: number; height: number } => {
  const container = nodes.find(n => n.id === containerId);
  if (!container?.childIds || container.childIds.length === 0) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  // If manual size set, use it
  if (container.manualSize) {
    const containerAbsPos = getAbsolutePosition(nodes, containerId);
    return {
      x: containerAbsPos.x - container.manualSize.width / 2,
      y: containerAbsPos.y - container.manualSize.height / 2,
      width: container.manualSize.width,
      height: container.manualSize.height
    };
  }

  // Auto-calculate from children
  const padding = container.containerPadding ?? 20;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  container.childIds.forEach(childId => {
    const child = nodes.find(n => n.id === childId);
    if (!child) return;

    const childAbsPos = getAbsolutePosition(nodes, childId);
    const dims = getNodeDimensions(child);

    minX = Math.min(minX, childAbsPos.x - dims.width / 2);
    minY = Math.min(minY, childAbsPos.y - dims.height / 2);
    maxX = Math.max(maxX, childAbsPos.x + dims.width / 2);
    maxY = Math.max(maxY, childAbsPos.y + dims.height / 2);
  });

  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + padding * 2,
    height: (maxY - minY) + padding * 2
  };
};
```

### 2.2 Lock Group Operations

**File**: `src/store/diagramSlice.ts`

```typescript
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
}
```

### 2.3 Container Management

**File**: `src/store/diagramSlice.ts`

```typescript
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
  height: number
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
```

**Deliverables**:
- Containment operations with validation
- Lock group management
- Container auto-fit with manual override toggle
- Helper utilities for tree traversal
- Unit tests for all operations

---

## Phase 3: Canvas Rendering with Nesting (Week 3)

### 3.1 Depth-First Rendering

**File**: `src/components/Canvas/Canvas.tsx`

Replace flat node rendering (line ~290) with:

```typescript
const renderNodesDepthFirst = useCallback((
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  parentId: string | null = null,
  depth: number = 0
) => {
  const childNodes = nodes.filter(n => n.parentId === parentId);

  childNodes.forEach(node => {
    const nodeAbsPos = getAbsolutePosition(nodes, node.id);

    // Render container frame if this is a container
    if (node.isContainer) {
      const bounds = calculateContainerBounds(nodes, node.id);

      g.append('rect')
        .attr('class', 'container-frame')
        .attr('data-container-id', node.id)
        .attr('x', bounds.x)
        .attr('y', bounds.y)
        .attr('width', bounds.width)
        .attr('height', bounds.height)
        .attr('rx', 8)
        .attr('fill', '#f5f5f5')
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .style('pointer-events', 'none'); // Don't interfere with node interaction
    }

    // Render node shape (existing logic, but use absolute position)
    const nodeGroup = g.append('g')
      .attr('class', 'node')
      .attr('data-node-id', node.id)
      .attr('data-depth', depth)
      .attr('transform', `translate(${nodeAbsPos.x}, ${nodeAbsPos.y})`)
      .style('cursor', 'pointer');

    // [Keep existing node shape rendering code]
    const isSelected = selectedItems.includes(node.id);
    const isEdgeSource = selectedTool === 'edge' && edgeSourceNodeId === node.id;
    const colors = getNodeColors(node);
    const dimensions = getNodeDimensions(node);
    const shape = getNodeShape(node);
    const strokeColor = isEdgeSource ? '#FF9800' : (isSelected ? '#2196F3' : colors.border);
    const strokeWidth = isEdgeSource ? 4 : (isSelected ? 3 : 1);

    // Add lock badge if locked
    if (node.locked || node.lockGroupId) {
      nodeGroup.append('text')
        .attr('class', 'lock-badge')
        .attr('x', dimensions.width / 2 + 5)
        .attr('y', -dimensions.height / 2 - 5)
        .attr('font-size', 12)
        .attr('fill', '#FF5722')
        .text('🔒');
    }

    // [Existing shape rendering code...]

    // Recurse into children
    renderNodesDepthFirst(g, node.id, depth + 1);
  });
}, [nodes, selectedItems, selectedTool, edgeSourceNodeId]);
```

### 3.2 Update Drag Behavior

**File**: `src/components/Canvas/Canvas.tsx` (drag handler, line ~427)

```typescript
.on('drag', function(event, d) {
  if (selectedTool !== 'select') return;

  // Check if locked
  if (d.locked) {
    showTooltip('Node is locked');
    return;
  }

  // Check if ancestor is locked
  const ancestors = getAncestors(nodes, d.id);
  const lockedAncestor = ancestors.find(ancestorId => {
    const ancestor = nodes.find(n => n.id === ancestorId);
    return ancestor?.locked;
  });

  if (lockedAncestor) {
    showTooltip('Parent container is locked');
    return;
  }

  const element = d3.select(this);
  const dragStart = element.property('__dragStart');

  // Check if mouse moved enough to be considered a drag
  const dx = Math.abs(event.x - dragStart.x);
  const dy = Math.abs(event.y - dragStart.y);
  const dragThreshold = 3;

  if (dx > dragThreshold || dy > dragThreshold) {
    element.property('__wasDragged', true);

    // If in lock group, move entire group
    if (d.lockGroupId) {
      const groupNodes = nodes.filter(n => n.lockGroupId === d.lockGroupId);
      const deltaX = event.x - (element.property('__lastX') ?? dragStart.x);
      const deltaY = event.y - (element.property('__lastY') ?? dragStart.y);

      groupNodes.forEach(gn => {
        const gnAbsPos = getAbsolutePosition(nodes, gn.id);
        const newAbsPos = { x: gnAbsPos.x + deltaX, y: gnAbsPos.y + deltaY };

        // Convert back to relative if has parent
        if (gn.parentId) {
          const parentAbsPos = getAbsolutePosition(nodes, gn.parentId);
          moveNode(gn.id, {
            x: newAbsPos.x - parentAbsPos.x,
            y: newAbsPos.y - parentAbsPos.y
          });
        } else {
          moveNode(gn.id, newAbsPos);
        }
      });

      element.property('__lastX', event.x);
      element.property('__lastY', event.y);
    } else {
      // Single node move
      const newAbsPos = { x: event.x, y: event.y };

      if (d.parentId) {
        const parentAbsPos = getAbsolutePosition(nodes, d.parentId);
        moveNode(d.id, {
          x: newAbsPos.x - parentAbsPos.x,
          y: newAbsPos.y - parentAbsPos.y
        });
      } else {
        moveNode(d.id, newAbsPos);
      }

      element.attr('transform', `translate(${newAbsPos.x}, ${newAbsPos.y})`);
    }

    // If this is a container, check if children still fit
    if (d.isContainer && !d.manualSize) {
      // Container will auto-resize on next render
    }

    // Update connected edges (keep existing edge update logic)
  }
})
```

### 3.3 Advanced Mode UI State

**File**: `src/store/uiSlice.ts`

```typescript
interface UIState {
  // ... existing fields
  advancedMode: boolean;
}

const initialState: UIState = {
  // ... existing
  advancedMode: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // ... existing
    setAdvancedMode: (state, action: PayloadAction<boolean>) => {
      state.advancedMode = action.payload;
    }
  }
});
```

**Deliverables**:
- Depth-first rendering with container frames
- Lock-aware drag constraints
- Lock group movement
- Visual lock badges
- Advanced mode toggle in UI state

---

## Phase 4: Manual Anchor Editing (Week 4)

### 4.1 Anchor Handle Rendering

**File**: `src/components/Canvas/Canvas.tsx` (after edge rendering)

```typescript
// Render anchor handles in advanced mode
if (advancedMode) {
  const selectedEdges = edges.filter(e => selectedItems.includes(e.id));

  selectedEdges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const sourceAbsPos = getAbsolutePosition(nodes, edge.source);
    const targetAbsPos = getAbsolutePosition(nodes, edge.target);

    // Calculate anchor absolute positions
    const sourceAnchorAbs = edge.sourceAnchor && edge.sourceAnchor !== 'auto'
      ? { x: sourceAbsPos.x + edge.sourceAnchor.x, y: sourceAbsPos.y + edge.sourceAnchor.y }
      : getNodeConnectionPoint(sourceNode, targetAbsPos);

    const targetAnchorAbs = edge.targetAnchor && edge.targetAnchor !== 'auto'
      ? { x: targetAbsPos.x + edge.targetAnchor.x, y: targetAbsPos.y + edge.targetAnchor.y }
      : getNodeConnectionPoint(targetNode, sourceAbsPos);

    // Source anchor handle
    g.append('circle')
      .attr('class', 'anchor-handle source-anchor')
      .attr('data-edge-id', edge.id)
      .attr('cx', sourceAnchorAbs.x)
      .attr('cy', sourceAnchorAbs.y)
      .attr('r', 6)
      .attr('fill', '#FF9800')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'move')
      .call(d3.drag<SVGCircleElement, unknown>()
        .on('drag', (event) => {
          const relPos = {
            x: event.x - sourceAbsPos.x,
            y: event.y - sourceAbsPos.y
          };
          dispatch(updateEdge({
            id: edge.id,
            updates: { sourceAnchor: relPos }
          }));
        })
        .on('end', () => {
          dispatch(saveToHistory());
        }));

    // Target anchor handle
    g.append('circle')
      .attr('class', 'anchor-handle target-anchor')
      .attr('data-edge-id', edge.id)
      .attr('cx', targetAnchorAbs.x)
      .attr('cy', targetAnchorAbs.y)
      .attr('r', 6)
      .attr('fill', '#2196F3')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'move')
      .call(d3.drag<SVGCircleElement, unknown>()
        .on('drag', (event) => {
          const relPos = {
            x: event.x - targetAbsPos.x,
            y: event.y - targetAbsPos.y
          };
          dispatch(updateEdge({
            id: edge.id,
            updates: { targetAnchor: relPos }
          }));
        })
        .on('end', () => {
          dispatch(saveToHistory());
        }));
  });
}
```

### 4.2 Edge Routing with Custom Anchors

**File**: `src/components/Canvas/Canvas.tsx` (getEdgeGeometry function)

```typescript
function getEdgeGeometry(edge: Edge, nodes: Node[], allEdges: Edge[]): EdgeGeometry | null {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return null;

  const sourceAbsPos = getAbsolutePosition(nodes, edge.source);
  const targetAbsPos = getAbsolutePosition(nodes, edge.target);

  // Calculate start/end points with anchor support
  let start: Point;
  if (edge.sourceAnchor && edge.sourceAnchor !== 'auto') {
    start = {
      x: sourceAbsPos.x + edge.sourceAnchor.x,
      y: sourceAbsPos.y + edge.sourceAnchor.y
    };
  } else {
    start = getNodeConnectionPoint(sourceNode, targetAbsPos);
  }

  let end: Point;
  if (edge.targetAnchor && edge.targetAnchor !== 'auto') {
    end = {
      x: targetAbsPos.x + edge.targetAnchor.x,
      y: targetAbsPos.y + edge.targetAnchor.y
    };
  } else {
    end = getNodeConnectionPoint(targetNode, sourceAbsPos);
  }

  // Handle self-loops
  if (edge.source === edge.target) {
    return computeLoopGeometry(start, end);
  }

  // Calculate curve offset for multiple edges
  const offset = getEdgeOffset(edge, allEdges);

  if (offset === 0) {
    return computeStraightEdgeGeometry(start, end);
  }

  return computeCurvedEdgeGeometry(start, end, offset);
}
```

**Deliverables**:
- Draggable anchor handles (orange for source, blue for target)
- Edge routing respects custom anchors
- Anchor positions stored as relative coordinates
- Reset to auto functionality

---

## Phase 5: UI Components & Layout (Week 5)

### 5.1 Advanced Panel Component

**File**: `src/components/AdvancedPanel/AdvancedPanel.tsx` (new)

```tsx
import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  setAdvancedMode,
  toggleContainer,
  setContainerPadding,
  fitContainerToChildren,
  setManualContainerSize,
  createLockGroup,
  unlockGroup,
  toggleNodeLock
} from '../../store/diagramSlice';
import './AdvancedPanel.css';

export const AdvancedPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const advancedMode = useAppSelector(state => state.ui.advancedMode);
  const selectedNodeIds = useAppSelector(state => state.diagram.selectedNodes);
  const nodes = useAppSelector(state => state.diagram.currentDiagram?.nodes ?? []);

  const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
  const singleNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  return (
    <div className="advanced-panel">
      <div className="panel-section">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={advancedMode}
            onChange={(e) => dispatch(setAdvancedMode(e.target.checked))}
          />
          <span>Advanced Mode</span>
        </label>
        <p className="help-text">
          Enable manual anchors, lock groups, and container controls
        </p>
      </div>

      {advancedMode && selectedNodes.length > 0 && (
        <>
          <hr />

          {/* Single Node Controls */}
          {singleNode && (
            <div className="panel-section">
              <h4>Node Controls</h4>

              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={singleNode.locked ?? false}
                  onChange={() => dispatch(toggleNodeLock(singleNode.id))}
                />
                <span>Lock Node</span>
              </label>

              <div className="container-controls">
                <h5>Container Settings</h5>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={singleNode.isContainer ?? false}
                    onChange={() => dispatch(toggleContainer(singleNode.id))}
                  />
                  <span>Enable Container Mode</span>
                </label>

                {singleNode.isContainer && (
                  <>
                    <label className="input-label">
                      Padding (px):
                      <input
                        type="number"
                        min="0"
                        value={singleNode.containerPadding ?? 20}
                        onChange={(e) => dispatch(setContainerPadding({
                          nodeId: singleNode.id,
                          padding: Number(e.target.value)
                        }))}
                      />
                    </label>

                    <div className="button-row">
                      <button
                        onClick={() => dispatch(fitContainerToChildren(singleNode.id))}
                        disabled={!singleNode.manualSize}
                      >
                        Auto-fit to Children
                      </button>
                    </div>

                    {singleNode.manualSize && (
                      <p className="info-text">
                        Manual size: {singleNode.manualSize.width.toFixed(0)}×
                        {singleNode.manualSize.height.toFixed(0)} px
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Multi-Selection Controls */}
          {selectedNodes.length > 1 && (
            <div className="panel-section">
              <h4>Group Controls</h4>
              <p>{selectedNodes.length} nodes selected</p>

              <div className="button-row">
                <button
                  onClick={() => dispatch(createLockGroup(selectedNodeIds))}
                >
                  Create Lock Group
                </button>
              </div>

              {selectedNodes.every(n => n.lockGroupId) &&
               new Set(selectedNodes.map(n => n.lockGroupId)).size === 1 && (
                <div className="button-row">
                  <button
                    onClick={() => dispatch(unlockGroup(selectedNodes[0].lockGroupId!))}
                    className="danger"
                  >
                    Unlock Group
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

**File**: `src/components/AdvancedPanel/AdvancedPanel.css` (new)

```css
.advanced-panel {
  padding: 16px;
  background: #fff;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 20px;
}

.panel-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.panel-section h5 {
  margin: 12px 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 8px;
}

.input-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.input-label input[type="number"] {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.button-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.button-row button {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid #2196F3;
  background: #fff;
  color: #2196F3;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.button-row button:hover {
  background: #2196F3;
  color: #fff;
}

.button-row button.danger {
  border-color: #F44336;
  color: #F44336;
}

.button-row button.danger:hover {
  background: #F44336;
  color: #fff;
}

.button-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.help-text, .info-text {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 16px 0;
}
```

### 5.2 Update App Layout

**File**: `src/App.tsx`

```tsx
<div className="app-container">
  <Header />

  <div className="main-layout">
    <Toolbar />

    <div className="workspace">
      <Canvas />

      {currentDiagram && (
        <div className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={activeTab === 'properties' ? 'active' : ''}
              onClick={() => setActiveTab('properties')}
            >
              Properties
            </button>
            <button
              className={activeTab === 'advanced' ? 'active' : ''}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced
            </button>
            <button
              className={activeTab === 'export' ? 'active' : ''}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
          </div>

          <div className="sidebar-content">
            {activeTab === 'properties' && <NodeCustomizationPanel />}
            {activeTab === 'advanced' && <AdvancedPanel />}
            {activeTab === 'export' && <ExportPanel />}
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Existing modals */}
</div>
```

**File**: `src/App.css` (updates)

```css
.main-layout {
  display: grid;
  grid-template-columns: auto 1fr auto;
  height: calc(100vh - 60px);
}

.workspace {
  display: flex;
  position: relative;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  border-left: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  background: #fff;
}

.sidebar-tabs button {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.sidebar-tabs button.active {
  color: #2196F3;
  border-bottom: 2px solid #2196F3;
  font-weight: 600;
}

.sidebar-tabs button:hover {
  background: #f5f5f5;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}
```

**Deliverables**:
- AdvancedPanel component with all controls
- Tabbed sidebar layout (Properties | Advanced | Export)
- Container controls (padding, auto-fit toggle)
- Lock group management UI
- Responsive layout adjustments

---

## Phase 6: Export Parity (Week 6)

### 6.1 JSON Export (Already Handled)

No changes needed - new fields auto-serialize. Just update version:

```typescript
// src/utils/exportUtils.ts
export const exportAsJSON = (diagram: Diagram) => {
  const exportData = {
    ...diagram,
    metadata: {
      ...diagram.metadata,
      exported: new Date().toISOString(),
      version: '2.0'
    }
  };
  // ... rest unchanged
};
```

### 6.2 SVG Export with Container Frames

**File**: `src/utils/exportUtils.ts:370`

```typescript
export const exportAsSVG = (diagram: Diagram) => {
  const { nodes, edges } = diagram;
  const bounds = calculateDiagramBounds(nodes);

  // SVG header
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}"
     width="${bounds.width}" height="${bounds.height}">

  <style>
    .node-text { font-family: Arial, sans-serif; text-anchor: middle; }
    .edge-text { font-family: Arial, sans-serif; text-anchor: middle; font-size: 12px; }
    .container-frame { fill: #f5f5f5; stroke: #999; stroke-width: 2; stroke-dasharray: 5,5; }
  </style>

  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7"
            refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
    </marker>
  </defs>

  <!-- Container Frames -->
`;

  // Render container frames before nodes
  const containers = nodes.filter(n => n.isContainer);
  containers.forEach(container => {
    const containerBounds = calculateContainerBounds(nodes, container.id);
    svgContent += `  <rect class="container-frame"
      x="${containerBounds.x.toFixed(2)}"
      y="${containerBounds.y.toFixed(2)}"
      width="${containerBounds.width.toFixed(2)}"
      height="${containerBounds.height.toFixed(2)}"
      rx="8" />\n`;
  });

  svgContent += `
  <!-- Edges -->
`;

  // [Rest of edge rendering unchanged]

  // [Rest of node rendering - use getAbsolutePosition for nested nodes]

  svgContent += '</svg>';
  // ... rest unchanged
};
```

### 6.3 TikZ Export with Nesting

**File**: `src/utils/exportUtils.ts:555`

```typescript
const generateTikZCode = (nodes: Node[], edges: Edge[]): string => {
  if (nodes.length === 0) return '\\begin{tikzpicture}\n\\end{tikzpicture}';

  const bounds = calculateDiagramBounds(nodes);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const maxDimension = Math.max(bounds.width, bounds.height);
  const scale = maxDimension > 0 ? 15 / maxDimension : 1;

  let tikz = `\\begin{tikzpicture}\n`;
  tikz += `\\usetikzlibrary{fit,backgrounds}\n\n`;

  // [Color definitions unchanged]

  // Add nodes with clean naming
  tikz += '% Nodes\n';
  const nodeIdMap = new Map<string, string>();

  nodes.forEach((node, index) => {
    const absPos = getAbsolutePosition(nodes, node.id);
    const x = ((absPos.x - centerX) * scale).toFixed(2);
    const y = (-(absPos.y - centerY) * scale).toFixed(2);
    const label = escapeLaTeXText(node.label);
    const nodeId = `node${index + 1}`;
    nodeIdMap.set(node.id, nodeId);

    // [Existing node rendering code]

    tikz += `\\node[${nodeStyle}] (${nodeId}) at (${x}, ${y}) {${label}};\n`;
  });

  // Add container frames
  tikz += '\n% Container Frames\n';
  const containers = nodes.filter(n => n.isContainer);

  containers.forEach(container => {
    if (!container.childIds || container.childIds.length === 0) return;

    const childNodeIds = container.childIds
      .map(childId => nodeIdMap.get(childId))
      .filter(id => id);

    if (childNodeIds.length === 0) return;

    const padding = ((container.containerPadding ?? 20) / 40).toFixed(2); // Convert to cm

    tikz += `\\begin{scope}[on background layer]\n`;
    tikz += `  \\node[fit=(${childNodeIds.join(') (')}), draw=gray, dashed, fill=gray!10, inner sep=${padding}cm, rounded corners=3pt] {};\n`;
    tikz += `\\end{scope}\n`;
  });

  // [Rest of edge rendering unchanged]

  tikz += '\n\\end{tikzpicture}';

  return tikz;
};
```

**Update LaTeX Document Preamble**:

```typescript
const latexDocument = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{tikz}
\\usepackage{caption}
\\usetikzlibrary{positioning,shapes.geometric,arrows.meta,fit,backgrounds}
...
`;
```

**Deliverables**:
- Container frames in SVG exports
- TikZ `fit` nodes for container boundaries
- Nested positions correctly converted to absolute
- Anchor positions preserved in JSON

---

## Phase 7: Testing & Fixtures (Week 7)

### 7.1 Unit Tests

**File**: `src/utils/__tests__/migrationUtils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { migrateToV2, validateDiagramV2 } from '../migrationUtils';
import type { Diagram } from '../../types/all';

describe('Migration Utils', () => {
  it('should migrate v1 diagram to v2 with no data loss', () => {
    const v1Diagram: Diagram = {
      id: 'test',
      name: 'Test',
      type: 'MUD',
      nodes: [
        { id: '1', type: 'vocabulary', position: { x: 100, y: 100 }, label: 'V1' }
      ],
      edges: [],
      entryPoints: [],
      exitPoints: [],
      metadata: { created: '2024-01-01', modified: '2024-01-01' }
    };

    const v2 = migrateToV2(v1Diagram);

    expect(v2.metadata.version).toBe('2.0');
    expect(v2.nodes[0].parentId).toBe(null);
    expect(v2.nodes[0].childIds).toEqual([]);
    expect(v2.nodes[0].locked).toBe(false);
  });

  it('should detect circular parent references', () => {
    const badDiagram: Diagram = {
      // ... diagram with node A -> parent B -> parent A
    };

    const validation = validateDiagramV2(badDiagram);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain(expect.stringMatching(/circular/i));
  });

  // More tests...
});
```

**File**: `src/utils/__tests__/containmentUtils.test.ts`

```typescript
describe('Containment Utils', () => {
  it('should return all descendants for nested structure', () => {
    // Test getDescendants with 3-level nesting
  });

  it('should calculate absolute position through parent chain', () => {
    // Test getAbsolutePosition with nested nodes
  });

  it('should calculate container bounds from children', () => {
    // Test calculateContainerBounds with padding
  });
});
```

### 7.2 Integration Tests

**File**: `src/components/__tests__/Canvas.integration.test.tsx`

```typescript
describe('Canvas Nesting Integration', () => {
  it('should render nested nodes in correct z-order', () => {
    // Render diagram with 2-level nesting
    // Assert container frame appears before children
  });

  it('should move entire lock group when dragging member', () => {
    // Create lock group of 3 nodes
    // Drag one node
    // Assert all 3 moved by same delta
  });

  it('should prevent drag when ancestor is locked', () => {
    // Lock parent node
    // Attempt to drag child
    // Assert child position unchanged
  });

  it('should show anchor handles in advanced mode', () => {
    // Enable advanced mode
    // Select edge
    // Assert 2 anchor handles rendered
  });
});
```

### 7.3 Regression Fixtures

**File**: `research/fixtures/brandom-nested-mud-1.json`

```json
{
  "id": "brandom-ex-1",
  "name": "Elaborated-explicating (LX) conditionals",
  "type": "MUD",
  "nodes": [
    {
      "id": "v-cond",
      "type": "vocabulary",
      "position": { "x": 200, "y": 100 },
      "label": "V_conditionals",
      "style": { "size": "large" }
    },
    {
      "id": "v1",
      "type": "vocabulary",
      "position": { "x": 500, "y": 100 },
      "label": "V_1",
      "style": { "size": "large" }
    },
    {
      "id": "p-cond",
      "type": "practice",
      "position": { "x": 200, "y": 300 },
      "label": "P_conditionals",
      "style": { "size": "large" }
    },
    {
      "id": "p-inferring",
      "type": "practice",
      "position": { "x": 500, "y": 300 },
      "label": "P_inferring",
      "style": { "size": "large" },
      "isContainer": true,
      "containerPadding": 30,
      "childIds": ["p-adp"]
    },
    {
      "id": "p-adp",
      "type": "practice",
      "position": { "x": 0, "y": 50 },
      "label": "P_ADP",
      "parentId": "p-inferring",
      "style": { "size": "medium" }
    }
  ],
  "edges": [
    { "id": "e1", "source": "p-inferring", "target": "v1", "type": "PV-suff", "label": "1: PV-suff" },
    { "id": "e2", "source": "p-inferring", "target": "v1", "type": "PV-nec", "label": "2: PV-nec" },
    { "id": "e3", "source": "p-adp", "target": "p-cond", "type": "PP-suff", "label": "P_AlgEl 3: PP-suff" },
    { "id": "e4", "source": "p-cond", "target": "v-cond", "type": "PV-suff", "label": "4: PV-suff" },
    { "id": "e5", "source": "v-cond", "target": "p-inferring", "type": "VP-suff", "label": "5: VP-suff" },
    { "id": "e-res", "source": "v-cond", "target": "v1", "type": "VV", "label": "Res3:VV 1-5", "isResultant": true }
  ],
  "entryPoints": [],
  "exitPoints": [],
  "metadata": {
    "created": "2024-01-01",
    "modified": "2024-01-01",
    "version": "2.0",
    "description": "Figure 2.6 from Brandom - Elaborated-explicating conditionals"
  }
}
```

**File**: `research/fixtures/brandom-nested-mud-2.json`

(Figure 2.9 - more complex with 3 levels of nesting)

**Test Suite**:

```typescript
describe('Brandom Diagram Fixtures', () => {
  it('should load and render Figure 2.6 correctly', () => {
    const diagram = loadFixture('brandom-nested-mud-1.json');
    renderDiagram(diagram);

    // Assert P_ADP is nested inside P_inferring
    const pAdp = diagram.nodes.find(n => n.id === 'p-adp');
    expect(pAdp.parentId).toBe('p-inferring');

    // Assert container frame rendered
    const containerFrame = screen.getByTestId('container-frame-p-inferring');
    expect(containerFrame).toBeInTheDocument();
  });

  it('should export Figure 2.6 to SVG with nesting preserved', () => {
    const diagram = loadFixture('brandom-nested-mud-1.json');
    const svg = exportAsSVG(diagram);

    // Assert container frame in SVG
    expect(svg).toContain('class="container-frame"');

    // Assert nodes present
    expect(svg).toContain('P_inferring');
    expect(svg).toContain('P_ADP');
  });
});
```

**Deliverables**:
- Comprehensive unit test suite
- Integration tests for nesting + locking
- 2 Brandom diagram fixtures as JSON
- Regression tests ensuring fixture render/export stability

---

## Phase 8: Documentation (Week 8)

### 8.1 Update User Guide

**File**: `USER_GUIDE.md`

Add sections:

```markdown
## Advanced Features

### Nested Nodes (Container Mode)

You can nest nodes inside other nodes to represent hierarchical relationships, such as:
- Vocabularies containing sub-vocabularies (e.g., V_indexicals ⊃ V_context-homogeneous)
- Practices containing sub-practices (e.g., P_inferring ⊃ P_ADP)

**Creating a Container**:
1. Select the parent node
2. Open the "Advanced" tab in the right sidebar
3. Enable "Advanced Mode"
4. Check "Enable Container Mode"

**Adding Children**:
1. Create new nodes inside the container area
2. Select a child node
3. In the Advanced panel, use "Set Parent" dropdown to assign containment
   (Future: drag-and-drop reparenting)

**Container Auto-sizing**:
- By default, containers auto-fit to their children with padding
- Adjust padding in Advanced panel (default: 20px)
- To manually resize: drag container corners (requires "Manual Size" mode)
- To revert: click "Auto-fit to Children"

---

### Lock Groups

Lock groups allow multiple nodes to move together as a unit, preserving their relative positions.

**Creating a Lock Group**:
1. Select multiple nodes (Ctrl+click or drag-select)
2. Open Advanced tab
3. Click "Create Lock Group"
4. All selected nodes now move together

**Unlocking**:
- Select any node in the group
- Click "Unlock Group" in Advanced panel

**Individual Locks**:
- Lock a single node to prevent any movement
- Locked nodes show a 🔒 badge
- Locked parents prevent child dragging

---

### Manual Edge Anchors

In Advanced Mode, you can manually position where edges connect to nodes.

**Editing Anchors**:
1. Enable Advanced Mode
2. Select an edge (click on it)
3. Orange circle = source anchor, Blue circle = target anchor
4. Drag anchor handles to reposition connection points
5. Anchors stored as relative coordinates (preserved in exports)

**Resetting to Auto**:
- Right-click edge → "Reset Anchors" (Future feature)
- Or delete and recreate edge

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+G | Create Lock Group |
| Ctrl+Shift+G | Unlock Group |
| Ctrl+L | Toggle Node Lock |
| A | Toggle Advanced Mode |
| Ctrl+[ | Decrease Container Padding |
| Ctrl+] | Increase Container Padding |
```

### 8.2 Architecture Documentation

**File**: `ARCHITECTURE_PROGRESS.md`

Add section:

```markdown
## Schema v2.0: Nested Nodes & Advanced Layout

### Type System Changes

**BaseNode Extensions**:
- `parentId`: String reference to parent node (null for root)
- `childIds`: Array of child IDs (managed by Redux)
- `locked`: Boolean preventing drag
- `lockGroupId`: Shared ID for grouped movement
- `isContainer`: Enables container frame rendering
- `containerPadding`: Padding in pixels (default: 20)
- `manualSize`: Override auto-fit with { width, height }

**Edge Extensions**:
- `sourceAnchor`: Point relative to source center or 'auto'
- `targetAnchor`: Point relative to target center or 'auto'
- `labelOffset`: Manual label positioning

### State Management

**Containment Selectors** (src/store/selectors.ts):
- `selectSubtree(nodeId)`: BFS to collect all descendants
- `selectAncestors(nodeId)`: Walk up parent chain
- `selectAbsolutePosition(nodeId)`: Cumulative position accounting for nesting
- `selectContainerBounds(nodeId)`: Auto-calculate bounds from children + padding

**Lock Group Selectors**:
- `selectLockGroup(groupId)`: All nodes with matching lockGroupId
- `isNodeOrAncestorLocked(nodeId)`: Check lock status up hierarchy

**Validation**:
- Circular reference detection prevents node A → parent B → parent A
- Parent-child consistency enforced (parentId ↔ childIds bookkeeping)
- Auto-migration from v1.x schemas on load

### Rendering Pipeline

**Depth-First Rendering** (src/components/Canvas/Canvas.tsx):

```
renderNodesDepthFirst(parentId, depth):
  for each node where node.parentId === parentId:
    if node.isContainer:
      render container frame (dashed rect, #f5f5f5 fill)
    render node shape
    recurse into children
```

**Z-Order**:
- Container frames rendered first (background)
- Nodes rendered in depth-first order
- Edges rendered before nodes (so nodes appear on top)

**Drag Constraints**:
- Check `isNodeOrAncestorLocked()` before allowing drag
- If `lockGroupId` present, move all group members with same delta
- If `isContainer` and no `manualSize`, recalculate bounds on child move

### Export Parity

**SVG**:
- Container frames exported as `<rect class="container-frame">`
- Nested nodes positioned absolutely (parent offsets applied)
- Anchor positions calculated from relative coords

**TikZ**:
- Containers rendered using `\node[fit=(...), draw=gray, dashed]`
- Requires `\usetikzlibrary{fit,backgrounds}`
- Inner sep set to `containerPadding` in cm

**JSON**:
- All fields auto-serialize
- Version: "2.0" in metadata
- Auto-migration on import if version < 2.0
```

### 8.3 Migration Guide

**File**: `MIGRATION_V1_TO_V2.md` (new)

```markdown
# Migration Guide: v1.x → v2.0

## Overview

Version 2.0 introduces hierarchical node nesting, lock groups, and manual edge anchors. All v1.x diagrams are automatically migrated on load with no data loss.

## Automatic Migration

When you open a v1.x diagram:
1. System detects `metadata.version` < 2.0
2. Runs `migrateToV2()` transformation
3. Adds default values for new fields:
   - `parentId: null` (all nodes become root-level)
   - `childIds: []`
   - `locked: false`
   - `isContainer: false`
   - `sourceAnchor/targetAnchor: 'auto'`
4. Updates `metadata.version` to "2.0"
5. Diagram loads normally

**No action required from users.**

## Converting Flat Diagrams to Nested

If you want to convert an existing flat diagram to use nesting:

### Option 1: Manual Reparenting
1. Open diagram
2. Select child node
3. Open Advanced tab → Enable Advanced Mode
4. Use "Set Parent" dropdown (Future: will be available)
5. Currently: Export JSON, manually edit `parentId` field, re-import

### Option 2: Edit JSON Directly
```json
{
  "nodes": [
    {
      "id": "parent",
      "type": "practice",
      "label": "P_inferring",
      "isContainer": true,
      "childIds": ["child1", "child2"]
    },
    {
      "id": "child1",
      "type": "practice",
      "label": "P_ADP",
      "parentId": "parent",
      "position": { "x": 0, "y": 50 }  // Relative to parent!
    }
  ]
}
```

**Important**: When setting `parentId`, convert child position from absolute to relative coordinates:
```
child.position.x = child.absoluteX - parent.absoluteX
child.position.y = child.absoluteY - parent.absoluteY
```

## Best Practices

### When to Use Nesting
- **Do**: Nested vocabularies (V_indexicals ⊃ V_Kaplan-rules)
- **Do**: Nested practices (P_inferring ⊃ P_ADP)
- **Don't**: Cross-type nesting (V ⊃ P) - not philosophically sound

### Container Sizing
- Start with auto-fit (default)
- Adjust padding if children too cramped
- Use manual size only for precise layout needs

### Lock Groups
- Lock groups when you have stable sub-diagrams
- Useful for moving complex structures without distortion
- Unlock before adding/removing group members

### Anchor Editing
- Use sparingly - auto-anchors work for most cases
- Helpful when edges overlap or routing is awkward
- Remember: anchors stored as relative coords, preserved in exports

## Troubleshooting

**"Diagram failed to load"**
- Check browser console for validation errors
- Likely cause: circular parent reference or orphaned `parentId`
- Fix: Edit JSON to remove invalid `parentId` values

**"Container doesn't resize when I drag children"**
- Check if `manualSize` is set
- Fix: Click "Auto-fit to Children" in Advanced panel

**"Anchor handles not showing"**
- Ensure Advanced Mode is enabled
- Ensure edge is selected (click on it)

**"Can't drag node"**
- Check if node or parent is locked (look for 🔒 badge)
- Fix: Unlock node/parent in Advanced panel
```

---

## Testing Checklist

Before merging feature branch:

- [ ] All unit tests pass (`npm test`)
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Load v1 diagram, verify auto-migration
- [ ] Create 2-level nested diagram, verify container frames
- [ ] Create 3-level nested diagram, verify depth-first rendering
- [ ] Drag node with `lockGroupId`, verify all members move
- [ ] Lock parent, attempt drag child, verify blocked
- [ ] Edit edge anchor in advanced mode, verify position persists
- [ ] Export nested diagram to SVG, verify container frames present
- [ ] Export nested diagram to TikZ, verify `fit` nodes correct
- [ ] Export nested diagram to JSON, re-import, verify no data loss
- [ ] Load Brandom fixture 2.6, verify matches reference image
- [ ] Load Brandom fixture 2.9, verify matches reference image

---

## Risk Mitigation

### Performance Concerns

**Issue**: Large nested diagrams may slow rendering

**Mitigation**:
- Implement virtual rendering (only render visible subtrees)
- Add collapse/expand controls for containers
- Lazy-load deeply nested children

### Backward Compatibility

**Issue**: Users on old browsers may not support new features

**Mitigation**:
- Auto-migration handles schema changes transparently
- Graceful degradation: advanced features opt-in
- Version check warns users on incompatible browsers

### User Confusion

**Issue**: Advanced features add complexity

**Mitigation**:
- Advanced mode off by default
- Progressive disclosure in UI
- Comprehensive user guide with examples
- Tooltips and help text throughout

---

## Future Enhancements

### Phase 9 (Post-Launch)

- **Drag-and-Drop Reparenting**: Drag node onto container to set parent
- **Collapse/Expand Containers**: Hide children to simplify view
- **Container Resize Handles**: Drag corners to set manual size
- **Anchor Presets**: Common anchor positions (top, bottom, left, right)
- **Smart Edge Routing**: Avoid crossing container boundaries
- **Nested Edge Grouping**: Bundle edges between same containers

### Phase 10 (Advanced)

- **Auto-Layout for Nested Diagrams**: Dagre/ELK integration
- **Container Templates**: Predefined nested structures
- **Zoom to Container**: Focus on specific subtree
- **Multi-Level Undo**: Track containment changes separately

---

## References

**Brandom Diagrams**:
- Figure 2.6: Elaborated-explicating (LX) conditionals
- Figure 2.9: Indexicals as elaborated-explicating vocabulary

**Related Documentation**:
- `USER_GUIDE.md`: User-facing feature documentation
- `ARCHITECTURE_PROGRESS.md`: Technical architecture details
- `CLAUDE.md`: Project overview and workflows

**Implementation Files**:
- `src/types/all.ts`: Type definitions
- `src/store/diagramSlice.ts`: State management
- `src/components/Canvas/Canvas.tsx`: Rendering logic
- `src/utils/containmentUtils.ts`: Tree traversal helpers
- `src/utils/exportUtils.ts`: Export functions

---

## Timeline Summary

| Week | Phase | Status | Deliverables |
|------|-------|--------|--------------|
| 1 | Schema & Migration | ✅ Complete | Updated types, migration util, tests |
| 2 | State Management | 🔄 In Progress | Redux actions, selectors, validation |
| 3 | Canvas Rendering | ⏳ Pending | Depth-first render, drag constraints |
| 4 | Anchor Editing | ⏳ Pending | Anchor handles, edge routing |
| 5 | UI Components | ⏳ Pending | AdvancedPanel, tabbed sidebar |
| 6 | Export Parity | ⏳ Pending | SVG/TikZ container frames |
| 7 | Testing | ⏳ Pending | Unit/integration tests, fixtures |
| 8 | Documentation | ⏳ Pending | User guide, migration docs |

**Current Phase**: Week 2 - State Management Updates
**Next Milestone**: Containment operations functional in Redux

---

## Contact

For questions or feedback on this implementation:
- **Author**: Mauro Santelli
- **Email**: mesantelli@uba.ar
- **Repository**: https://github.com/msantelli/mud-tote-diagram-tool

---

*Last Updated*: 2025-10-11
*Plan Version*: 1.0
*Target Release*: v2.0 (8 weeks from start)
