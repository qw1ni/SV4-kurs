import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { UPLOAD_ROOT } from './middleware/upload';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Статика для загруженных файлов (аватары и т.д.)
  app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d' }));

  app.use('/api', routes);

  app.use((_req, res) => res.status(404).json({ message: 'Маршрут не найден' }));
  app.use(errorHandler);

  return app;
}
