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
10. [Academic Context](#academic-context)

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
