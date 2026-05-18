import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { notFound } from '../utils/http';

const router = Router();

router.use(requireAuth);

// GET /staff-units — список с фильтрами
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    const positionId = req.query.positionId ? Number(req.query.positionId) : undefined;
    const status = req.query.status as string | undefined;
    const schedule = req.query.schedule as string | undefined;
    const minSalary = req.query.minSalary ? Number(req.query.minSalary) : undefined;
    const maxSalary = req.query.maxSalary ? Number(req.query.maxSalary) : undefined;
    const q = (req.query.q as string | undefined)?.trim();

    const where: Prisma.StaffUnitWhereInput = {};
    if (departmentId) where.departmentId = departmentId;
    if (positionId) where.positionId = positionId;
    if (status) where.status = status as Prisma.StaffUnitWhereInput['status'];
    if (schedule) where.workSchedule = schedule as Prisma.StaffUnitWhereInput['workSchedule'];
    if (minSalary !== undefined || maxSalary !== undefined) {
      where.salary = {
        ...(minSalary !== undefined ? { gte: new Prisma.Decimal(minSalary) } : {}),
        ...(maxSalary !== undefined ? { lte: new Prisma.Decimal(maxSalary) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { position: { title: { contains: q, mode: 'insensitive' } } },
        { department: { name: { contains: q, mode: 'insensitive' } } },
        { employee: { lastName: { contains: q, mode: 'insensitive' } } },
        { employee: { firstName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const items = await prisma.staffUnit.findMany({
      where,
      include: {
        department: true,
        position: true,
        employee: true,
      },
      orderBy: [{ department: { name: 'asc' } }, { position: { title: 'asc' } }],
    });

    res.json(items);
  })
);

// GET /staff-units/summary — агрегаты для дашборда
router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const [totalUnits, occupied, vacant, totals] = await Promise.all([
      prisma.staffUnit.count(),
      prisma.staffUnit.count({ where: { status: 'OCCUPIED' } }),
      prisma.staffUnit.count({ where: { status: 'VACANT' } }),
      prisma.staffUnit.aggregate({
        _sum: { salary: true },
        where: { status: { in: ['OCCUPIED', 'RESERVED'] } },
      }),
    ]);

    const byDepartment = await prisma.staffUnit.groupBy({
      by: ['departmentId'],
      _count: { _all: true },
      _sum: { salary: true },
    });

    const departmentMeta = await prisma.department.findMany({
      where: { id: { in: byDepartment.map((g) => g.departmentId) } },
    });

    const byDepartmentEnriched = byDepartment
      .map((g) => {
        const dept = departmentMeta.find((d) => d.id === g.departmentId);
        return {
          departmentId: g.departmentId,
          departmentName: dept?.name ?? 'Не указано',
          unitsCount: g._count._all,
          totalSalary: Number(g._sum.salary ?? 0),
        };
      })
      .sort((a, b) => b.totalSalary - a.totalSalary);

    const employeeStatusCounts = await prisma.employee.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    res.json({
      totalUnits,
      occupied,
      vacant,
      totalPayroll: Number(totals._sum.salary ?? 0),
      byDepartment: byDepartmentEnriched,
      employeesByStatus: employeeStatusCounts.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const unit = await prisma.staffUnit.findUnique({
      where: { id },
      include: { department: true, position: true, employee: true },
    });
    if (!unit) throw notFound('Штатная единица не найдена');
    res.json(unit);
  })
);

const upsertSchema = z.object({
  departmentId: z.number().int().positive(),
  positionId: z.number().int().positive(),
  employeeId: z.number().int().positive().optional().nullable(),
  salary: z.number().nonnegative(),
  rate: z.number().positive().max(2),
  workSchedule: z
    .enum(['FULL_TIME', 'PART_TIME', 'FLEXIBLE', 'REMOTE', 'SHIFT'])
    .default('FULL_TIME'),
  status: z.enum(['OCCUPIED', 'VACANT', 'RESERVED', 'CLOSED']).default('VACANT'),
  openedDate: z.string(),
  closedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.post(
  '/',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const created = await prisma.staffUnit.create({
      data: {
        departmentId: data.departmentId,
        positionId: data.positionId,
        employeeId: data.employeeId ?? null,
        salary: new Prisma.Decimal(data.salary),
        rate: new Prisma.Decimal(data.rate),
        workSchedule: data.workSchedule,
        status: data.employeeId ? 'OCCUPIED' : data.status,
        openedDate: new Date(data.openedDate),
        closedDate: data.closedDate ? new Date(data.closedDate) : undefined,
        notes: data.notes ?? undefined,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: 'CREATE',
        entity: 'staff_units',
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
    const updated = await prisma.staffUnit.update({
      where: { id },
      data: {
        departmentId: data.departmentId,
        positionId: data.positionId,
        employeeId: data.employeeId ?? null,
        salary: new Prisma.Decimal(data.salary),
        rate: new Prisma.Decimal(data.rate),
        workSchedule: data.workSchedule,
        status: data.employeeId ? 'OCCUPIED' : data.status,
        openedDate: new Date(data.openedDate),
        closedDate: data.closedDate ? new Date(data.closedDate) : null,
        notes: data.notes ?? null,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: 'UPDATE',
        entity: 'staff_units',
        entityId: id,
      },
    });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.staffUnit.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: 'DELETE',
        entity: 'staff_units',
        entityId: id,
      },
    });
    res.status(204).end();
  })
);

// Назначить сотрудника на штатную единицу
const assignSchema = z.object({ employeeId: z.number().int().positive().nullable() });

router.post(
  '/:id/assign',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { employeeId } = assignSchema.parse(req.body);
    const updated = await prisma.staffUnit.update({
      where: { id },
      data: {
        employeeId: employeeId ?? null,
        status: employeeId ? 'OCCUPIED' : 'VACANT',
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: employeeId ? 'ASSIGN' : 'UNASSIGN',
        entity: 'staff_units',
        entityId: id,
        details: JSON.stringify({ employeeId }),
      },
    });
    res.json(updated);
  })
);

export default router;
