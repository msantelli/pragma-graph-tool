import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface GUIConnection {
  port: number;
  token: string;
  pid: number;
  version: string;
}

const CONNECTION_FILE = path.join(os.homedir(), '.pragma-graph-tool', 'server.json');

export function discoverGUI(): GUIConnection | null {
  try {
    if (!fs.existsSync(CONNECTION_FILE)) return null;

    const raw = fs.readFileSync(CONNECTION_FILE, 'utf-8');
    const conn: GUIConnection = JSON.parse(raw);

    if (!conn.port || !conn.token || !conn.pid) return null;

    // Check if PID is alive
    try {
      process.kill(conn.pid, 0);
    } catch {
      // Process not running — stale connection file
      return null;
    }

    return conn;
  } catch {
    return null;
  }
}
