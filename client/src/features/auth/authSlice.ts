import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/api/auth.api';
import { setAuthToken, getAuthToken, extractErrorMessage } from '@/api/client';
import type { UserDto } from '@/types/models';

interface AuthState {
  user: UserDto | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: getAuthToken() ? 'loading' : 'unauthenticated',
  error: null,
};

export const login = createAsyncThunk('auth/login', async (input: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const data = await authApi.login(input.email, input.password);
    setAuthToken(data.token);
    return data.user;
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const register = createAsyncThunk(
  'auth/register',
  async (
    input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      middleName?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await authApi.register(input);
      setAuthToken(data.token);
      return data.user;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const loadCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    return await authApi.me();
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      setAuthToken(null);
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    })
      .addCase(login.fulfilled, (s, a: PayloadAction<UserDto>) => {
        s.status = 'authenticated';
        s.user = a.payload;
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'error';
        s.error = a.payload as string;
      })
      .addCase(register.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.status = 'authenticated';
        s.user = a.payload;
      })
      .addCase(register.rejected, (s, a) => {
        s.status = 'error';
        s.error = a.payload as string;
      })
      .addCase(loadCurrentUser.pending, (s) => {
        if (!s.user) s.status = 'loading';
      })
      .addCase(loadCurrentUser.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = 'authenticated';
      })
      .addCase(loadCurrentUser.rejected, (s) => {
        setAuthToken(null);
        s.user = null;
        s.status = 'unauthenticated';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
