import * as http from 'node:http';
import type { Diagram, Node, Edge } from '@pragma-graph/core';
import type { GUIConnection } from '../util/discovery.js';

export interface DispatchAction {
  type: string;
  payload?: unknown;
}

export interface GUIStatus {
  gui: boolean;
  pid: number;
  diagram: { id: string; name: string; type: string; nodes: number; edges: number } | null;
}

const REQUEST_TIMEOUT_MS = process.env.PRAGMA_GUI_TIMEOUT_MS
  ? parseInt(process.env.PRAGMA_GUI_TIMEOUT_MS, 10)
  : 5000;

export class GUIClient {
  private conn: GUIConnection;

  constructor(conn: GUIConnection) {
    this.conn = conn;
  }

  get connection(): GUIConnection {
    return this.conn;
  }

  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : undefined;

      const req = http.request({
        hostname: this.conn.host,
        port: this.conn.port,
        path,
        method,
        headers: {
          'Authorization': `Bearer ${this.conn.token}`,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.ok) {
              reject(new Error(parsed.error || 'GUI request failed'));
            } else {
              resolve(parsed.result as T);
            }
          } catch {
            reject(new Error(`Invalid response from GUI: ${data.slice(0, 200)}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Cannot connect to GUI: ${err.message}`));
      });

      req.setTimeout(REQUEST_TIMEOUT_MS, () => {
        req.destroy(new Error('GUI request timed out'));
      });

      if (payload) req.write(payload);
      req.end();
    });
  }

  async getStatus(): Promise<GUIStatus> {
    return this.request('GET', '/api/v1/status');
  }

  async getDiagram(): Promise<Diagram | null> {
    return this.request('GET', '/api/v1/diagram');
  }

  async getNodes(): Promise<Node[]> {
    return this.request('GET', '/api/v1/diagram/nodes');
  }

  async getEdges(): Promise<Edge[]> {
    return this.request('GET', '/api/v1/diagram/edges');
  }

  async dispatch(action: DispatchAction): Promise<Diagram | null> {
    return this.request('POST', '/api/v1/dispatch', { action });
  }

  async dispatchBatch(actions: DispatchAction[]): Promise<Diagram | null> {
    return this.request('POST', '/api/v1/dispatch/batch', { actions });
  }

  async exportDiagram(format: string): Promise<Diagram | null> {
    return this.request('POST', `/api/v1/export/${format}`);
  }
}
