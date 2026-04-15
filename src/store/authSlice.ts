import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Project {
  id: number;
  name: string;
  description: string;
}

interface ProjectWithRole extends Project {
  role: "ADMIN" | "MEMBER";
}

interface User {
  id: number;
  userName?: string;
  name: string;
  email: string;
  profileImage: string;
  age: number;
  projects: ProjectWithRole[];
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};


const formatUser = (user: any): User => ({
  id: user.id,
  userName: user.userName,
  name: user.name,
  email: user.email,
  age: user.age,
  profileImage: user.profilePic,
  projects:
    user.projectUsers?.map((pu: any) => ({
      id: pu.project.id,
      name: pu.project.name,
      description: pu.project.description,
      role: pu.role,
    })) || [],
});

export const signupUser = createAsyncThunk<
  User,
  any,
  { rejectValue: string }
>("auth/signupUser", async (data, thunkAPI) => {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      return thunkAPI.rejectWithValue(result.message || "Signup failed");
    }

    return formatUser(result.data);
  } catch {
    return thunkAPI.rejectWithValue("Something went wrong");
  }
});

export const loginUser = createAsyncThunk<
  User,
  any,
  { rejectValue: string }
>("auth/loginUser", async (data, thunkAPI) => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      return thunkAPI.rejectWithValue(result.message || "Login failed");
    }

    return formatUser(result.data);
  } catch {
    return thunkAPI.rejectWithValue("Something went wrong");
  }
});

export const getCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("auth/getCurrentUser", async (_, thunkAPI) => {
  try {
    const res = await fetch("/api/user");

    const result = await res.json();

    if (!res.ok) {
      return thunkAPI.rejectWithValue(
        result.message || "Failed to fetch user"
      );
    }

    return formatUser(result.data);
  } catch {
    return thunkAPI.rejectWithValue("Something went wrong");
  }
});

export const updateUser = createAsyncThunk<
  User,
  any,
  { rejectValue: string }
>("auth/updateUser", async (data, thunkAPI) => {
  try {
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      return thunkAPI.rejectWithValue(result.message || "Update failed");
    }

    return formatUser(result.data);
  } catch {
    return thunkAPI.rejectWithValue("Something went wrong");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Signup failed";
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Update failed";
      });
  },
});

export const { logout, setUser } = authSlice.actions;

export default authSlice.reducer;