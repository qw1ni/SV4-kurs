export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU');
}

export function formatFullName(emp?: {
  lastName: string;
  firstName: string;
  middleName?: string | null;
} | null): string {
  if (!emp) return '—';
  const parts = [emp.lastName, emp.firstName];
  if (emp.middleName) parts.push(emp.middleName);
  return parts.join(' ');
}

export function formatFio(emp?: {
  lastName: string;
  firstName: string;
  middleName?: string | null;
} | null): string {
  if (!emp) return '—';
  const initials = `${emp.firstName.charAt(0)}.${emp.middleName ? emp.middleName.charAt(0) + '.' : ''}`;
  return `${emp.lastName} ${initials}`;
}

export const EMPLOYEE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Работает',
  VACATION: 'В отпуске',
  SICK_LEAVE: 'Больничный',
  DISMISSED: 'Уволен(а)',
};

export const STAFF_UNIT_STATUS_LABEL: Record<string, string> = {
  OCCUPIED: 'Занята',
  VACANT: 'Вакансия',
  RESERVED: 'Зарезервирована',
  CLOSED: 'Закрыта',
};

export const SCHEDULE_LABEL: Record<string, string> = {
  FULL_TIME: 'Полный день',
  PART_TIME: 'Неполный день',
  FLEXIBLE: 'Гибкий',
  REMOTE: 'Удалённо',
  SHIFT: 'Сменный',
};

export const LEAVE_TYPE_LABEL: Record<string, string> = {
  ANNUAL: 'Ежегодный',
  UNPAID: 'Без сохранения',
  SICK: 'Больничный',
  STUDY: 'Учебный',
  MATERNITY: 'Декретный',
};

export const LEAVE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
  CANCELED: 'Отменена',
};

export const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  PASSPORT: 'Паспорт',
  SNILS: 'СНИЛС',
  INN: 'ИНН',
  DIPLOMA: 'Диплом',
  WORK_BOOK: 'Трудовая книжка',
  OTHER: 'Иное',
};
