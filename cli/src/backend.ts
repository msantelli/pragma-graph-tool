import type { Diagram } from '@pragma-graph/core';
import { GUIClient, type DispatchAction } from './client/httpClient.js';
import * as headlessStore from './headless/headlessStore.js';
import { saveDiagramToFile } from './headless/fileManager.js';
import { markPersistFailure } from './output/formatter.js';

let guiClient: GUIClient | null = null;

export function isConnected(): boolean {
  return guiClient !== null;
}

export function setGUIClient(client: GUIClient): void {
  guiClient = client;
}

export function getGUIClient(): GUIClient | null {
  return guiClient;
}

export async function getDiagram(): Promise<Diagram | null> {
  if (guiClient) {
    return guiClient.getDiagram();
  }
  return headlessStore.getDiagram();
}

export async function requireDiagram(): Promise<Diagram> {
  const d = await getDiagram();
  if (!d) {
    throw new Error('No diagram loaded. Use "diagram create" or "diagram load" first.');
  }
  return d;
}

export async function dispatch(action: DispatchAction): Promise<void> {
  if (guiClient) {
    await guiClient.dispatch(action);
  } else {
    headlessStore.getStore().dispatch(action as Parameters<ReturnType<typeof headlessStore.getStore>['dispatch']>[0]);
  }
}

export async function dispatchBatch(actions: DispatchAction[]): Promise<void> {
  if (guiClient) {
    await guiClient.dispatchBatch(actions);
  } else {
    const store = headlessStore.getStore();
    for (const action of actions) {
      store.dispatch(action as Parameters<typeof store.dispatch>[0]);
    }
  }
}

export function getHeadlessStore() {
  return headlessStore.getStore();
}

export function getHeadlessState() {
  return headlessStore.getState();
}

export async function autoSave(getFilePath: () => string | undefined): Promise<void> {
  const filePath = getFilePath();
  if (!filePath) return;

  try {
    // Connected: the GUI is the source of truth — mirror its state into the
    // file so --file always reflects what the user sees on the canvas.
    const d = guiClient ? await guiClient.getDiagram() : headlessStore.getDiagram();
    if (d) saveDiagramToFile(d, filePath);
  } catch (err) {
    markPersistFailure();
    process.stderr.write(`Warning: could not write ${filePath}: ${(err as Error).message}\n`);
  }
}
