# Testing Nested Nodes (Phase 3)

## Quick Start

```bash
# Start dev server
npm run dev

# Open browser at http://localhost:5173
```

## Test Cases

### 1. Simple Nesting (`test-nested-simple.json`)

**What to test:**
- Container frame rendering (gray dashed rectangle)
- Single-level nesting (P_ADP inside P_inferring)
- Edge connections to nested nodes
- Relative positioning within container

**Steps:**
1. File → Load Diagram → Select `docs/test-nested-simple.json`
2. Verify gray dashed frame appears around P_inferring
3. Verify P_ADP is centered inside the frame
4. Try dragging P_inferring - P_ADP should move with it
5. Try dragging P_ADP - it should move relative to P_inferring

**Expected behavior:**
- Container frame has 30px padding around P_ADP
- Edges connect correctly from Asserting → P_inferring and P_ADP → Inferring
- Nested node positions are relative to parent's center

---

### 2. Complex Nesting (`test-nested-complex.json`)

**What to test:**
- Multi-level nesting (3 levels deep)
- Lock groups (linked movement)
- Lock badges (🔒 emoji)
- Container padding at different levels

**Steps:**
1. File → Load Diagram → Select `docs/test-nested-complex.json`
2. Verify nested frames: P_inferring contains P_ADP, which contains P_core
3. Verify 🔒 badges appear on "Locked A" and "Locked B"
4. Try dragging P_inferring - all nested children should move together
5. Try dragging "Locked A" - "Locked B" should move with it (lock group)
6. Try dragging "Locked A" or "Locked B" - they should NOT move (locked)

**Expected behavior:**
- Three container frames visible with different padding levels
- Lock badges appear at top-right of locked nodes
- Lock group nodes move together when dragged
- Locked nodes cannot be dragged individually

---

## Current Limitations (Phase 3)

These are **expected** and will be addressed in Phase 4:

1. **No UI for creating nested nodes**: You can only load them from JSON
2. **No UI for toggling container mode**: Must be set in JSON
3. **No UI for creating lock groups**: Must be set in JSON
4. **No manual container sizing**: Auto-fit only (no toggle yet)
5. **No advanced mode toggle**: All features visible regardless of advancedMode

## Known Issues

None at this stage - report any bugs found during testing!

## What Works

✅ Depth-first rendering with correct z-order
✅ Container frames with auto-calculated bounds
✅ Lock badges on locked nodes
✅ Lock group movement (drag one, move all)
✅ Edges connect correctly to nested nodes (absolute positions)
✅ Relative positioning preserved when dragging
✅ Backward compatibility with v1 diagrams (no parentId/childIds)

## Next Steps

After manual testing confirms Phase 3 works:
- **Phase 4**: Advanced Panel UI for creating containers, lock groups, and manual sizing
- **Phase 5**: Export updates (SVG/TikZ) to include container frames
- **Phase 6**: Documentation and examples

---

## Troubleshooting

**Container frame not visible:**
- Check that `isContainer: true` is set in JSON
- Check that `childIds` array is not empty

**Lock badge not showing:**
- Check that `locked: true` is set in JSON
- Or check that an ancestor has `locked: true`

**Lock group not working:**
- Check that both nodes have the same `lockGroupId` value
- Both nodes must also have `locked: true`

**Edges not connecting:**
- Verify node IDs match in edge source/target
- Check browser console for errors

**Drag behavior unexpected:**
- Remember: positions in JSON are relative to parent if `parentId` exists
- Try reloading the diagram if state gets inconsistent
