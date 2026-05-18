import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/http';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Ошибка валидации',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        message: 'Запись с такими уникальными полями уже существует',
        details: err.meta,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Запись не найдена' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ message: 'Нарушение связности данных (внешний ключ)' });
      return;
    }
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}
