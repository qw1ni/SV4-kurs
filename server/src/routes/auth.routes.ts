import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { badRequest, conflict, unauthorized } from '../utils/http';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль не короче 6 символов'),
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  middleName: z.string().optional(),
  role: z.enum(['HR_MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw conflict('Пользователь с таким email уже зарегистрирован');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        employee: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            hireDate: new Date(),
          },
        },
      },
      include: { employee: true },
    });

    const token = signToken({ userId: user.id, role: user.role, email: user.email });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entity: 'users',
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });
    if (!user || !user.isActive) throw unauthorized('Неверный email или пароль');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized('Неверный email или пароль');

    const token = signToken({ userId: user.id, role: user.role, email: user.email });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'users',
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { employee: true },
    });
    if (!user) throw unauthorized();
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee,
    });
  })
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) throw unauthorized();

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw badRequest('Неверный текущий пароль');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ ok: true });
  })
);

export default router;
