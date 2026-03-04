import type { Diagram } from '@pragma-graph/core';
import { GUIClient } from './client/httpClient.js';
import * as headlessStore from './headless/headlessStore.js';
import { saveDiagramToFile } from './headless/fileManager.js';

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

export async function dispatch(action: { type: string; payload?: any }): Promise<void> {
  if (guiClient) {
    await guiClient.dispatch(action);
  } else {
    headlessStore.getStore().dispatch(action as any);
  }
}

export async function dispatchBatch(actions: Array<{ type: string; payload?: any }>): Promise<void> {
  if (guiClient) {
    await guiClient.dispatchBatch(actions);
  } else {
    const store = headlessStore.getStore();
    for (const action of actions) {
      store.dispatch(action as any);
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
  // Skip file auto-save when connected to GUI — the GUI is the source of truth
  if (guiClient) return;

  const filePath = getFilePath();
  if (filePath) {
    const d = headlessStore.getDiagram();
    if (d) saveDiagramToFile(d, filePath);
  }
}
