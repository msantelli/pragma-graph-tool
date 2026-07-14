import type { UnknownAction } from '@reduxjs/toolkit';
import type { Diagram } from '@pragma-graph/core';
import type { RootState } from './store/store';

declare global {
  interface Window {
    /** Bridge for the Electron main process / CLI HTTP server. */
    __pragma_cli__?: {
      getState: () => RootState;
      dispatch: (action: UnknownAction) => unknown;
    };
    // Handlers invoked by the Electron application menu.
    clearDiagram?: () => void;
    importDiagram?: (d: Diagram) => void;
    exportDiagram?: () => Diagram | null;
    undo?: () => void;
    redo?: () => void;
    selectAll?: () => void;
    zoomIn?: () => void;
    zoomOut?: () => void;
    resetZoom?: () => void;
    centerDiagram?: () => void;
  }
}

export {};
