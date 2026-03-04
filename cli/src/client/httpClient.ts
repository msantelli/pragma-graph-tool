import * as http from 'node:http';
import type { GUIConnection } from '../util/discovery.js';

export class GUIClient {
  private conn: GUIConnection;

  constructor(conn: GUIConnection) {
    this.conn = conn;
  }

  private request(method: string, path: string, body?: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : undefined;

      const req = http.request({
        hostname: '127.0.0.1',
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
              resolve(parsed.result);
            }
          } catch {
            reject(new Error(`Invalid response from GUI: ${data.slice(0, 200)}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Cannot connect to GUI: ${err.message}`));
      });

      req.setTimeout(5000, () => {
        req.destroy(new Error('GUI request timed out'));
      });

      if (payload) req.write(payload);
      req.end();
    });
  }

  async getStatus(): Promise<any> {
    return this.request('GET', '/api/v1/status');
  }

  async getDiagram(): Promise<any> {
    return this.request('GET', '/api/v1/diagram');
  }

  async getNodes(): Promise<any[]> {
    return this.request('GET', '/api/v1/diagram/nodes');
  }

  async getEdges(): Promise<any[]> {
    return this.request('GET', '/api/v1/diagram/edges');
  }

  async dispatch(action: { type: string; payload?: any }): Promise<any> {
    return this.request('POST', '/api/v1/dispatch', { action });
  }

  async dispatchBatch(actions: Array<{ type: string; payload?: any }>): Promise<any> {
    return this.request('POST', '/api/v1/dispatch/batch', { actions });
  }

  async exportDiagram(format: string): Promise<any> {
    return this.request('POST', `/api/v1/export/${format}`);
  }
}
