import { Avatar, AvatarProps } from '@mui/material';

interface Props extends Omit<AvatarProps, 'src' | 'children'> {
  employee?: {
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  } | null;
  fallbackText?: string;
}

export function EmployeeAvatar({ employee, fallbackText, sx, ...rest }: Props) {
  const initials = employee
    ? `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase()
    : (fallbackText ?? '?');

  return (
    <Avatar
      src={employee?.photoUrl ?? undefined}
      sx={{ bgcolor: 'primary.main', ...sx }}
      {...rest}
    >
      {initials}
    </Avatar>
  );
}
