---
description: Iteratively compare LaTeX/TikZ output against target reference image and improve until visually matching
---

# Iterative LaTeX Visual Comparison Loop

This workflow enables iterative improvement of LaTeX/TikZ figure output to match a target reference image.

## Prerequisites

- `pdflatex` installed for LaTeX compilation
- `pdftoppm` installed for PDF to PNG conversion
- Target reference image available

## Workflow Steps

### 1. Set Up Comparison Context
// turbo
```bash
# Verify tools are available
which pdflatex pdftoppm
```

Identify the files:
- **Target image**: `research/complex_mud_brandom_bsd_fig_2.9.png`
- **Current .tex file**: The file being improved (e.g., `research/experiments/2.9-recreated-sample3.tex`)
- **JSON source** (optional): The diagram data that generated the .tex file

### 2. Compile LaTeX to PDF
// turbo
```bash
pdflatex -interaction=nonstopmode -output-directory=research/experiments research/experiments/[FILENAME].tex
```

Check for compilation errors. If errors occur, fix the .tex file and re-compile.

### 3. Convert PDF to PNG for Visual Comparison
// turbo
```bash
pdftoppm -png -r 150 -singlefile research/experiments/[FILENAME].pdf research/experiments/[FILENAME]-preview
```

This creates `[FILENAME]-preview.png` for visual comparison.

### 4. Visual Comparison

View both images:
1. View the target image: `research/complex_mud_brandom_bsd_fig_2.9.png`
2. View the generated image: `research/experiments/[FILENAME]-preview.png`

Evaluate against the **Comparison Criteria Checklist**:

| Criterion | Description | Status |
|-----------|-------------|--------|
| Node shapes | Ellipse for V nodes, rounded rectangle for P nodes | ⬜ |
| Nested containment | Parent nodes visually contain children | ⬜ |
| Edge styles | Solid for regular, dashed for resultant/VV | ⬜ |
| Edge labels | Numbered format (e.g., "1: PV-suff") positioned correctly | ⬜ |
| Node labels | Subscripts rendered (e.g., V_{s&p indexicals}) | ⬜ |
| Layout proportions | Similar spacing and positioning | ⬜ |
| Color scheme | Academic style (gray fills, black/gray borders) | ⬜ |
| Figure caption | "Figure X.X [Title]" at bottom | ⬜ |

### 5. Decide: Iterate or Complete

**If all criteria satisfied**: Exit loop, document success.

**If improvements needed**:
1. Identify the specific issues (list them)
2. Determine modification approach:
   - **Quick fix**: Edit the `.tex` file directly
   - **Systematic fix**: Update `src/utils/exportUtils.ts` → `generateTikZCode()` function
3. Make the changes
4. **Go back to Step 2** (re-compile)

### 6. Iteration Limits

- **Max iterations**: 10
- **If max reached**: Stop and report remaining issues for human review

## Example Iteration

```
Iteration 1:
  Issue: Edges missing numbered labels
  Fix: Add edge numbering to .tex file
  Result: Re-compile and check

Iteration 2:
  Issue: Node subscripts not rendering
  Fix: Update node labels to use LaTeX subscript syntax
  Result: Re-compile and check

Iteration 3:
  Issue: All criteria met
  Result: SUCCESS - Exit loop
```

## Output

After successful completion, produce:
1. Final `.tex` file with improvements
2. Final `.pdf` compiled output
3. Summary of changes made

## Notes

- Prefer modifying `exportUtils.ts` for issues that affect all exports
- Prefer modifying `.tex` directly for one-off figure adjustments
- Keep track of iteration count to avoid infinite loops
