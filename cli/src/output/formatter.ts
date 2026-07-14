export interface CLIResult {
  ok: boolean;
  command: string;
  mode?: 'gui' | 'headless';
  /** Present (false) only when a --file mirror write failed. */
  persisted?: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    validValues?: string[];
    hint?: string;
  };
}

let forceJson = false;
let forceHuman = false;
let currentMode: 'gui' | 'headless' = 'headless';
let persistFailed = false;

export function setMode(mode: 'gui' | 'headless'): void {
  currentMode = mode;
}

/** Called by autoSave when mirroring to --file failed; surfaces in the envelope. */
export function markPersistFailure(): void {
  persistFailed = true;
}

export function setOutputMode(mode: 'json' | 'human' | 'auto'): void {
  forceJson = mode === 'json';
  forceHuman = mode === 'human';
}

function isJsonMode(): boolean {
  if (forceJson) return true;
  if (forceHuman) return false;
  return !process.stdout.isTTY;
}

// Public: true only when the user explicitly requested JSON via --json.
// Commands like `explain --style narrative` that produce plain text should
// stay plain text under shell redirection and only switch to JSON when the
// user opts in.
export function isJsonExplicit(): boolean {
  return forceJson;
}

export function outputSuccess(command: string, result: unknown): void {
  if (isJsonMode()) {
    const envelope: CLIResult = {
      ok: true,
      command,
      mode: currentMode,
      ...(persistFailed ? { persisted: false } : {}),
      result
    };
    process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
  } else {
    // Human-readable output
    if (typeof result === 'string') {
      process.stdout.write(result + '\n');
    } else if (Array.isArray(result)) {
      if (result.length === 0) {
        process.stdout.write('(empty)\n');
      } else {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      }
    } else if (result !== null && result !== undefined) {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    }
  }
}

export function outputError(command: string, code: string, message: string, validValues?: string[], hint?: string): void {
  const envelope: CLIResult = {
    ok: false,
    command,
    mode: currentMode,
    error: { code, message, ...(validValues ? { validValues } : {}), ...(hint ? { hint } : {}) }
  };

  if (isJsonMode()) {
    process.stderr.write(JSON.stringify(envelope, null, 2) + '\n');
  } else {
    process.stderr.write(`Error: ${message}\n`);
    if (validValues && validValues.length > 0) {
      process.stderr.write(`Valid values: ${validValues.join(', ')}\n`);
    }
  }

  process.exitCode = 1;
}

// Output raw string (for export commands that produce raw content)
export function outputRaw(content: string): void {
  process.stdout.write(content);
}
