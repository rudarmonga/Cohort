// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { AuthState } from "./authSlice";

export function makeStore(preloadedState?: { auth: AuthState }) {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState,
  });
}

export const store = makeStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
