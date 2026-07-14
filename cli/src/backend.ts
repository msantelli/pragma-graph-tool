import type { Diagram } from '@pragma-graph/core';
import { GUIClient, type DispatchAction } from './client/httpClient.js';
import * as headlessStore from './headless/headlessStore.js';
import {
  saveDiagramToFile,
  FileConflictError,
  getLoadedDiagramId,
  isForceOverwrite
} from './headless/fileManager.js';
import { markPersistFailure, outputError } from './output/formatter.js';

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

export class NoDiagramError extends Error {
  constructor() {
    super('No diagram loaded. Use "diagram create" or "diagram load" first.');
    this.name = 'NoDiagramError';
  }
}

/** Map a caught command error to an envelope code (NO_DIAGRAM only when it really is one). */
export function errorCode(e: unknown): string {
  return e instanceof NoDiagramError ? 'NO_DIAGRAM' : 'COMMAND_FAILED';
}

export async function requireDiagram(): Promise<Diagram> {
  const d = await getDiagram();
  if (!d) {
    throw new NoDiagramError();
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
    if (!d) return;

    if (guiClient) {
      // Defense in depth (the preAction identity check should have caught
      // this): never mirror the GUI over a file holding a DIFFERENT diagram.
      const loadedId = getLoadedDiagramId(filePath);
      if (loadedId && loadedId !== d.id && !isForceOverwrite()) {
        markPersistFailure();
        process.stderr.write(
          `Warning: not mirroring to ${filePath}: it contains a different diagram (${loadedId}) than the GUI (${d.id}). Pass --force to overwrite, or --headless to edit the file directly.\n`
        );
        return;
      }
    }

    saveDiagramToFile(d, filePath);
  } catch (err) {
    if (!guiClient) {
      // Headless: the file IS the state. If it cannot be persisted, the
      // command failed — exit nonzero instead of reporting success.
      const isConflict = err instanceof FileConflictError;
      outputError(
        'save',
        isConflict ? 'FILE_CONFLICT' : 'SAVE_FAILED',
        (err as Error).message,
        undefined,
        isConflict
          ? 'The file was modified by another process (GUI or another CLI run). Re-run against the current file, or pass --force to overwrite.'
          : 'The mutation was not persisted. Fix the underlying write error (permissions, disk space, path) and re-run.'
      );
      process.exit(1);
    }
    markPersistFailure();
    process.stderr.write(`Warning: could not write ${filePath}: ${(err as Error).message}\n`);
  }
}
