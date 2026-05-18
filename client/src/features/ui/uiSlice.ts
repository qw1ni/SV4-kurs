import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Mode = 'light' | 'dark';
type SnackbarSeverity = 'success' | 'info' | 'warning' | 'error';

interface UiState {
  mode: Mode;
  sidebarOpen: boolean;
  snackbar: { open: boolean; message: string; severity: SnackbarSeverity } | null;
}

const STORAGE_KEY = 'staffing.ui';

function load(): Partial<UiState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(state: UiState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: state.mode, sidebarOpen: state.sidebarOpen })
    );
  } catch {
    /* ignore */
  }
}

const persisted = load();

const initialState: UiState = {
  mode: (persisted.mode as Mode) ?? 'light',
  sidebarOpen: persisted.sidebarOpen ?? true,
  snackbar: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      persist(state);
    },
    setTheme(state, action: PayloadAction<Mode>) {
      state.mode = action.payload;
      persist(state);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
      persist(state);
    },
    showSnackbar(
      state,
      action: PayloadAction<{ message: string; severity?: SnackbarSeverity }>
    ) {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity ?? 'info',
      };
    },
    hideSnackbar(state) {
      if (state.snackbar) state.snackbar.open = false;
    },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, showSnackbar, hideSnackbar } = uiSlice.actions;
export default uiSlice.reducer;
