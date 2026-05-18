import { Chip } from '@mui/material';
import {
  EMPLOYEE_STATUS_LABEL,
  STAFF_UNIT_STATUS_LABEL,
  LEAVE_STATUS_LABEL,
} from '@/utils/format';

type Variant = 'employee' | 'staff-unit' | 'leave';

const COLOR_MAP: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  ACTIVE: 'success',
  VACATION: 'info',
  SICK_LEAVE: 'warning',
  DISMISSED: 'default',
  OCCUPIED: 'success',
  VACANT: 'warning',
  RESERVED: 'info',
  CLOSED: 'default',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELED: 'default',
};

const LABEL_MAP: Record<Variant, Record<string, string>> = {
  employee: EMPLOYEE_STATUS_LABEL,
  'staff-unit': STAFF_UNIT_STATUS_LABEL,
  leave: LEAVE_STATUS_LABEL,
};

interface Props {
  status: string;
  variant: Variant;
  size?: 'small' | 'medium';
}

export function StatusChip({ status, variant, size = 'small' }: Props) {
  const label = LABEL_MAP[variant][status] ?? status;
  const color = COLOR_MAP[status] ?? 'default';
  return <Chip size={size} label={label} color={color} variant="filled" />;
}
