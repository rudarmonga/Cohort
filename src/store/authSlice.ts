// src/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  profilePicture: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoaded: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoaded = true;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoaded = true;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
