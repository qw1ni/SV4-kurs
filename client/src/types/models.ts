export type UserRole = 'HR_MANAGER' | 'EMPLOYEE';

export type EmployeeStatus = 'ACTIVE' | 'VACATION' | 'SICK_LEAVE' | 'DISMISSED';

export type WorkSchedule = 'FULL_TIME' | 'PART_TIME' | 'FLEXIBLE' | 'REMOTE' | 'SHIFT';

export type StaffUnitStatus = 'OCCUPIED' | 'VACANT' | 'RESERVED' | 'CLOSED';

export type LeaveType = 'ANNUAL' | 'UNPAID' | 'SICK' | 'STUDY' | 'MATERNITY';

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';

export type DocumentType = 'PASSPORT' | 'SNILS' | 'INN' | 'DIPLOMA' | 'WORK_BOOK' | 'OTHER';

export interface UserDto {
  id: number;
  email: string;
  role: UserRole;
  employee?: EmployeeDto | null;
}

export interface DepartmentDto {
  id: number;
  name: string;
  code: string;
  description: string | null;
  parentId: number | null;
  parent?: { id: number; name: string } | null;
  children?: DepartmentDto[];
  _count?: { staffUnits: number; children?: number };
}

export interface PositionDto {
  id: number;
  title: string;
  code: string;
  description: string | null;
  qualificationRequirements: string | null;
  category: string | null;
  _count?: { staffUnits: number };
  salaryHistory?: SalaryRecordDto[];
}

export interface SalaryRecordDto {
  id: number;
  positionId: number;
  baseSalary: string;
  allowances: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string | null;
}

export interface EmployeeDto {
  id: number;
  userId: number | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  phone: string | null;
  personalEmail: string | null;
  address: string | null;
  hireDate: string;
  dismissalDate: string | null;
  status: EmployeeStatus;
  photoUrl: string | null;
  staffUnits?: StaffUnitDto[];
  leaveRequests?: LeaveRequestDto[];
  documents?: EmployeeDocumentDto[];
  user?: { id: number; email: string; role: UserRole } | null;
}

export interface StaffUnitDto {
  id: number;
  departmentId: number;
  positionId: number;
  employeeId: number | null;
  salary: string;
  rate: string;
  workSchedule: WorkSchedule;
  status: StaffUnitStatus;
  openedDate: string;
  closedDate: string | null;
  notes: string | null;
  department?: DepartmentDto;
  position?: PositionDto;
  employee?: EmployeeDto | null;
}

export interface LeaveRequestDto {
  id: number;
  employeeId: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  reason: string | null;
  decision: string | null;
  decidedAt: string | null;
  createdAt: string;
  employee?: EmployeeDto;
}

export interface EmployeeDocumentDto {
  id: number;
  employeeId: number;
  type: DocumentType;
  number: string;
  issueDate: string | null;
  issuedBy: string | null;
  notes: string | null;
}

export interface PaginatedEmployees {
  items: EmployeeDto[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface StaffingSummary {
  totalUnits: number;
  occupied: number;
  vacant: number;
  totalPayroll: number;
  byDepartment: Array<{
    departmentId: number;
    departmentName: string;
    unitsCount: number;
    totalSalary: number;
  }>;
  employeesByStatus: Array<{ status: EmployeeStatus; count: number }>;
}
