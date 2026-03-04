import { Command } from 'commander';
import { undo, redo, saveToHistory } from '@pragma-graph/core';
import { dispatch, requireDiagram, autoSave, isConnected, getHeadlessStore } from '../backend.js';
import { outputSuccess, outputError } from '../output/formatter.js';

export function registerHistoryCommands(program: Command, getFilePath: () => string | undefined): void {
  const history = program.command('history').description('Undo/redo history commands');

  history
    .command('undo')
    .description('Undo the last action')
    .action(async () => {
      try {
        await requireDiagram();

        // In headless mode, check if there's history to undo
        if (!isConnected()) {
          const store = getHeadlessStore();
          const pastLen = store.getState().diagram.history.past.length;
          if (pastLen === 0) {
            outputError('history.undo', 'NOTHING_TO_UNDO', 'No actions to undo');
            return;
          }
        }

        await dispatch(undo());
        await autoSave(getFilePath);

        outputSuccess('history.undo', { message: 'Undone' });
      } catch (e) {
        outputError('history.undo', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  history
    .command('redo')
    .description('Redo the last undone action')
    .action(async () => {
      try {
        await requireDiagram();

        if (!isConnected()) {
          const store = getHeadlessStore();
          const futureLen = store.getState().diagram.history.future.length;
          if (futureLen === 0) {
            outputError('history.redo', 'NOTHING_TO_REDO', 'No actions to redo');
            return;
          }
        }

        await dispatch(redo());
        await autoSave(getFilePath);

        outputSuccess('history.redo', { message: 'Redone' });
      } catch (e) {
        outputError('history.redo', 'NO_DIAGRAM', (e as Error).message);
      }
    });

  history
    .command('save')
    .description('Create a history snapshot (save point)')
    .action(async () => {
      try {
        await requireDiagram();
        await dispatch(saveToHistory());
        outputSuccess('history.save', { message: 'Snapshot saved' });
      } catch (e) {
        outputError('history.save', 'NO_DIAGRAM', (e as Error).message);
      }
    });
}
