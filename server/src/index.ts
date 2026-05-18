import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './utils/prisma';

async function main() {
  const app = createApp();

  await prisma.$connect();
  // eslint-disable-next-line no-console
  console.log('✓ Соединение с PostgreSQL установлено');

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`✓ Сервер запущен: http://localhost:${env.PORT}`);
    console.log(`  Окружение: ${env.NODE_ENV}`);
    console.log(`  CORS origin: ${env.CLIENT_ORIGIN}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Ошибка запуска сервера:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
