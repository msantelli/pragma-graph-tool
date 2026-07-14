# Changelog

## 1.2.0 — 2026-07-14

### CLI
- **Brandom-aware verbs** (from the `feat/brandom-aware-cli` line): `check` (permissive MUD/TOTE validation), `derive` (detect/apply pragmatic-metavocabulary and LX resultants per BSD ch.4), `explain` (bilingual prose reading), `schema composition-rules`.
- **WSL ↔ Windows bridge**: discovery scans Windows user profiles from WSL and verifies liveness with an authenticated HTTP probe instead of a PID check; works out of the box with WSL2 mirrored networking, NAT fallback via the host IP. `PRAGMA_GUI_URL`/`PRAGMA_GUI_TOKEN`/`PRAGMA_GUI_TIMEOUT_MS` overrides.
- **No silent fallback**: every envelope reports `"mode": "gui" | "headless"`; `--require-gui` fails hard with `GUI_UNAVAILABLE`; stale GUI sessions print a stderr hint.
- **Connected-mode `--file` mirroring**: the file now tracks the canvas after every mutation (previously it was silently never written).
- **File-conflict guard** (headless): content-hash detection of external writes between load and save → `FILE_CONFLICT` with hint; `--force` bypasses.
- **`schema json-schema`**: formal JSON Schema (draft 2020-12) for diagram files.
- Envelope errors gained an optional `hint` field; `--version` now tracks the release version.

### GUI
- View-menu items (Zoom In/Out, Reset Zoom, Center Diagram) and Edit → Select All now work (they were silent no-ops).
- New **Tools → Validate Diagram** (`Ctrl+Shift+V`) runs the core validation engine.
- JSON import no longer rejects diagrams containing `custom` nodes.
- Edge-modification panel offers only edge types valid for the selected endpoints (Brandom-correct filtering).

### Architecture
- The GUI now consumes `@pragma-graph/core` directly (types, slices, utils, export generators) — the maintained parallel copies in `src/` are gone. Vite/vitest alias the package to `packages/core/src`, so dev/HMR compile core from source.
- Schema metadata (glosses, BSD references, composition rules) single-sourced in `packages/core/src/schemaMeta.ts`.
- Golden-file export tests (`tests/fidelity/`) pin TikZ/SVG/LaTeX/JSON output; suites for reducers, schema consistency, JSON Schema validation, CLI discovery, and the conflict guard (`npm test`).
- Removed ~3,400 lines of dead code (`App-simple.tsx`, redundant type files), unused deps (`lodash`, `file-saver`), and tracked build output (`dev-dist/`). All lint errors fixed.
- Electron bridge: configurable bind host (`PRAGMA_BRIDGE_BIND`), `server.json` written with owner-only permissions and the real app version.

### Compatibility
- Diagram JSON format unchanged (still `metadata.version: "1.1"` payloads); older files load as before.
- The new CLI works against older installed GUIs (verified against 1.1.0) — bridge endpoints are unchanged.

## 1.1.0 and earlier
Initial public line: MUD/TOTE/HYBRID editor, nested nodes, JSON/SVG/LaTeX-TikZ export, PWA, Electron desktop builds, initial CLI with GUI bridge, monochrome TikZ redesign for Brandom MUDs / Miller TOTEs.
