import { configureStore } from '@reduxjs/toolkit';
import diagramReducer from './diagramSlice.js';
import uiReducer from './uiSlice.js';

export function createStore() {
  return configureStore({
    reducer: {
      diagram: diagramReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
  });
}

export const store = createStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
