import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { forbidden, notFound } from '../utils/http';

const router = Router();

router.use(requireAuth);

// GET /employees — список сотрудников с фильтрами и пагинацией
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim();
    const status = req.query.status as string | undefined;
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    const positionId = req.query.positionId ? Number(req.query.positionId) : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize) || 20));
    const sortBy = (req.query.sortBy as string) || 'lastName';
    const sortDir = ((req.query.sortDir as string) || 'asc') === 'desc' ? 'desc' : 'asc';

    const conditions: Prisma.EmployeeWhereInput[] = [];
    if (q) {
      conditions.push({
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { middleName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { personalEmail: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (status) conditions.push({ status: status as Prisma.EmployeeWhereInput['status'] });
    if (departmentId) conditions.push({ staffUnits: { some: { departmentId } } });
    if (positionId) conditions.push({ staffUnits: { some: { positionId } } });

    const where: Prisma.EmployeeWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const allowedSort = ['lastName', 'firstName', 'hireDate', 'status', 'id'];
    const safeSort = allowedSort.includes(sortBy) ? sortBy : 'lastName';

    const [total, items] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [safeSort]: sortDir },
        include: {
          staffUnits: {
            include: { department: true, position: true },
          },
          user: { select: { id: true, email: true, role: true } },
        },
      }),
    ]);

    res.json({ items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) });
  })
);

// GET /employees/me/profile — карточка текущего сотрудника
router.get(
  '/me/profile',
  asyncHandler(async (req, res) => {
    const employee = await prisma.employee.findFirst({
      where: { userId: req.auth!.userId },
      include: {
        staffUnits: { include: { department: true, position: true } },
        leaveRequests: { orderBy: { createdAt: 'desc' } },
        documents: true,
      },
    });
    if (!employee) throw notFound('Карточка сотрудника не привязана к пользователю');
    res.json(employee);
  })
);

// GET /employees/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    // Сотрудник видит только себя; HR — кого угодно.
    if (req.auth!.role === 'EMPLOYEE') {
      const self = await prisma.employee.findFirst({ where: { userId: req.auth!.userId } });
      if (!self || self.id !== id) throw forbidden('Можно смотреть только свою карточку');
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        staffUnits: { include: { department: true, position: true } },
        leaveRequests: { orderBy: { createdAt: 'desc' } },
        documents: true,
        user: { select: { id: true, email: true, role: true } },
      },
    });

    if (!employee) throw notFound('Сотрудник не найден');
    res.json(employee);
  })
);

const upsertSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE']).optional().nullable(),
  phone: z.string().optional().nullable(),
  personalEmail: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  hireDate: z.string(),
  dismissalDate: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'VACATION', 'SICK_LEAVE', 'DISMISSED']).optional(),
  photoUrl: z.string().optional().nullable(),
});

router.post(
  '/',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const created = await prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName ?? undefined,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender ?? undefined,
        phone: data.phone ?? undefined,
        personalEmail: data.personalEmail || undefined,
        address: data.address ?? undefined,
        hireDate: new Date(data.hireDate),
        dismissalDate: data.dismissalDate ? new Date(data.dismissalDate) : undefined,
        status: data.status ?? 'ACTIVE',
        photoUrl: data.photoUrl ?? undefined,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: 'CREATE',
        entity: 'employees',
        entityId: created.id,
      },
    });
    res.status(201).json(created);
  })
);

router.put(
  '/:id',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = upsertSchema.parse(req.body);
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName ?? null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender ?? null,
        phone: data.phone ?? null,
        personalEmail: data.personalEmail || null,
        address: data.address ?? null,
        hireDate: new Date(data.hireDate),
        dismissalDate: data.dismissalDate ? new Date(data.dismissalDate) : null,
        status: data.status ?? 'ACTIVE',
        photoUrl: data.photoUrl ?? null,
      },
    });
    await prisma.auditLog.create({
      data: { userId: req.auth!.userId, action: 'UPDATE', entity: 'employees', entityId: id },
    });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.employee.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { userId: req.auth!.userId, action: 'DELETE', entity: 'employees', entityId: id },
    });
    res.status(204).end();
  })
);

// Документы сотрудника
const documentSchema = z.object({
  type: z.enum(['PASSPORT', 'SNILS', 'INN', 'DIPLOMA', 'WORK_BOOK', 'OTHER']),
  number: z.string().min(1),
  issueDate: z.string().optional().nullable(),
  issuedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.post(
  '/:id/documents',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const employeeId = Number(req.params.id);
    const data = documentSchema.parse(req.body);
    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId,
        type: data.type,
        number: data.number,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        issuedBy: data.issuedBy ?? undefined,
        notes: data.notes ?? undefined,
      },
    });
    res.status(201).json(doc);
  })
);

router.delete(
  '/:id/documents/:docId',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const docId = Number(req.params.docId);
    await prisma.employeeDocument.delete({ where: { id: docId } });
    res.status(204).end();
  })
);

export default router;
