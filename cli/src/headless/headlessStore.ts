import { createStore, loadDiagram, type RootState } from '@pragma-graph/core';
import type { Diagram } from '@pragma-graph/core';

let store = createStore();

export function getStore() {
  return store;
}

export function getState(): RootState {
  return store.getState();
}

export function getDiagram(): Diagram | null {
  return store.getState().diagram.currentDiagram;
}

export function requireDiagram(): Diagram {
  const diagram = getDiagram();
  if (!diagram) {
    throw new Error('No diagram loaded. Use "diagram create" or "diagram load" first.');
  }
  return diagram;
}

export function resetStore(): void {
  store = createStore();
}

export function loadDiagramIntoStore(diagram: Diagram): void {
  store.dispatch(loadDiagram(diagram));
}
