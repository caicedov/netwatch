/**
 * Backend Entry Point
 *
 * NestJS modular monolith application.
 * All game logic, real-time events, and persistence.
 */
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('Starting NetWatch backend...');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Global prefix for all routes
    app.setGlobalPrefix('api');

    // Global validation pipe for DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip unknown properties
        forbidNonWhitelisted: true, // Reject unknown properties
        transform: true, // Auto-transform payloads
      }),
    );

    // CORS configuration
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`Backend running on http://localhost:${port}`);
    logger.log(`API available at http://localhost:${port}/api`);
  } catch (error) {
    logger.error('Failed to start backend:', error);
    process.exit(1);
  }
}

bootstrap();
