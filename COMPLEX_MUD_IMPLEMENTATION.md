# Complex MUD Implementation - Development Status

This document tracks the current state of the "Complex MUD" feature implementation and provides guidance for future iterations.

## Overview

The goal is to enable creating complex Meaning-Use Diagrams like **Figure 2.9** (Indexicals as elaborated-explicating vocabulary) from academic literature. These diagrams feature:
- Nested nodes (e.g., V_s&p indexicals containing V_context-homogeneous)
- Multiple labeled edges with numbered prefixes (e.g., "1: PV-suff")
- Subscript labels below nodes
- Various edge styles (solid, dashed) and positions

## Current Implementation Status

### ✅ Completed Features

| Feature | Status | Files Modified |
|---------|--------|----------------|
| Edge label positioning (start/middle/end) | ✅ Done | `all.ts`, `Canvas.tsx` |
| Edge order numbering ("1:", "2:") | ✅ Done | `all.ts`, `Canvas.tsx` |
| Edge label backgrounds | ✅ Done | `Canvas.tsx` |
| Edge label offset fine-tuning | ✅ Done | `all.ts`, `Canvas.tsx` |
| Node subscript labels | ✅ Done | `all.ts`, `Canvas.tsx` |
| Node secondary labels | ✅ Done | `all.ts`, `Canvas.tsx` |
| Edge Modification Panel UI | ✅ Done | `EdgeModificationPanel.tsx` |
| Node Customization Panel UI | ✅ Done | `NodeCustomizationPanel.tsx` |
| Group nodes action | ✅ Done | `diagramSlice.ts`, `Header.tsx`, `App-new.tsx` |
| Container background rendering | ✅ Already existed | `Canvas.tsx` |

### 🟡 Partially Implemented / Needs Refinement

| Feature | Current State | Suggested Improvements |
|---------|---------------|------------------------|
| Container styling | Uses parent node's background color | Add dedicated container style options (border style, padding controls) |
| Subscript positioning | Fixed offset below node | Make offset adjustable, support inline subscripts (V_sub notation) |
| Label text wrapping | Basic wrapping implemented | Improve for multi-line secondary labels |
| Edge numbering | Manual entry per edge | Add auto-numbering option for all edges |

### ❌ Not Yet Implemented

| Feature | Priority | Description |
|---------|----------|-------------|
| Container resize handles | Medium | Allow manual resizing of container bounds |
| Ungroup action | Completed | Implemented in diagramSlice and UI |
| Edge routing improvements | Low | Better path routing around nested containers |
| Template diagrams | Low | Pre-built templates for common MUD patterns |
| LaTeX export of new fields | Completed | Updated exportUtils to support all new fields |

---

## File Reference

### Type Definitions
**`src/types/all.ts`**
- `BaseNode.subscript` - Italic text below node
- `BaseNode.secondaryLabel` - Additional line within node
- `Edge.labelPosition` - 'start' | 'middle' | 'end'
- `Edge.labelOffset` - { x: number, y: number }
- `Edge.orderNumber` - Number prefix for label
- `Edge.showLabelBackground` - Boolean for white background

### Canvas Rendering
**`src/components/Canvas/Canvas.tsx`**
- `getEdgeGeometry()` - Now supports `labelPosition` parameter (lines ~875-950)
- Edge label rendering with orderNumber prefix (lines ~280-350)
- Node subscript/secondaryLabel rendering (lines ~489-525)

### Redux State
**`src/store/diagramSlice.ts`**
- `groupNodesIntoContainer` action (lines ~367-420)

### UI Components
- `src/components/EdgeModificationPanel/EdgeModificationPanel.tsx` - All edge label controls
- `src/components/NodeCustomizationPanel/NodeCustomizationPanel.tsx` - Subscript and secondary label inputs
- `src/components/Header/Header.tsx` - "📦 Group" button

---

## Iteration Suggestions for Gemini 3

### Priority 1: Fix/Improve Existing Features

1. **Test the edge label background positioning**
   - The background rect may not transform correctly with rotated labels
   - Test with edges at various angles
   - Fix: Apply same rotation transform to background as text

2. **Subscript positioning edge cases**
   - When node has both secondaryLabel AND subscript, verify they don't overlap
   - Consider making subscript offset proportional to node size

3. **Group action edge preservation**
   - Verify edges between grouped nodes are preserved
   - Verify edges from external nodes to grouped nodes still work

### Priority 2: Enhance Features

1. **Add ungroup action**
   ```typescript
   // In diagramSlice.ts
   ungroupContainer(state, action: PayloadAction<{ containerId: string }>) {
     // 1. Find all children of container
     // 2. Convert their positions back to absolute
     // 3. Set parentId to undefined
     // 4. Delete the container node
   }
   ```

2. **Auto-number edges**
   - Add button in Header or EdgeModificationPanel
   - Assign sequential numbers based on creation order or user-defined order

3. **Container padding control**
   - Add `containerPadding` slider in NodeCustomizationPanel when node has children
   - Modify `calculateContainerBounds()` to use this value

### Priority 3: Export Enhancements

1. **LaTeX/TikZ export updates**
   - File: `src/utils/exportUtils.ts`
   - Add subscript export: `$V_{\text{subscript}}$`
   - Add edge numbering: Include orderNumber in label output
   - Example output:
     ```latex
     \draw[->] (node1) -- node[above] {1: PV-suff} (node2);
     ```

2. **SVG export improvements**
   - Ensure subscripts and secondary labels are included
   - Verify nested structure is preserved in SVG groups

### Priority 4: UX Improvements

1. **Multi-select with Shift+Click**
   - Currently unclear how to select multiple nodes
   - Add shift+click to add to selection
   - Visual indicator showing how many nodes selected

2. **Container visual feedback**
   - Highlight potential drop targets when dragging
   - Show outline when hovering over valid container

3. **Keyboard shortcuts**
   - `Ctrl+G` to group selected nodes
   - `Ctrl+Shift+G` to ungroup

---

## Testing Checklist

Before considering feature complete, test these scenarios:

- [x] Create a vocabulary node with subscript "context-homogeneous indexicals"
- [x] Nest one vocabulary node inside another
- [x] Create an edge with orderNumber=1 and label="PV-suff" 
- [x] Position edge label at "start" and verify it appears near source node
- [x] Enable label background and verify white rect appears
- [x] Use label offset sliders to fine-tune position
- [x] Select 3 nodes and click Group
- [x] Verify grouped nodes move together when dragging container
- [ ] Export to JSON and reimport - verify all new fields preserved
- [x] Export to LaTeX/TikZ and verify reasonable output
- [x] Ungroup container and verify nodes return to top level

---

## Known Issues

1. **ESLint warnings in Canvas.tsx**
   - Pre-existing issues with `no-case-declarations` in switch statements
   - Not related to this feature but should be fixed eventually

2. **Missing type-check npm script**
   - Use `npx tsc --noEmit` instead

3. **Container bounds calculation**
   - Currently calculates from children positions
   - May need adjustment if children are moved significantly

---

## Architecture Notes

### Coordinate Systems
- **Top-level nodes**: Absolute canvas coordinates
- **Nested nodes**: Positions relative to parent center
- `toAbsolutePosition()` in `nodeUtils.ts` converts for rendering
- `toRelativePosition()` converts for reparenting

### Rendering Order
- `sortNodesForRendering()` ensures parents render before children
- Container backgrounds render first, then node shape, then labels
- Edges render in a separate group before all nodes

---

## Contact & Attribution

- **Original Author**: Mauro Santelli (UBA - SADAF/CONICET - GEML)
- **Implementation Session**: 2026-01-12
- **AI Assistant**: Claude (Anthropic) via Antigravity

This document should be updated as features are completed or modified.
