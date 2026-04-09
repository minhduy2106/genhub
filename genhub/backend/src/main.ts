import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const uploadsDir = join(process.cwd(), 'uploads');
  const extraOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = [
    'http://localhost:3000',
    'http://frontend:3000',
    process.env.FRONTEND_URL ?? '',
    ...extraOrigins,
  ].filter(Boolean);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    const requestOrigin = req.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  app.use('/uploads', express.static(uploadsDir));
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
    maxAge: 86400,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(
    `🚀 GenHub API running on ${process.env.BACKEND_PUBLIC_URL ?? `http://localhost:${port}`}/api/v1`,
  );
}
void bootstrap();
