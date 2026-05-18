import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { notFound } from '../utils/http';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim();
    const category = req.query.category as string | undefined;

    const items = await prisma.position.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { code: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {},
          category ? { category } : {},
        ],
      },
      include: {
        _count: { select: { staffUnits: true } },
        salaryHistory: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
      orderBy: { title: 'asc' },
    });

    res.json(items);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const item = await prisma.position.findUnique({
      where: { id },
      include: {
        staffUnits: { include: { department: true, employee: true } },
        salaryHistory: { orderBy: { effectiveFrom: 'desc' } },
      },
    });
    if (!item) throw notFound('Должность не найдена');
    res.json(item);
  })
);

const upsertSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1).max(32),
  description: z.string().optional().nullable(),
  qualificationRequirements: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

router.post(
  '/',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const created = await prisma.position.create({ data });
    await prisma.auditLog.create({
      data: { userId: req.auth!.userId, action: 'CREATE', entity: 'positions', entityId: created.id },
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
    const updated = await prisma.position.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: req.auth!.userId, action: 'UPDATE', entity: 'positions', entityId: id },
    });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.position.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { userId: req.auth!.userId, action: 'DELETE', entity: 'positions', entityId: id },
    });
    res.status(204).end();
  })
);

const salarySchema = z.object({
  baseSalary: z.number().nonnegative(),
  allowances: z.number().nonnegative().optional().default(0),
  effectiveFrom: z.string(),
  reason: z.string().optional().nullable(),
});

router.post(
  '/:id/salary',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const positionId = Number(req.params.id);
    const data = salarySchema.parse(req.body);
    const record = await prisma.salaryRecord.create({
      data: {
        positionId,
        baseSalary: data.baseSalary,
        allowances: data.allowances,
        effectiveFrom: new Date(data.effectiveFrom),
        reason: data.reason ?? undefined,
      },
    });
    res.status(201).json(record);
  })
);

export default router;
