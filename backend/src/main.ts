import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

function ensureRequiredEnv() {
  const required = [
    'DATABASE_URL',
  ];

  const missing = required.filter((v) => !process.env[v]);
  if (missing.length) {
    console.error(
        `❌ Ошибка: Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`,
    );
    process.exit(1);
  }
}

async function bootstrap() {
  ensureRequiredEnv();

  const app = await NestFactory.create(AppModule);

// Security headers
  app.use(helmet());

// CORS — whitelist из переменных окружения
  const corsOrigin =
      process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || [];
  if (corsOrigin.length) {
    app.enableCors({ origin: corsOrigin, credentials: true });
  }

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}
void bootstrap();
