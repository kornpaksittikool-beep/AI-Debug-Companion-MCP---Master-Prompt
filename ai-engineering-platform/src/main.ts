import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { McpStdioServerService } from './core/mcp/services/mcp-stdio-server.service.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const server = app.get(McpStdioServerService);
  await server.start();
}

void bootstrap();
