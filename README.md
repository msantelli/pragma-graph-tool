# Pragma Graph Tool

Research-oriented editor for Meaning-Use Diagrams (MUD) and Test-Operate-Test-Exit (TOTE) cycles based on Robert Brandom's inferential pragmatics. Built with Redux/D3 architecture, modular UI panels, and publication-grade exports.

## Capabilities
- MUD, TOTE, HYBRID, and GENERIC workspaces with mode-specific node palettes
- Qualified and unqualified edge types with auto-detection or manual selection
- Nested nodes: group nodes into containers for hierarchical diagrams
- Entry/exit anchors for TOTE cycles plus optional unmarked connectors
- Node and edge inspectors for labels, subscripts, colors, and resultant status
- Properties sidebar for quick editing of selected elements
- Collapsible legend showing node/edge types for current mode
- Undo/redo stack, grid overlay, and snap-to-grid positioning
- Exports to JSON, SVG, and LaTeX/TikZ with container support

## Getting Started
```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # Production bundle
npm run lint     # ESLint
npx tsc --noEmit # Type check
```
Desktop builds remain under `dist-electron/` and are not covered by this README.

## Using the Editor
1. Select MUD, TOTE, HYBRID, or GENERIC in the header to configure available tools.
2. Choose a tool and click on the canvas to add nodes.
3. Use the edge tool to connect nodes; edge types are inferred or manually selected.
4. Select multiple nodes and click Group to create nested containers.
5. Toggle grid and snapping controls for precise positioning.
6. Use the Properties sidebar (right) to edit selected nodes or edges.
7. Export from the header: JSON for round-trips, SVG for slides, LaTeX/TikZ for papers.

## Keyboard Shortcuts
Press `?` to view all shortcuts. Key bindings:
- `S` Select tool
- `V` Vocabulary node (MUD)
- `P` Practice node (MUD)
- `T` Test node (TOTE)
- `O` Operate node (TOTE)
- `E` Edge tool
- `G` Toggle grid
- `Ctrl+Z` Undo
- `Ctrl+Y` Redo
- `Delete` Remove selection
- `Esc` Deselect / cancel

## Architecture Notes
- State: Redux Toolkit (`diagramSlice`, `uiSlice`) with history tracking and modal flags
- Canvas: React + D3 for zoom/pan, snapping, entry/exit markers, and edge routing
- Modal system: reusable wrapper powering edge type selector, node customiser, edge editor
- Utilities: `utils/` holds grid snapping, export pipelines, and type helpers

Contributor assumptions: familiarity with Brandom’s inferential pragmatics and TOTE literature. No end-user onboarding text is provided in the app; the audience is expected to know the theoretical distinctions encoded by the tooling.

## Deployment

### Web Deployment (Netlify)
The project is optimized for deployment on Netlify or similar static hosting services:

```bash
# Build for production
npm run build

# Deploy to Netlify (manual)
# 1. Connect your repository to Netlify
# 2. Set build command: npm run build
# 3. Set publish directory: dist
# 4. Deploy automatically on push to main branch
```

The included `netlify.toml` configures:
- Automatic builds from the repository
- Single Page Application routing
- PWA support with proper headers
- Optimal caching for static assets

### Desktop Distribution
Desktop builds are available for multiple platforms:

```bash
# Build desktop app for current platform
npm run build:electron

# Platform-specific builds
npm run build:win    # Windows
npm run build:mac    # macOS  
npm run build:linux  # Linux
```

### PWA Features
- **Offline Support**: Works without internet after first load
- **App-like Experience**: Can be installed on mobile and desktop
- **Automatic Updates**: Updates seamlessly when online

## User Documentation
See [USER_GUIDE.md](./USER_GUIDE.md) for comprehensive usage instructions.

## Authorship & Contact
- Author: Mauro Santelli (UBA - SADAF/CONICET - GEML)
- Email: mesantelli@uba.ar
- Tooling assistance: Claude Code and OpenAI Codex (GPT-5-codex)
