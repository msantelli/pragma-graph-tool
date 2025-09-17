# Pragma Graph Tool

Research-oriented editor for Meaning-Use Diagrams (MUD) and Test-Operate-Test-Exit (TOTE) cycles. The current branch reintroduces the Redux/D3 architecture with modular UI panels, grid tooling, and publication-grade exports.

## Capabilities
- MUD, TOTE, and hybrid workspaces with mode-specific node palettes
- Qualified and unqualified edge types with auto-detection or manual selection
- Entry/exit anchors for TOTE cycles plus optional unmarked connectors
- Node and edge inspectors for size, color, resultant status, and labels
- Undo/redo stack, grid overlay, and optional snap-to-grid positioning
- Exports to JSON, SVG, and LaTeX/TikZ with metadata preservation (LaTeX output ships commented legend notes for unobtrusive inclusion)

## Getting Started
```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # Production bundle
npm run lint     # ESLint
npm run type-check
```
Desktop builds remain under `dist-electron/` and are not covered by this README.

## Using the Editor
1. Select MUD, TOTE, or HYBRID in the header to configure tools and edge semantics.
2. Choose a tool (select, node type, edge, entry, exit) and click on the canvas.
3. Toggle the grid and snapping controls when exact spacing is required.
4. Open the node or edge panels to adjust captions, colours, size, or resultant flags.
5. Export from the header: JSON for round-trips, SVG for slides, LaTeX/TikZ for papers.

Keyboard shortcuts: `Delete/Backspace` removes the current selection. Undo/redo map to the buttons in the header (native shortcuts are planned but not yet wired).

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
