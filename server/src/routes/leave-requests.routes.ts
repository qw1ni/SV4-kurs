import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { badRequest, forbidden, notFound } from '../utils/http';

const router = Router();

router.use(requireAuth);

// GET /leave-requests
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = req.query.status as Prisma.LeaveRequestWhereInput['status'] | undefined;
    const type = req.query.type as Prisma.LeaveRequestWhereInput['type'] | undefined;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    // Сотрудник видит только свои заявки
    let scopedEmployeeId = employeeId;
    if (req.auth!.role === 'EMPLOYEE') {
      const self = await prisma.employee.findFirst({ where: { userId: req.auth!.userId } });
      if (!self) {
        res.json([]);
        return;
      }
      scopedEmployeeId = self.id;
    }

    const where: Prisma.LeaveRequestWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (scopedEmployeeId) where.employeeId = scopedEmployeeId;

    const items = await prisma.leaveRequest.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(items);
  })
);

const createSchema = z.object({
  employeeId: z.number().int().positive().optional(),
  type: z.enum(['ANNUAL', 'UNPAID', 'SICK', 'STUDY', 'MATERNITY']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional().nullable(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);

    let employeeId = data.employeeId;
    if (req.auth!.role === 'EMPLOYEE' || !employeeId) {
      const self = await prisma.employee.findFirst({ where: { userId: req.auth!.userId } });
      if (!self) throw badRequest('Карточка сотрудника не привязана к пользователю');
      employeeId = self.id;
    }

    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw badRequest('Дата окончания раньше даты начала');
    }

    const created = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason ?? undefined,
      },
    });
    res.status(201).json(created);
  })
);

const decisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  decision: z.string().optional().nullable(),
});

router.post(
  '/:id/decision',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = decisionSchema.parse(req.body);

    const lr = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!lr) throw notFound('Заявка не найдена');
    if (lr.status !== 'PENDING') throw badRequest('Заявка уже обработана');

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: data.status,
        decision: data.decision ?? undefined,
        decidedAt: new Date(),
        decidedById: req.auth!.userId,
      },
    });

    // Если ежегодный отпуск одобрен и попадает на сегодняшний день — обновляем статус сотрудника
    if (data.status === 'APPROVED' && lr.type === 'ANNUAL') {
      const today = new Date();
      if (today >= lr.startDate && today <= lr.endDate) {
        await prisma.employee.update({
          where: { id: lr.employeeId },
          data: { status: 'VACATION' },
        });
      }
    }

    res.json(updated);
  })
);

router.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lr = await prisma.leaveRequest.findUnique({ where: { id }, include: { employee: true } });
    if (!lr) throw notFound('Заявка не найдена');

    if (req.auth!.role === 'EMPLOYEE') {
      const self = await prisma.employee.findFirst({ where: { userId: req.auth!.userId } });
      if (!self || self.id !== lr.employeeId) throw forbidden('Это не ваша заявка');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELED' },
    });
    res.json(updated);
  })
);

export default router;
