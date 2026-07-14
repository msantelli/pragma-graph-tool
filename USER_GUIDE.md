# Pragma Graph Tool - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Creating Your First Diagram](#creating-your-first-diagram)
4. [Understanding Node Types](#understanding-node-types)
5. [Working with Edges](#working-with-edges)
6. [Nested Nodes and Grouping](#nested-nodes-and-grouping)
7. [Customizing Your Diagram](#customizing-your-diagram)
8. [Exporting Your Work](#exporting-your-work)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Command-Line Interface (CLI)](#command-line-interface-cli)
11. [Academic Context](#academic-context)

## Getting Started

The Pragma Graph Tool is a specialized application for creating visual representations of Robert Brandom's philosophical framework involving Meaning-Use Diagrams (MUDs) and Test-Operate-Test-Exit (TOTE) cycles.

### Accessing the Tool
- **Web Version**: Access through your browser at the deployed URL
- **Offline Use**: The tool works offline once loaded thanks to Progressive Web App (PWA) technology
- **Desktop Version**: Available as downloadable executables for Windows, Mac, and Linux. The desktop app exposes a CLI bridge (connected mode) so CLI commands update the canvas in real time

### Browser Requirements
- Modern browsers supporting ES2020+
- Chrome/Edge 90+, Firefox 90+, Safari 14+
- JavaScript must be enabled

## Interface Overview

### Header Section
- **Title & Author**: Project identification and credit
- **Mode Selector**: Choose between MUD, TOTE, HYBRID, or GENERIC modes
- **Grid Controls**: Toggle grid visibility, snapping, and spacing
- **Tool Palette**: Tools with icons, labels, and keyboard shortcuts
- **History**: Undo and Redo buttons
- **Grouping**: Group and Ungroup buttons for nested nodes
- **File**: Import and Export functions (JSON, SVG, LaTeX)

### Main Canvas
- **Interactive Drawing Area**: Click to create nodes, drag to move them
- **Zoom & Pan**: Use mouse wheel to zoom, drag background to pan
- **Selection Feedback**: Selected items are highlighted
- **Empty State**: Guidance appears when canvas is empty

### Side Panels
- **Properties Sidebar** (right): Edit selected node or edge properties; collapsible
- **Legend** (bottom-left): Shows node and edge types for current mode; collapsible

### Popup Panels
- **Node Customization**: Appears when double-clicking nodes
- **Edge Modification**: Appears when double-clicking edges
- **Edge Type Selector**: Appears when creating edges between nodes

## Creating Your First Diagram

### Step 1: Choose Your Mode
1. Look at the mode selector in the header
2. Choose the appropriate mode for your diagram:
   - **MUD**: For meaning-use relationships (Vocabulary and Practice nodes)
   - **TOTE**: For feedback cycle analysis (Test and Operate nodes)
   - **HYBRID**: For combined MUD/TOTE diagrams
   - **GENERIC**: For general-purpose diagrams
3. A hint banner explains what tools are available in the selected mode

### Step 2: Add Nodes
1. Select a node type from the tool palette (or press its keyboard shortcut)
2. Click anywhere on the canvas to create a node
3. The node will appear at the clicked location
4. Repeat to add more nodes

### Step 3: Connect Nodes
1. Select the Edge tool (`E`) from the palette
2. Click on the first node (source)
3. Click on the second node (target)
4. If automatic edge detection is enabled (MUD mode), the edge type is inferred
5. Otherwise, choose the edge type from the selector

### Step 4: Customize and Export
1. Select a node or edge to view its properties in the sidebar
2. Double-click nodes or edges for advanced customization
3. Use the grid controls for precise alignment
4. Export your diagram using the export buttons

## Understanding Node Types

### MUD (Meaning-Use Diagram) Nodes

#### Vocabulary Nodes (Ellipse)
- **Purpose**: Represent linguistic or conceptual vocabularies
- **Visual**: Elliptical shape, monochrome (ink on white, as in exports)
- **Shortcut**: `V`
- **Example**: "Color terminology", "Modal logic vocabulary"

#### Practice Nodes (Rounded Rectangle)
- **Purpose**: Represent abilities, skills, or behavioral patterns
- **Visual**: Rounded rectangle shape, monochrome
- **Shortcut**: `P`
- **Example**: "Color discrimination ability", "Logical reasoning practice"

### TOTE (Test-Operate-Test-Exit) Nodes

#### Test Nodes (Diamond)
- **Purpose**: Represent condition checking or decision points
- **Visual**: Diamond shape, monochrome
- **Shortcut**: `T`
- **Example**: "Is goal achieved?", "Does output match criteria?"

#### Operate Nodes (Rectangle)
- **Purpose**: Represent actions or operations to be performed
- **Visual**: Rectangle shape, monochrome
- **Shortcut**: `O`
- **Example**: "Adjust parameters", "Apply correction"

### Generic Nodes
- **Custom Nodes**: Circle shape for general-purpose use
- **Shortcut**: `C`

### Overflow Indicator
When a node's label is too long to fit within its shape, a ⚠ indicator appears at the bottom-right corner of the node on the canvas. This warns that the label will likely overflow in TikZ export. To resolve it, shorten the label or move text to the secondary label or subscript fields.

## Working with Edges

### Edge Types by Mode

#### MUD Mode Edge Types
- **PV (Practice → Vocabulary)**: Practice deploys or generates vocabulary
- **VP (Vocabulary → Practice)**: Vocabulary elaborates or informs practice
- **PP (Practice → Practice)**: Practice-to-practice presupposition
- **VV (Vocabulary → Vocabulary)**: Vocabulary-to-vocabulary entailment

Each MUD edge type has qualified variants for sufficiency and necessity:
- **`-suff`** (e.g., `PV-suff`): Sufficient condition — the practice/vocabulary is enough on its own
- **`-nec`** (e.g., `PV-nec`): Necessary condition — the practice/vocabulary is required but may not suffice alone

#### TOTE Mode Edge Types
- **Sequence**: Test triggers Operate action
- **Feedback**: Operate returns to Test
- **Loop**: Iterative self-edge on an Operate or Test
- **Entry**: Transition into the cycle (renders without arrowhead)
- **Exit**: Successful completion path
- **Test-Pass**: Congruent branch out of a Test
- **Test-Fail**: Incongruent branch from a Test to an Operate

#### Generic Mode
- **Unmarked**: General-purpose connections
- **Custom**: User-defined relationships

### Creating Edges
1. **Automatic Detection** (MUD mode): Edge type inferred from node types
2. **Manual Selection**: Choose edge type from selector when automatic detection is disabled
3. **Unmarked Edges**: Enable "Unmarked edges" option to create unlabeled connections

### Edge Properties
- **Label**: Custom text label
- **Order Number**: Numeric prefix (e.g., "1: PV")
- **Label Position**: Start, middle, or end of edge
- **Label Offset**: Fine-tune label placement
- **Resultant**: Mark as derived/indirect relationship (dashed line)

## Nested Nodes and Grouping

### Creating Groups
1. Select multiple nodes by clicking with the Select tool
2. Click the **Group** button in the header
3. Selected nodes become children of a new container node
4. The container appears as a dashed rectangle around its children

### Working with Groups
- **Move Container**: Drag the container to move all children together
- **Edit Children**: Select and edit individual nodes within the container
- **Ungroup**: Select a container and click **Ungroup** to dissolve it

### Nesting Limits
- Maximum nesting depth is 2 levels
- Child positions are stored relative to their parent
- Edges connecting nested nodes are preserved

### Export Support
- **SVG**: Containers render as dashed rectangles with labels
- **LaTeX**: Containers export as dashed TikZ rectangles with labels above

## Customizing Your Diagram

### Properties Sidebar
Click a node or edge to view and edit in the sidebar:
- **Label**: Edit the display text
- **Position**: View coordinates (nodes)
- **Connection**: View source and target (edges)
- **Customize**: Open full customization panel

### Node Customization Panel
Double-click any node to open the full panel:
- **Label**: Primary text
- **Secondary Label**: Additional line within node
- **Subscript**: Italic text below node
- **Size**: Small, medium, or large
- **Shape**: Alternative shapes
- **Colors**: Background, border, and text colors

### Edge Modification Panel
Double-click any edge to open the panel:
- **Type**: Change edge type
- **Label**: Custom text
- **Order Number**: Prefix number
- **Position**: Label placement (start/middle/end)
- **Offset**: Fine-tune X/Y offset
- **Background**: Toggle white background behind label
- **Resultant**: Toggle dashed line style

### Grid and Alignment
- **Show Grid**: Toggle visual grid overlay (`G`)
- **Snap to Grid**: Enable automatic alignment to grid points
- **Grid Spacing**: Adjust spacing (10-200 pixels)

## Exporting Your Work

### Export Formats

#### JSON Export
- **Purpose**: Save and reload diagrams
- **Usage**: Backup, sharing, version control
- **Features**: Preserves all data including nested nodes

#### SVG Export
- **Purpose**: Vector graphics for presentations
- **Usage**: Slides, web pages, scalable graphics
- **Features**: Containers render as dashed rectangles

#### LaTeX/TikZ Export
- **Purpose**: Academic papers and publications
- **Usage**: Integration with LaTeX documents
- **Features**:
  - Fixed-width nodes: each node style has a `text width` constraint (e.g., vocabulary 2.2cm, practice 2.4cm) so all nodes of the same type render at uniform size
  - Automatic text wrapping within fixed-width nodes
  - `% WARNING: label may overflow` comments appear above nodes whose labels exceed the available space — shorten the label or split into primary + secondary labels
  - Containers as dashed rectangles with labels (using TikZ `fit` library)
  - Proper coordinate normalization
  - Diagram type inference (MUD/TOTE/HYBRID)

### Import
- Click **Import** to load a previously exported JSON file
- The current diagram will be replaced

## Keyboard Shortcuts

Press `?` at any time to view the keyboard shortcuts modal.

### Tool Selection
| Key | Tool |
|-----|------|
| `S` | Select |
| `V` | Vocabulary node |
| `P` | Practice node |
| `T` | Test node |
| `O` | Operate node |
| `E` | Edge |
| `C` | Custom node |
| `N` | Entry point (TOTE) |
| `X` | Exit point (TOTE) |

### Actions
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+Shift+Z` | Redo |
| `G` | Toggle grid |
| `Delete` | Remove selection |
| `Esc` | Deselect / cancel |
| `?` | Toggle keyboard help |

### Canvas Navigation
- **Mouse Wheel**: Zoom in/out
- **Click + Drag** (on background): Pan the canvas

### Desktop App Menus
The Electron app adds menu items (with accelerators) on top of the in-app shortcuts:

| Menu | Item | Shortcut |
|------|------|----------|
| Edit | Select All | `Ctrl+A` |
| View | Zoom In / Zoom Out | `Ctrl+Plus` / `Ctrl+-` |
| View | Reset Zoom | `Ctrl+0` |
| View | Center Diagram | `Ctrl+Shift+C` |
| Tools | Validate Diagram | `Ctrl+Shift+V` |

**Tools → Validate Diagram** runs the same Brandom/Miller-aware validation engine as the CLI's `check` verb and shows any warnings or suggestions in a dialog.

## Command-Line Interface (CLI)

The Pragma Graph Tool includes a CLI for programmatic diagram creation and manipulation. It is designed for two primary use cases:

1. **LLM-assisted diagramming**: Ask an AI assistant to build diagrams using structured commands
2. **Scripted pipelines**: Automate diagram generation in build scripts or CI workflows

The CLI operates in two modes:
- **Connected mode**: When the Electron desktop app is running, the CLI auto-detects it and dispatches commands directly to the GUI. Changes appear on the canvas in real time.
- **Headless mode**: Without the GUI (or with `--headless`), the CLI runs a standalone Redux store in-process and uses `--file` for persistence.

### Setup

**Windows (installed app)**: the desktop installer bundles the CLI and registers `pragma-cli` on your user PATH — open a new terminal and run `pragma-cli --help`. No Node.js toolchain required.

**From source** (any platform):
```bash
# From the project root
npm run build:core   # Build the shared core library
npm run build:cli    # Build the CLI

# Verify installation
node cli/dist/index.js --help
```

### Quick Start

Create a simple MUD diagram entirely from the command line:

```bash
CLI="node cli/dist/index.js --json --file my-diagram.json"

# Create a new diagram
$CLI diagram create --name "BSD Figure 2" --type MUD

# Add vocabulary and practice nodes
$CLI node add --type vocabulary --label "Observational vocabulary" --x 0 --y 0
$CLI node add --type practice --label "Reliable reporting" --x 300 --y 0

# List nodes to get their IDs
$CLI node list

# Add an edge (replace IDs from node list output)
$CLI edge add --source <V1_ID> --target <P1_ID> --type VP --label "deploys"

# Export to LaTeX for your paper
$CLI export latex --raw > figure2.tex
```

### Global Options

| Flag | Description |
|------|-------------|
| `--json` | Force JSON output (default when stdout is piped) |
| `--human` | Force human-readable output (default in a terminal) |
| `--file <path>` | Auto-load diagram before command, auto-save after mutations (mirrors the canvas in connected mode) |
| `--headless` | Force headless mode (skip GUI auto-connection) |
| `--require-gui` | Exit 1 with `GUI_UNAVAILABLE` instead of falling back to headless |
| `--force` | Overwrite `--file` even if another process changed it since load |

In headless mode the CLI detects when the `--file` was modified by another process between load and save (content-hash comparison) and refuses the write with `FILE_CONFLICT` — re-run against the current file or pass `--force`. Rewriting identical content never counts as a conflict.

### Commands

#### Diagram Lifecycle

| Command | Description |
|---------|-------------|
| `diagram create --name <name> --type <MUD\|TOTE\|HYBRID\|GENERIC>` | Create a new diagram (refuses to overwrite an existing `--file` without `--force`) |
| `diagram info` | Show current diagram summary |
| `diagram load <file>` | Load a diagram from JSON |
| `diagram save [file]` | Save current diagram to file |
| `diagram clear` | Reset to empty diagram |

#### Node Operations

| Command | Description |
|---------|-------------|
| `node add --type <type> --label <text> --x <n> --y <n>` | Add a node |
| `node list` | List all nodes |
| `node get <id>` | Get a single node by ID |
| `node update <id> --label <text>` | Update node properties |
| `node move <id> --x <n> --y <n>` | Reposition a node |
| `node delete <id>` | Delete a node and its descendants |
| `node group --ids <id1,id2,...> --label <text>` | Group nodes into a container |
| `node ungroup <id>` | Dissolve a container |

Available node types: `vocabulary`, `practice`, `test`, `operate`, `exit`, `custom`

Optional node flags: `--subtype`, `--subscript`, `--secondary-label`, `--parent <parentId>`

#### Edge Operations

| Command | Description |
|---------|-------------|
| `edge add --source <id> --target <id> --type <type>` | Add an edge |
| `edge list` | List all edges |
| `edge get <id>` | Get a single edge by ID |
| `edge update <id> --label <text>` | Update edge properties |
| `edge delete <id>` | Delete an edge |

Edge types depend on diagram mode:
- **MUD**: `PV`, `VP`, `PP`, `VV` (and qualified variants with `-suff`/`-nec`)
- **TOTE**: `sequence`, `feedback`, `loop`, `exit`, `entry`, `test-pass`, `test-fail`
- **All modes**: `resultant`, `unmarked`, `custom`

Optional edge flags: `--label`, `--resultant`, `--order <number>`

#### Entry/Exit Points (TOTE)

| Command | Description |
|---------|-------------|
| `entry add --node <id> [--x <n> --y <n> --label <text>]` | Add an entry point |
| `entry list` | List all entry points |
| `entry delete <id>` | Delete an entry point |
| `exit add --node <id> [--x <n> --y <n> --label <text>]` | Add an exit point |
| `exit list` | List all exit points |
| `exit delete <id>` | Delete an exit point |

#### Export

| Command | Description |
|---------|-------------|
| `export json [--raw]` | Export as JSON |
| `export svg [--raw]` | Export as SVG |
| `export latex [--raw]` | Export as LaTeX/TikZ standalone document |

The `--raw` flag outputs the content directly without a JSON envelope, suitable for piping to a file.

#### History

| Command | Description |
|---------|-------------|
| `history undo` | Undo the last mutation |
| `history redo` | Redo the last undone mutation |
| `history save` | Create a manual history snapshot |

All mutating commands (`node add`, `edge add`, `node delete`, etc.) automatically create history snapshots before applying changes.

#### Schema Discovery

| Command | Description |
|---------|-------------|
| `schema all` | Full type schema (node types, edge types + per-type semantics, diagram modes, composition rules, common fields) |
| `schema node-types` | Available node types with shapes, subtypes, glosses, and BSD/Miller references |
| `schema edge-types [--details]` | Edge types grouped by mode; `--details` returns per-type gloss, qualifier, canonical endpoints, and examples |
| `schema modes` | Diagram modes with available tool palettes |
| `schema composition-rules` | The Brandom-canonical patterns the `derive` verb recognises |
| `schema json-schema` | Formal JSON Schema (draft 2020-12) for diagram files, printed raw for piping |

Schema commands are designed for LLM self-reference: an AI agent can call `schema all` to learn what commands and values are valid without consulting external documentation. To validate a diagram file externally: `pragma-cli schema json-schema > diagram.schema.json`, then use any JSON Schema validator (ajv, etc.).

#### Brandom-Aware Analysis

| Command | Description |
|---------|-------------|
| `check [--severity warning\|suggestion\|all]` | Permissive validation against MUD/TOTE conventions (edge-endpoint mismatches, dangling references, convention hints). Reports issues; never blocks or mutates |
| `derive [--pragmatic-metavocab] [--lx]` | Detect canonical Brandom patterns: pragmatic metavocabulary (BSD Fig 4.1: `V_A -VP-suff-> P -PV-suff-> V_B`) and elaborated-explicating LX relations (BSD Figs 4.2/4.4) |
| `derive --apply` | Add the detected resultant MURs to the diagram as dashed `VV` edges — applied as one atomic batch, undoable with `history undo` |
| `explain [--style narrative\|structured] [--lang en\|es]` | Prose reading of the diagram's meaning-use structure; `--style structured` returns machine-readable analysis, `--lang es` uses the thesis' Spanish terminology |

Example — build BSD Figure 4.1 and derive its resultant:
```bash
CLI="pragma-cli --file fig41.json"
$CLI diagram create --name "Fig 4.1" --type MUD
VN=$($CLI node add --type vocabulary --subtype normative --label "V norm" --x 100 --y 100 | jq -r .result.id)
VM=$($CLI node add --type vocabulary --subtype modal --label "V modal" --x 500 --y 100 | jq -r .result.id)
P=$($CLI node add --type practice --label "P inferential" --x 300 --y 300 | jq -r .result.id)
$CLI edge add --source $VN --target $P --type VP-suff --order 1
$CLI edge add --source $P --target $VM --type PV-suff --order 2
$CLI derive --apply          # adds the dashed VV resultant: "V norm is a pragmatic metavocabulary for V modal"
$CLI explain                 # narrative reading
```

### JSON Output Format

When output is in JSON mode (piped or `--json`), all commands return a structured envelope:

**Success:**
```json
{
  "ok": true,
  "command": "node.add",
  "result": {
    "id": "abc-123",
    "type": "vocabulary",
    "label": "V₁",
    "position": {"x": 100, "y": 200}
  }
}
```

**Error:**
```json
{
  "ok": false,
  "command": "node.add",
  "error": {
    "code": "INVALID_NODE_TYPE",
    "message": "Invalid node type: vocabulry",
    "validValues": ["vocabulary", "practice", "test", "operate", "exit", "custom"]
  }
}
```

The `validValues` field in error responses enables self-correcting behavior: an LLM can read the valid options and retry with the correct value.

### Using with an LLM

The CLI is designed to be called by an LLM (such as Claude) acting as an assistant. A typical workflow:

1. The user describes a diagram they want ("Create a MUD showing the relationship between observational vocabulary and reliable differential responsive dispositions")
2. The LLM calls `schema all` to understand available types
3. The LLM constructs a series of CLI commands to build the diagram
4. Each command returns structured JSON that the LLM parses to get node IDs for subsequent edge commands
5. The LLM calls `export latex` to produce the final output

The `--file` flag makes this stateless: each command invocation is independent, loading and saving the diagram file automatically.

### Connected Mode (GUI Bridge)

When the Electron desktop app is running, the CLI automatically connects to it. You can verify this with:

```bash
node cli/dist/index.js status
# Output: mode: "connected", gui: true
```

In connected mode:
- All commands (`node add`, `edge add`, `diagram create`, etc.) dispatch directly to the GUI's Redux store
- Changes appear on the canvas instantly — no need to import/export files
- With `--file`, the CLI **mirrors the GUI's state into the file after every mutation**, so the file always matches the canvas (the GUI remains the source of truth). If a mirror write fails, the command still succeeds but warns on stderr and adds `"persisted": false` to the envelope
- **Identity guard**: if `--file` contains a *different* diagram than the one open in the GUI, the command fails with `DIAGRAM_MISMATCH` before mutating anything — use `--headless` to edit the file directly, `diagram load` to open the file in the GUI first, or `--force` to operate on the GUI diagram and overwrite the file
- History commands (`undo`/`redo`) operate on the GUI's undo stack
- Every JSON envelope carries `"mode": "gui"`; use `--require-gui` to make the CLI exit 1 (`GUI_UNAVAILABLE`) rather than silently falling back to headless when no GUI answers

To force headless mode even when the GUI is running, use:
```bash
node cli/dist/index.js --headless --file diagram.json node add --type vocabulary --label "V₁" --x 0 --y 0
```

#### How It Works

1. When the Electron app starts, it launches an HTTP server on `127.0.0.1` (random port) and writes connection details to `~/.pragma-graph-tool/server.json`
2. The CLI reads this file before each command and verifies liveness with an **authenticated HTTP probe** of `/api/v1/status` (not a PID check, which cannot see across OS boundaries)
3. Authentication uses a per-session Bearer token generated at startup
4. When the Electron app quits, the connection file is automatically deleted

#### WSL ↔ Windows

If the GUI runs on Windows and the CLI inside WSL, discovery additionally scans `/mnt/c/Users/*/.pragma-graph-tool/server.json` and probes `127.0.0.1` (works with WSL2 mirrored networking — `networkingMode=mirrored` in `%UserProfile%\.wslconfig`), falling back to the Windows host IP from `/etc/resolv.conf` under NAT mode. If a session file is found but nothing answers, the CLI prints a one-line stderr hint and runs headless.

Environment overrides: `PRAGMA_GUI_URL` + `PRAGMA_GUI_TOKEN` (explicit endpoint, skips discovery; setting the URL without the token is a hard error, not a fallback), `PRAGMA_GUI_TIMEOUT_MS` (request timeout, default 5 s), `PRAGMA_GUI_PROBE_TIMEOUT_MS` (discovery probe timeout, default 2 s), and `PRAGMA_BRIDGE_BIND` set before launching the GUI to bind the bridge beyond loopback (not recommended — the token travels as plaintext HTTP; a specific interface IP is recorded in `server.json` so discovery still works).

## Academic Context

### Philosophical Background
This tool implements concepts from Robert Brandom's inferential pragmatics and meaning-use relations, combined with TOTE (Test-Operate-Test-Exit) cycle analysis from cognitive science.

### Node Semantics
- **Vocabulary nodes**: Linguistic or conceptual vocabularies that can be deployed or elaborated
- **Practice nodes**: Abilities, skills, or behavioral patterns that presuppose or deploy vocabularies
- **Test nodes**: Decision points in feedback cycles
- **Operate nodes**: Actions taken in response to test outcomes

### Edge Semantics
- **PV**: A practice deploys a vocabulary (practical competence generates linguistic capacity)
- **VP**: A vocabulary elaborates a practice (linguistic capacity explicates practical competence)
- **PP**: One practice presupposes another
- **VV**: One vocabulary entails another

### Citation Information
When using this tool in academic work:
- **Tool**: Pragma Graph Tool
- **Author**: Mauro Santelli (Universidad de Buenos Aires - SADAF/CONICET - GEML)
- **Contact**: mesantelli@uba.ar

### Best Practices
- Use grid alignment for publication-quality diagrams
- Maintain consistent styling within and across diagrams
- Export to JSON before making significant changes
- Use LaTeX export for papers; SVG for presentations
- Keep node labels concise for clean TikZ export (~20 characters for vocabulary/practice, ~14 for test/exit nodes); use secondary labels or subscripts for additional text
- Watch for the ⚠ overflow indicator — it signals that a label will not fit within the TikZ node's fixed width

---

*This tool is designed for academic and research use. It implements specialized philosophical concepts and should be used with appropriate theoretical understanding.*
