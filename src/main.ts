import './config'; // Your existing config import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalResponseInterceptor } from './infrastructure/http/global-response.interceptor';
import { GlobalExceptionFilter } from './infrastructure/http/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for all routes
  
  // Registramos interceptor y filtro global
  app.useGlobalInterceptors(new GlobalResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  const port = process.env.PORT || 3000;
  const developmentHost = process.env.DEV_HOST || 'localhost';
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Quantum Containers API')
    .setDescription('API documentation for Quantum Containers Service')
    .setVersion('1.0')
    .addTag('containers', 'Container operations')
    //.addBearerAuth() // If you're using authentication
    .addServer(`http://localhost:${port}`, 'Local development server')
    .addServer(`http://${developmentHost}:${port}`, 'Development server')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`Application is running on port ${port}`);
  console.log(`Swagger documentation is available at http://localhost:${port}/api`);
}

bootstrap();