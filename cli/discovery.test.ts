import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as http from 'node:http';
import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Redirect os.homedir() to a per-test temp dir so the real
// ~/.pragma-graph-tool is never read or touched.
const mocks = vi.hoisted(() => ({ home: '' }));
vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>();
  return { ...actual, homedir: () => mocks.home || actual.homedir() };
});

import { discoverGUI, isWSL } from './src/util/discovery.js';

/**
 * Integration-style tests using a real loopback HTTP server as the "GUI"
 * and a temp HOME so the real ~/.pragma-graph-tool is never touched.
 */

let server: http.Server;
let port: number;
const TOKEN = 'test-token';
let tmpHome: string;

const startServer = () => new Promise<void>((resolve) => {
  server = http.createServer((req, res) => {
    if (req.headers.authorization !== `Bearer ${TOKEN}`) {
      res.writeHead(401).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, result: { gui: true } }));
  });
  server.listen(0, '127.0.0.1', () => {
    port = (server.address() as { port: number }).port;
    resolve();
  });
});

beforeEach(async () => {
  await startServer();
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'pragma-discovery-'));
  mocks.home = tmpHome;
  delete process.env.PRAGMA_GUI_URL;
  delete process.env.PRAGMA_GUI_TOKEN;
});

afterEach(() => {
  server.close();
  mocks.home = '';
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

const writeServerFile = (dir: string, data: object) => {
  const d = path.join(dir, '.pragma-graph-tool');
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'server.json'), JSON.stringify(data));
};

describe('discoverGUI', () => {
  it('connects via PRAGMA_GUI_URL/TOKEN env override', async () => {
    process.env.PRAGMA_GUI_URL = `http://127.0.0.1:${port}`;
    process.env.PRAGMA_GUI_TOKEN = TOKEN;

    const { connection, stale } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection).not.toBeNull();
    expect(connection?.source).toBe('env');
    expect(connection?.port).toBe(port);
    expect(stale).toEqual([]);
  });

  it('reports a failing env override as stale without falling through', async () => {
    process.env.PRAGMA_GUI_URL = 'http://127.0.0.1:1'; // nothing listens here
    process.env.PRAGMA_GUI_TOKEN = TOKEN;

    const { connection, stale } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection).toBeNull();
    expect(stale[0]).toContain('PRAGMA_GUI_URL');
  });

  it('flags PRAGMA_GUI_URL without PRAGMA_GUI_TOKEN instead of falling through', async () => {
    process.env.PRAGMA_GUI_URL = `http://127.0.0.1:${port}`;
    // A live server.json exists, but the misconfigured override must win.
    writeServerFile(tmpHome, { port, token: TOKEN, pid: process.pid, version: '1.2.0' });

    const { connection, stale } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection).toBeNull();
    expect(stale[0]).toContain('PRAGMA_GUI_TOKEN');
  });

  it('probes the host recorded in server.json when present', async () => {
    writeServerFile(tmpHome, { port, token: TOKEN, pid: process.pid, version: '1.2.0', host: '127.0.0.1' });

    const { connection } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection?.host).toBe('127.0.0.1');
  });

  it('finds a live GUI via the native home server.json', async () => {
    writeServerFile(tmpHome, { port, token: TOKEN, pid: process.pid, version: '1.2.0' });

    const { connection } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection).not.toBeNull();
    expect(connection?.host).toBe('127.0.0.1');
    expect(connection?.source).toContain(tmpHome);
  });

  it('marks the native file stale when the recorded PID is dead', async () => {
    // PID 2^22 + 1 is practically never alive; kill(pid, 0) throws → stale.
    writeServerFile(tmpHome, { port, token: TOKEN, pid: 4194305, version: '1.2.0' });

    const { connection, stale } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection).toBeNull();
    expect(stale[0]).toContain(tmpHome);
  });

  it('marks the native file stale when the port does not answer', async () => {
    server.close();
    writeServerFile(tmpHome, { port, token: TOKEN, pid: process.pid, version: '1.2.0' });

    const { connection, stale } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection).toBeNull();
    expect(stale[0]).toContain(tmpHome);
  });

  it('rejects a server answering with the wrong token', async () => {
    writeServerFile(tmpHome, { port, token: 'wrong-token', pid: process.pid, version: '1.2.0' });

    const { connection, stale } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection).toBeNull();
    expect(stale.length).toBe(1);
  });

  it('returns headless with no stale entries when nothing exists', async () => {
    const { connection, stale } = await discoverGUI({ scanWindowsHomes: false });
    expect(connection).toBeNull();
    expect(stale).toEqual([]);
  });
});

describe('isWSL', () => {
  it('is a boolean and true on this WSL test machine when applicable', () => {
    expect(typeof isWSL()).toBe('boolean');
  });
});
