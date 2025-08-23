import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('FitnessPro SaaS API')
    .setDescription('Comprehensive fitness training platform API for trainers and clients')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management and profiles')
    .addTag('Trainers', 'Trainer-specific operations and management')
    .addTag('Clients', 'Client-specific operations and management')
    .addTag('Workouts', 'Exercise library, workout creation, and fitness management')
    .addTag('Sessions', 'Training session scheduling and management')
    .addTag('Payments', 'Payment processing and subscription management')
    .addTag('Progress', 'Client progress tracking and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`🚀 FitnessPro Backend API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
  console.log(`🏋️‍♂️ Fitness platform ready for trainers and clients!`);
}

bootstrap();
