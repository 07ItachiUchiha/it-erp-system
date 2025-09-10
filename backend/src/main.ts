import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - Allow both localhost and ngrok URLs
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://3df666486a32.ngrok-free.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'ngrok-skip-browser-warning'],
  });

  // Global prefix for REST APIs
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
