import { configureStore } from '@reduxjs/toolkit';
import { diagramReducer, uiReducer } from '@pragma-graph/core';

export const store = configureStore({
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;