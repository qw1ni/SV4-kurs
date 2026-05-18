import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import filtersReducer from '@/features/filters/filtersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    filters: filtersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
