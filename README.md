# Pragma Graph Tool

Research-oriented editor for Meaning-Use Diagrams (MUD) and Test-Operate-Test-Exit (TOTE) cycles based on Robert Brandom's inferential pragmatics. Built with Redux/D3 architecture, modular UI panels, and publication-grade exports.

## Capabilities

### GUI Editor
- MUD, TOTE, HYBRID, and GENERIC workspaces with mode-specific node palettes
- Qualified and unqualified edge types with auto-detection or manual selection
- Nested nodes: group nodes into containers for hierarchical diagrams
- Entry/exit anchors for TOTE cycles plus optional unmarked connectors
- Node and edge inspectors for labels, subscripts, colors, and resultant status
- Properties sidebar for quick editing of selected elements
- Collapsible legend showing node/edge types for current mode
- Undo/redo stack, grid overlay, and snap-to-grid positioning
- Exports to JSON, SVG, and LaTeX/TikZ with container support

### CLI (new in v1.2)
- Headless command-line interface for programmatic diagram creation and manipulation
- **GUI Bridge**: auto-connects to the running Electron app — CLI commands update the canvas in real time
- Designed for LLM integration: structured JSON output, schema discovery, error envelopes with valid-value hints
- Full diagram lifecycle: create, load, save, node/edge CRUD, entry/exit points, grouping
- All three export formats (JSON, SVG, LaTeX/TikZ) available from the terminal
- Undo/redo support with history snapshots
- Auto-load/save with `--file` flag for stateless scripting workflows

## Getting Started

### GUI (web/desktop)
```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # Production bundle
npm run lint     # ESLint
npx tsc --noEmit # Type check
```
Desktop builds remain under `dist-electron/` and are not covered by this README.

### CLI
```bash
# Build the shared core and CLI
npm run build:core
npm run build:cli

# Run any CLI command
node cli/dist/index.js --help

# Example: create a diagram, add nodes, and export to LaTeX
node cli/dist/index.js --file my-diagram.json diagram create --name "BSD ch.2" --type MUD
node cli/dist/index.js --file my-diagram.json node add --type vocabulary --label "V₁" --x 0 --y 0
node cli/dist/index.js --file my-diagram.json node add --type practice --label "P₁" --x 200 --y 0
node cli/dist/index.js --file my-diagram.json edge add --source <V1_ID> --target <P1_ID> --type VP
node cli/dist/index.js --file my-diagram.json export latex --raw > output.tex
```

See the [CLI Reference](#cli-reference) section below for the full command tree.

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

## CLI Reference

### Command Tree
```
pragma-cli [global options] <command> <subcommand> [options]

Global options:
  --json          Force JSON envelope output (default when piped)
  --human         Force human-readable output (default in TTY)
  --file <path>   Auto-load/save diagram between invocations
  --headless      Force headless mode (no GUI connection)

Commands:
  status                              Show connection and diagram summary
  diagram  create|info|load|clear|save  Diagram lifecycle
  node     add|list|get|update|move|delete|group|ungroup  Node CRUD
  edge     add|list|get|update|delete   Edge CRUD
  entry    add|list|delete              TOTE entry points
  exit     add|list|delete              TOTE exit points
  export   json|svg|latex               Export to file/stdout
  history  undo|redo|save               Undo/redo with snapshots
  schema   all|node-types|edge-types|modes  Type schema discovery
```

### Output Format
All commands produce a JSON envelope when piped or when `--json` is passed:
```json
{"ok": true,  "command": "node.add", "result": {"id": "...", "type": "vocabulary", ...}}
{"ok": false, "command": "node.add", "error": {"code": "INVALID_NODE_TYPE", "message": "...", "validValues": [...]}}
```

The `validValues` field in error responses makes the CLI self-correcting for LLMs: an agent can read the valid options and retry without consulting documentation.

### Schema Discovery
`pragma-cli schema all` outputs the complete type system (node types with shapes/subtypes, edge types grouped by mode, diagram modes with available tools). This enables an LLM to construct valid commands without external documentation.

### Connected Mode (GUI Bridge)
When the Electron desktop app is running, the CLI automatically detects it and sends commands via HTTP to the GUI's Redux store. Changes appear on the canvas instantly.

```bash
# With Electron running, the CLI auto-connects:
pragma-cli status                          # → mode: "connected", gui: true
pragma-cli node add --type vocabulary --label "V₁" --x 200 --y 100   # appears on canvas

# Force headless mode even when GUI is running:
pragma-cli --headless status               # → mode: "headless", gui: false
```

The connection is secured with a per-session Bearer token and only listens on `127.0.0.1`.

### Headless Workflow
Without the GUI, the CLI operates in headless mode (standalone Redux store in-process). The `--file` flag creates a stateless pipeline: each invocation loads the file, applies the command, and saves the result.

```bash
# Full workflow without the GUI
pragma-cli --file diagram.json diagram create --name "My MUD" --type MUD
pragma-cli --file diagram.json node add --type vocabulary --label "Observational" --x 0 --y 0
pragma-cli --file diagram.json node add --type practice --label "Reporting" --x 250 --y 0
pragma-cli --file diagram.json edge add --source $V1 --target $P1 --type VP --label "deploys"
pragma-cli --file diagram.json export latex --raw > diagram.tex
```

## Architecture Notes
- State: Redux Toolkit (`diagramSlice`, `uiSlice`) with history tracking and modal flags
- Canvas: React + D3 for zoom/pan, snapping, entry/exit markers, and edge routing
- Modal system: reusable wrapper powering edge type selector, node customiser, edge editor
- Utilities: `utils/` holds grid snapping, export pipelines, and type helpers
- **Monorepo**: npm workspaces with `packages/core/` (shared types, store, pure utils) and `cli/` (Node.js CLI)

### Package Structure
```
pragma-graph-tool/
  src/                  # GUI (React + Vite) — exposes window.__pragma_cli__ bridge
  electron/             # Electron main process — HTTP server for CLI bridge
  packages/core/        # Shared pure TypeScript: types, Redux slices, utils, export generators
  cli/                  # CLI (commander + @pragma-graph/core) — auto-connects to GUI or runs headless
```

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
