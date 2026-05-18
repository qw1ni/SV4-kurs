import { NextFunction, Request, Response } from 'express';
import { unauthorized, forbidden } from '../utils/http';
import { JwtPayload, verifyToken } from '../utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: JwtPayload;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return next(unauthorized('Отсутствует Bearer-токен'));
  }
  const token = header.slice(7).trim();
  try {
    req.auth = verifyToken(token);
    return next();
  } catch {
    return next(unauthorized('Невалидный или истёкший токен'));
  }
}

export function requireRole(...roles: Array<JwtPayload['role']>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden('Недостаточно прав'));
    return next();
  };
}
