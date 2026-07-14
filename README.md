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
- Uniform node sizing in TikZ export with fixed `text width` constraints per node type
- Overflow indicator (⚠) on canvas when labels exceed node bounds
- Qualified edge types (`PV-suff`, `PV-nec`, etc.) for sufficiency and necessity relations
- Exports to JSON, SVG, and LaTeX/TikZ with container support

### CLI (new in v1.2)
- Headless command-line interface for programmatic diagram creation and manipulation
- **GUI Bridge**: auto-connects to the running Electron app — CLI commands update the canvas in real time; works across the WSL ↔ Windows boundary
- Designed for LLM integration: structured JSON output with explicit `mode` reporting, schema discovery, a formal JSON Schema (`schema json-schema`), error envelopes with valid-value hints
- **Brandom-aware verbs**: `check` (validation against MUD/TOTE conventions), `derive` (detect and apply canonical resultant MURs — pragmatic metavocabulary, LX), `explain` (bilingual prose reading of the diagram)
- Full diagram lifecycle: create, load, save, node/edge CRUD, entry/exit points, grouping
- All three export formats (JSON, SVG, LaTeX/TikZ) available from the terminal
- Undo/redo support with history snapshots
- Auto-load/save with `--file` flag; in connected mode the file mirrors the canvas after every mutation; conflicting external writes are detected (content hash) and refused unless `--force`
- Bundled with the Windows installer: `pragma-cli` is registered on the user PATH, so installed users need no Node.js toolchain

## Getting Started

### GUI (web/desktop)
```bash
npm install
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # Production bundle
npm run build:check  # Type-check then build
npm run lint         # ESLint
npm test             # Vitest: unit tests + golden-file export-fidelity tests
```
Desktop builds land under `dist-electron/` (`npm run build:win|mac|linux`).

### CLI
On Windows, the desktop installer already registers `pragma-cli` on your PATH — skip the build steps and just run `pragma-cli --help` in a new terminal. From source:

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
  --require-gui   Exit 1 instead of falling back to headless
  --force         Overwrite --file even if it changed on disk since load

Commands:
  status                              Show connection and diagram summary
  diagram  create|info|load|clear|save  Diagram lifecycle
  node     add|list|get|update|move|delete|group|ungroup  Node CRUD
  edge     add|list|get|update|delete   Edge CRUD
  entry    add|list|delete              TOTE entry points
  exit     add|list|delete              TOTE exit points
  export   json|svg|latex               Export to file/stdout
  history  undo|redo|save               Undo/redo with snapshots
  schema   all|node-types|edge-types|modes|composition-rules|json-schema  Type schema discovery
  check    [--severity]                 Brandom/Miller-aware validation (never blocks)
  derive   [--lx] [--apply]             Detect/derive canonical resultant MURs
  explain  [--style] [--lang]           Prose explanation of the diagram
```

### Output Format
All commands produce a JSON envelope when piped or when `--json` is passed:
```json
{"ok": true,  "command": "node.add", "mode": "gui", "result": {"id": "...", "type": "vocabulary", ...}}
{"ok": false, "command": "node.add", "mode": "headless", "error": {"code": "INVALID_NODE_TYPE", "message": "...", "validValues": [...], "hint": "..."}}
```

Errors go to stderr with exit code 1; success to stdout with exit code 0. `mode` says whether the command ran against the live GUI or the in-process headless store.

The `validValues` field in error responses makes the CLI self-correcting for LLMs: an agent can read the valid options and retry without consulting documentation.

### Schema Discovery
`pragma-cli schema all` outputs the complete type system (node types with shapes/subtypes, edge types grouped by mode plus per-type Brandom semantics under `edgeTypeDetails`, diagram modes with available tools, and the composition rules `derive` recognises). This enables an LLM to construct valid commands without external documentation. `pragma-cli schema json-schema` prints a formal JSON Schema (draft 2020-12) for the diagram file format, suitable for external validators. All of this metadata lives in `@pragma-graph/core` (`schemaMeta.ts`, `jsonSchema.ts`) — one source of truth shared with the GUI.

### Brandom-Aware Analysis
Three verbs understand the diagrams as *Meaning-Use Analysis*, not just graphs:

```bash
pragma-cli check                        # permissive validation: warnings/suggestions, never blocks
pragma-cli derive --pragmatic-metavocab # detect V_A -VP-suff-> P -PV-suff-> V_B patterns (BSD Fig 4.1)
pragma-cli derive --lx                  # detect elaborated-explicating (LX) relations (BSD Figs 4.2/4.4)
pragma-cli derive --apply               # add the detected resultant MURs to the diagram (atomic)
pragma-cli explain --style narrative --lang en|es   # prose reading of the diagram
```

`schema composition-rules` documents the patterns `derive` recognises. In the GUI (desktop), **Tools → Validate Diagram** (`Ctrl+Shift+V`) runs the same validation engine.

### Connected Mode (GUI Bridge)
When the Electron desktop app is running, the CLI automatically detects it and sends commands via HTTP to the GUI's Redux store. Changes appear on the canvas instantly.

```bash
# With Electron running, the CLI auto-connects:
pragma-cli status                          # → mode: "connected", gui: true
pragma-cli node add --type vocabulary --label "V₁" --x 200 --y 100   # appears on canvas

# Force headless mode even when GUI is running:
pragma-cli --headless status               # → mode: "headless", gui: false
```

The connection is secured with a per-session Bearer token and only listens on `127.0.0.1`. Every JSON envelope carries a `"mode": "gui" | "headless"` field, and `--require-gui` makes the CLI exit 1 (`GUI_UNAVAILABLE`) instead of silently falling back to headless.

With `--file` in connected mode, the CLI mirrors the GUI's state into the file after every mutation, so the file always matches the canvas (the GUI remains the source of truth).

#### WSL ↔ Windows
When the GUI runs on Windows and the CLI inside WSL, discovery also scans `/mnt/c/Users/*/.pragma-graph-tool/server.json` and probes the GUI over HTTP (liveness is verified with an authenticated request, not a PID check). This works out of the box with WSL2 **mirrored networking** (`networkingMode=mirrored` in `%UserProfile%\.wslconfig`); under default NAT mode the CLI also tries the Windows host IP from `/etc/resolv.conf`.

Escape hatches:
- `PRAGMA_GUI_URL` + `PRAGMA_GUI_TOKEN` — connect to an explicit endpoint (skips file discovery; token is in the GUI's `server.json`)
- `PRAGMA_GUI_TIMEOUT_MS` — probe/request timeout override
- `PRAGMA_BRIDGE_BIND=0.0.0.0` (set before launching the GUI) — bind the bridge beyond loopback. Not recommended: the Bearer token travels as plaintext HTTP; use only on trusted networks.

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
- **Single source of truth**: the GUI imports types, slices, utils, and export generators from `@pragma-graph/core` (vite aliases the package to `packages/core/src` so dev/HMR compile it from source); `src/` keeps only React components, hooks, and thin DOM wrappers. Golden-file tests in `tests/fidelity/` pin the export output

### Package Structure
```
pragma-graph-tool/
  src/                  # GUI (React + Vite) — components/hooks + window.__pragma_cli__ bridge
  electron/             # Electron main process — HTTP server for CLI bridge
  packages/core/        # Shared pure TypeScript: types, Redux slices, utils, export generators
  cli/                  # CLI (commander + @pragma-graph/core) — auto-connects to GUI or runs headless
  tests/                # Fixtures + golden-file tests pinning export output
```

### Testing
```bash
npm test                            # everything
npx vitest run tests/fidelity       # golden-file export tests only
npx vitest run tests/fidelity -u    # re-anchor goldens after an INTENTIONAL export change
```
The golden snapshots in `tests/fidelity/__snapshots__/` are the fidelity contract between GUI and CLI export output — they were anchored against the GUI's original generators, so any diff is either an intentional format change (update and review) or a regression. Other suites: core reducer tests, schema-metadata consistency (every type-union literal must have metadata), JSON Schema validation (ajv) over the fixtures, CLI discovery (real loopback server), and the `--file` conflict guard.

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

A `.netlifyignore` file excludes `electron/`, `cli/`, `dist-electron/`, and `research/` from the deploy artifact (`packages/core` must stay included — the web build compiles it from source). This does not affect the build step — `npm install` and `vite build` still have full repo access.

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
