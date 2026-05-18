import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { notFound } from '../utils/http';

const router = Router();

router.use(requireAuth);

// GET /departments — список с подсчётом штатных единиц
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim();

    const items = await prisma.department.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { staffUnits: true, children: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(items);
  })
);

// GET /departments/tree — иерархическое дерево
router.get(
  '/tree',
  asyncHandler(async (_req, res) => {
    const all = await prisma.department.findMany({
      include: { _count: { select: { staffUnits: true } } },
      orderBy: { name: 'asc' },
    });

    type Node = (typeof all)[number] & { children: Node[] };
    const byId = new Map<number, Node>();
    all.forEach((d) => byId.set(d.id, { ...d, children: [] }));
    const roots: Node[] = [];

    byId.forEach((node) => {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    res.json(roots);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        staffUnits: {
          include: { position: true, employee: true },
        },
      },
    });
    if (!dept) throw notFound('Подразделение не найдено');
    res.json(dept);
  })
);

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(32),
  description: z.string().optional().nullable(),
  parentId: z.number().int().positive().optional().nullable(),
});

router.post(
  '/',
  requireRole('HR_MANAGER'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const created = await prisma.department.create({ data });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: 'CREATE',
        entity: 'departments',
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
    if (data.parentId === id) {
      throw notFound('Подразделение не может быть родителем самого себя');
    }
    const updated = await prisma.department.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: 'UPDATE',
        entity: 'departments',
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
    await prisma.department.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: 'DELETE',
        entity: 'departments',
        entityId: id,
      },
    });
    res.status(204).end();
  })
);

export default router;
