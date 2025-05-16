/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-require-imports */

import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../app.module';

import { GlobalResponseInterceptor } from '../infrastructure/http/global-response.interceptor';
import { GlobalExceptionFilter } from '../infrastructure/http/global-exception.filter';

const express = require('express');
const binaryMimeTypes: string[] = [];

let cachedServer: Server;

async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
    const expressApp = express();

    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // Middleware para contexto AWS
    nestApp.use(eventContext());

    // Registramos interceptor y filtro global
    nestApp.useGlobalInterceptors(new GlobalResponseInterceptor());
    nestApp.useGlobalFilters(new GlobalExceptionFilter());

    await nestApp.init();

    cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
  }
  return cachedServer;
}

export const handler: Handler = async (event: any, context: Context) => {
  const server = await bootstrapServer();
  return proxy(server, event, context, 'PROMISE').promise;
};
