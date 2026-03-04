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
- **Desktop Version**: Available as downloadable executables for Windows, Mac, and Linux

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
- **Visual**: Elliptical shape, blue coloring
- **Shortcut**: `V`
- **Example**: "Color terminology", "Modal logic vocabulary"

#### Practice Nodes (Rounded Rectangle)
- **Purpose**: Represent abilities, skills, or behavioral patterns
- **Visual**: Rounded rectangle shape, orange coloring
- **Shortcut**: `P`
- **Example**: "Color discrimination ability", "Logical reasoning practice"

### TOTE (Test-Operate-Test-Exit) Nodes

#### Test Nodes (Diamond)
- **Purpose**: Represent condition checking or decision points
- **Visual**: Diamond shape, green coloring
- **Shortcut**: `T`
- **Example**: "Is goal achieved?", "Does output match criteria?"

#### Operate Nodes (Rectangle)
- **Purpose**: Represent actions or operations to be performed
- **Visual**: Rectangle shape, yellow coloring
- **Shortcut**: `O`
- **Example**: "Adjust parameters", "Apply correction"

### Generic Nodes
- **Custom Nodes**: Circle shape for general-purpose use
- **Shortcut**: `C`

## Working with Edges

### Edge Types by Mode

#### MUD Mode Edge Types
- **PV (Practice → Vocabulary)**: Practice deploys or generates vocabulary (green)
- **VP (Vocabulary → Practice)**: Vocabulary elaborates or informs practice (orange)
- **PP (Practice → Practice)**: Practice-to-practice presupposition (purple)
- **VV (Vocabulary → Vocabulary)**: Vocabulary-to-vocabulary entailment (red)

#### TOTE Mode Edge Types
- **Sequence**: Test triggers Operate action (blue)
- **Feedback**: Operate returns to Test (orange)
- **Exit**: Successful completion path (green)

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
  - Containers as dashed rectangles with labels
  - Proper coordinate normalization
  - Commented legend template
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

## Command-Line Interface (CLI)

The Pragma Graph Tool includes a CLI for programmatic diagram creation and manipulation. It is designed for two primary use cases:

1. **LLM-assisted diagramming**: Ask an AI assistant to build diagrams using structured commands
2. **Scripted pipelines**: Automate diagram generation in build scripts or CI workflows

The CLI operates in two modes:
- **Connected mode**: When the Electron desktop app is running, the CLI auto-detects it and dispatches commands directly to the GUI. Changes appear on the canvas in real time.
- **Headless mode**: Without the GUI (or with `--headless`), the CLI runs a standalone Redux store in-process and uses `--file` for persistence.

### Setup

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
| `--file <path>` | Auto-load diagram before command, auto-save after mutations |
| `--headless` | Force headless mode (skip GUI auto-connection) |

### Commands

#### Diagram Lifecycle

| Command | Description |
|---------|-------------|
| `diagram create --name <name> --type <MUD\|TOTE\|HYBRID\|GENERIC>` | Create a new diagram |
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
| `schema all` | Full type schema (node types, edge types, diagram modes) |
| `schema node-types` | Available node types with shapes, subtypes, and descriptions |
| `schema edge-types` | Available edge types grouped by mode |
| `schema modes` | Diagram modes with available tool palettes |

Schema commands are designed for LLM self-reference: an AI agent can call `schema all` to learn what commands and values are valid without consulting external documentation.

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
- The `--file` flag still works for saving backups, but auto-save is skipped (the GUI is the source of truth)
- History commands (`undo`/`redo`) operate on the GUI's undo stack

To force headless mode even when the GUI is running, use:
```bash
node cli/dist/index.js --headless --file diagram.json node add --type vocabulary --label "V₁" --x 0 --y 0
```

#### How It Works

1. When the Electron app starts, it launches an HTTP server on `127.0.0.1` (random port) and writes connection details to `~/.pragma-graph-tool/server.json`
2. The CLI reads this file before each command, verifies the GUI process is alive, and sends requests over HTTP
3. Authentication uses a per-session Bearer token generated at startup
4. When the Electron app quits, the connection file is automatically deleted

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

---

*This tool is designed for academic and research use. It implements specialized philosophical concepts and should be used with appropriate theoretical understanding.*
