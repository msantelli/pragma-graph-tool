import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as http from 'node:http';

export interface GUIConnection {
  host: string;
  port: number;
  token: string;
  pid: number;
  version: string;
  /** Where the connection came from: 'env' or the server.json path used. */
  source: string;
}

export interface DiscoveryResult {
  connection: GUIConnection | null;
  /** server.json files (or env URL) that were found but did not answer the probe. */
  stale: string[];
}

// Computed lazily so tests can redirect the home directory.
const connectionFilePath = () => path.join(os.homedir(), '.pragma-graph-tool', 'server.json');

const PROBE_TIMEOUT_MS = process.env.PRAGMA_GUI_TIMEOUT_MS
  ? parseInt(process.env.PRAGMA_GUI_TIMEOUT_MS, 10)
  : 750;

interface ServerFile {
  port: number;
  token: string;
  pid: number;
  version?: string;
}

function readServerFile(filePath: string): ServerFile | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const conn = JSON.parse(raw) as ServerFile;
    if (!conn.port || !conn.token || !conn.pid) return null;
    return conn;
  } catch {
    return null;
  }
}

export function isWSL(): boolean {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME) return true;
  try {
    return /microsoft/i.test(fs.readFileSync('/proc/version', 'utf-8'));
  } catch {
    return false;
  }
}

/** server.json files written by a Windows-side GUI, visible from WSL. */
function windowsServerFiles(): string[] {
  const usersDir = '/mnt/c/Users';
  const skip = new Set(['Public', 'Default', 'Default User', 'All Users', 'desktop.ini']);
  try {
    return fs.readdirSync(usersDir)
      .filter(u => !skip.has(u))
      .map(u => path.join(usersDir, u, '.pragma-graph-tool', 'server.json'))
      .filter(p => fs.existsSync(p));
  } catch {
    return [];
  }
}

/** WSL2 NAT mode: the Windows host is the resolv.conf nameserver. */
function natHostIP(): string | null {
  try {
    const match = fs.readFileSync('/etc/resolv.conf', 'utf-8').match(/^nameserver\s+([0-9.]+)/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** GET /api/v1/status with the bearer token; true iff the GUI answers. */
function probe(host: string, port: number, token: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: host,
      port,
      path: '/api/v1/status',
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: PROBE_TIMEOUT_MS,
    }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(false));
  });
}

/**
 * Find a live GUI, trying in order:
 *  1. PRAGMA_GUI_URL + PRAGMA_GUI_TOKEN (explicit override)
 *  2. server.json in this OS's home directory (127.0.0.1)
 *  3. under WSL: server.json in Windows user profiles, reached via
 *     127.0.0.1 (mirrored networking) or the NAT gateway IP
 * Liveness is an authenticated HTTP probe — PIDs are meaningless across the
 * WSL/Windows boundary.
 */
export async function discoverGUI(
  options: { scanWindowsHomes?: boolean } = {}
): Promise<DiscoveryResult> {
  const scanWindowsHomes = options.scanWindowsHomes ?? isWSL();
  const stale: string[] = [];

  const envUrl = process.env.PRAGMA_GUI_URL;
  const envToken = process.env.PRAGMA_GUI_TOKEN;
  if (envUrl && envToken) {
    try {
      const url = new URL(envUrl);
      const port = parseInt(url.port, 10) || 80;
      if (await probe(url.hostname, port, envToken)) {
        return {
          connection: { host: url.hostname, port, token: envToken, pid: 0, version: 'unknown', source: 'env' },
          stale,
        };
      }
      stale.push(`PRAGMA_GUI_URL=${envUrl}`);
    } catch {
      stale.push(`PRAGMA_GUI_URL=${envUrl} (invalid URL)`);
    }
    // An explicit override that fails should not silently fall through to
    // other candidates — the user asked for this endpoint specifically.
    return { connection: null, stale };
  }

  const connectionFile = connectionFilePath();
  const native = readServerFile(connectionFile);
  if (native) {
    // Same-OS pre-filter: skip the probe when the recorded PID is dead.
    let pidAlive = true;
    try {
      process.kill(native.pid, 0);
    } catch {
      pidAlive = false;
    }
    if (pidAlive && await probe('127.0.0.1', native.port, native.token)) {
      return {
        connection: {
          host: '127.0.0.1', port: native.port, token: native.token,
          pid: native.pid, version: native.version ?? 'unknown', source: connectionFile,
        },
        stale,
      };
    }
    stale.push(connectionFile);
  }

  if (scanWindowsHomes) {
    const natIP = natHostIP();
    for (const file of windowsServerFiles()) {
      const win = readServerFile(file);
      if (!win) continue;
      // No PID check: a Windows PID means nothing in the Linux process table.
      const hosts = natIP && natIP !== '127.0.0.1' ? ['127.0.0.1', natIP] : ['127.0.0.1'];
      for (const host of hosts) {
        if (await probe(host, win.port, win.token)) {
          return {
            connection: {
              host, port: win.port, token: win.token,
              pid: win.pid, version: win.version ?? 'unknown', source: file,
            },
            stale,
          };
        }
      }
      stale.push(file);
    }
  }

  return { connection: null, stale };
}
