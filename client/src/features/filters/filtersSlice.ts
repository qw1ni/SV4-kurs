import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { EmployeeStatus, StaffUnitStatus, WorkSchedule } from '@/types/models';

interface EmployeesFilters {
  search: string;
  status: EmployeeStatus | '';
  departmentId: number | null;
  positionId: number | null;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

interface StaffUnitsFilters {
  search: string;
  departmentId: number | null;
  positionId: number | null;
  status: StaffUnitStatus | '';
  schedule: WorkSchedule | '';
  minSalary: number;
  maxSalary: number;
}

interface FiltersState {
  employees: EmployeesFilters;
  staffUnits: StaffUnitsFilters;
}

const STORAGE_KEY = 'staffing.filters';

const defaultEmployees: EmployeesFilters = {
  search: '',
  status: '',
  departmentId: null,
  positionId: null,
  sortBy: 'lastName',
  sortDir: 'asc',
  page: 1,
  pageSize: 20,
};

const defaultStaffUnits: StaffUnitsFilters = {
  search: '',
  departmentId: null,
  positionId: null,
  status: '',
  schedule: '',
  minSalary: 0,
  maxSalary: 500000,
};

function load(): FiltersState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { employees: defaultEmployees, staffUnits: defaultStaffUnits };
    const parsed = JSON.parse(raw) as Partial<FiltersState>;
    return {
      employees: { ...defaultEmployees, ...(parsed.employees ?? {}) },
      staffUnits: { ...defaultStaffUnits, ...(parsed.staffUnits ?? {}) },
    };
  } catch {
    return { employees: defaultEmployees, staffUnits: defaultStaffUnits };
  }
}

function persist(state: FiltersState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const initialState: FiltersState = load();

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setEmployeesFilters(state, action: PayloadAction<Partial<EmployeesFilters>>) {
      state.employees = { ...state.employees, ...action.payload };
      persist(state);
    },
    resetEmployeesFilters(state) {
      state.employees = defaultEmployees;
      persist(state);
    },
    setStaffUnitsFilters(state, action: PayloadAction<Partial<StaffUnitsFilters>>) {
      state.staffUnits = { ...state.staffUnits, ...action.payload };
      persist(state);
    },
    resetStaffUnitsFilters(state) {
      state.staffUnits = defaultStaffUnits;
      persist(state);
    },
    resetAllFilters(state) {
      state.employees = defaultEmployees;
      state.staffUnits = defaultStaffUnits;
      persist(state);
    },
  },
});

export const {
  setEmployeesFilters,
  resetEmployeesFilters,
  setStaffUnitsFilters,
  resetStaffUnitsFilters,
  resetAllFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
