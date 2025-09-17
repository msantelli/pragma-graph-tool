# Pragma Graph Tool - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Creating Your First Diagram](#creating-your-first-diagram)
4. [Understanding Node Types](#understanding-node-types)
5. [Working with Edges](#working-with-edges)
6. [Customizing Your Diagram](#customizing-your-diagram)
7. [Exporting Your Work](#exporting-your-work)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Academic Context](#academic-context)

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
- **Tool Palette**: Select tools for creating different node types
- **Action Buttons**: Undo, Redo, Import, and Export functions

### Main Canvas
- **Interactive Drawing Area**: Click to create nodes, drag to move them
- **Zoom & Pan**: Use mouse wheel to zoom, drag to pan the view
- **Selection Feedback**: Selected items are highlighted in blue

### Popup Panels
- **Node Customization**: Appears when double-clicking nodes
- **Edge Type Selector**: Appears when creating edges between incompatible node types

## Creating Your First Diagram

### Step 1: Choose Your Mode
1. Look at the mode selector in the header
2. Choose the appropriate mode for your diagram:
   - **MUD**: For meaning-use relationships
   - **TOTE**: For feedback cycle analysis
   - **HYBRID**: For combined MUD/TOTE diagrams
   - **GENERIC**: For general-purpose diagrams

### Step 2: Add Nodes
1. Select a node type from the tool palette
2. Click anywhere on the canvas to create a node
3. The node will appear at the clicked location
4. Repeat to add more nodes

### Step 3: Connect Nodes
1. Select the "Edge" tool from the palette
2. Click on the first node (source)
3. Click on the second node (target)
4. If automatic edge detection is off, you'll see an edge type selector
5. Choose the appropriate edge type and confirm

### Step 4: Customize and Export
1. Double-click nodes to customize their appearance
2. Use the grid controls for precise alignment
3. Export your diagram using the export buttons

## Understanding Node Types

### MUD (Meaning-Use Diagram) Nodes

#### Vocabulary Nodes (Oval)
- **Purpose**: Represent linguistic or conceptual vocabularies
- **Visual**: Oval/elliptical shape
- **Usage**: Core concepts, linguistic systems, semantic domains
- **Example**: "Color terminology", "Modal logic vocabulary"

#### Practice Nodes (Rounded Rectangle)
- **Purpose**: Represent abilities, skills, or behavioral patterns
- **Visual**: Rounded rectangle shape
- **Usage**: Actions, capabilities, behavioral responses
- **Example**: "Color discrimination ability", "Logical reasoning practice"

### TOTE (Test-Operate-Test-Exit) Nodes

#### Test Nodes (Diamond)
- **Purpose**: Represent condition checking or decision points
- **Visual**: Diamond shape
- **Usage**: Evaluation criteria, decision gates, condition checks
- **Example**: "Is goal achieved?", "Does output match criteria?"

#### Operate Nodes (Rectangle)
- **Purpose**: Represent actions or operations to be performed
- **Visual**: Rectangle shape  
- **Usage**: Actions, processes, transformations
- **Example**: "Adjust parameters", "Apply correction", "Execute procedure"

## Working with Edges

### Edge Types by Mode

#### MUD Mode Edge Types
- **PV (Practice → Vocabulary)**: Practice enables or generates vocabulary
- **VP (Vocabulary → Practice)**: Vocabulary guides or informs practice
- **PP (Practice → Practice)**: Practice-to-practice relationships
- **VV (Vocabulary → Vocabulary)**: Vocabulary-to-vocabulary relationships

#### TOTE Mode Edge Types
- **Test → Operate**: Condition triggers action
- **Operate → Test**: Action leads to re-evaluation
- **Exit**: Successful completion path

#### Generic Mode
- **Unmarked**: General-purpose connections
- **Resultant**: Derived or secondary relationships

### Creating Edges
1. **Automatic Detection** (MUD mode): Tool automatically suggests edge type based on node types
2. **Manual Selection**: Choose edge type from selector when automatic detection is disabled
3. **Visual Feedback**: Edges are color-coded by type for easy identification

## Customizing Your Diagram

### Node Customization
Double-click any node to open the customization panel:
- **Caption**: Edit the text label
- **Size**: Choose from small, medium, or large
- **Shape**: Select alternative shapes if desired
- **Colors**: Customize background, border, and text colors
- **Actions**: Reset to defaults or delete the node

### Grid and Alignment
- **Show Grid**: Toggle visual grid overlay
- **Snap to Grid**: Enable automatic alignment to grid points  
- **Grid Spacing**: Adjust the grid spacing (10-200 pixels)
- **Precise Positioning**: Use grid for academic-quality layouts

### Visual Styling
- **Node Colors**: Each node type has default colors that can be customized
- **Edge Colors**: Automatically assigned based on edge type
- **Consistent Styling**: Use the same colors for similar concepts across diagrams

## Exporting Your Work

### Export Formats

#### JSON Export
- **Purpose**: Save and reload diagrams
- **Usage**: Backup, sharing, version control
- **Features**: Preserves all styling and metadata

#### SVG Export  
- **Purpose**: Vector graphics for presentations
- **Usage**: Slides, web pages, scalable graphics
- **Features**: Crisp rendering at any size

#### LaTeX/TikZ Export
- **Purpose**: Academic papers and publications
- **Usage**: Integration with LaTeX documents
- **Features**: Professional typography, customizable styling

### Export Tips
- **Before Exporting**: Ensure all nodes are properly labeled and positioned
- **JSON for Backup**: Always export JSON before major changes
- **SVG for Presentations**: Use SVG for slides and web content
- **LaTeX for Papers**: Use LaTeX export for academic publications

## Keyboard Shortcuts

### Basic Navigation
- **Mouse Wheel**: Zoom in/out
- **Click + Drag**: Pan the canvas
- **Delete/Backspace**: Remove selected items

### Planned Shortcuts (Future Versions)
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo  
- **Ctrl+S**: Export JSON
- **Arrow Keys**: Fine-tune node positions

## Academic Context

### Philosophical Background
This tool implements concepts from Robert Brandom's inferential pragmatics and meaning-use relations, combined with TOTE (Test-Operate-Test-Exit) cycle analysis from cognitive science.

### Research Applications
- **Conceptual Analysis**: Map relationships between concepts and practices
- **Pragmatic Semantics**: Visualize meaning-use relations
- **Cognitive Modeling**: Model feedback-driven processes
- **Educational Tools**: Teach philosophical concepts visually

### Citation Information
When using this tool in academic work, please cite:
- **Tool**: Pragma Graph Tool v1.1
- **Author**: Mauro Santelli (Universidad de Buenos Aires - SADAF/CONICET)
- **URL**: [Deployment URL]
- **Year**: 2024

### Academic Standards
- **Precision**: Use grid alignment for publication-quality diagrams
- **Consistency**: Maintain consistent styling within and across diagrams
- **Documentation**: Include legends and explanations with exported diagrams
- **Validation**: Verify philosophical accuracy of relationships before publication

## Support and Feedback

### Getting Help
- **User Interface**: Tooltips and context help built into the interface
- **Documentation**: This guide and the technical documentation
- **Academic Context**: Consult Brandom's philosophical works for theoretical background

### Reporting Issues
- **Technical Problems**: Report bugs through the project repository
- **Feature Requests**: Suggest improvements for future versions
- **Academic Questions**: Contact the author for philosophical clarifications

### Best Practices
- **Start Simple**: Begin with basic diagrams before attempting complex ones
- **Save Frequently**: Export JSON backups regularly
- **Test Exports**: Verify exported diagrams meet your publication requirements
- **Collaborate**: Share JSON files for collaborative diagram development

---

*This tool is designed for academic and research use. It implements specialized philosophical concepts and should be used with appropriate theoretical understanding.*