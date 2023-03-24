import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';

// Types
import type { Request, Response } from 'express';
import type { Options as ProxyOptions } from 'http-proxy-middleware';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

declare const module: any;

const logger = new Logger('Main', { timestamp: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const host = configService.get<string>('webServer.host', '');
  const port = configService.get<number>('webServer.port', 3000);
  const globalPrefixUri = configService.get<string>('webServer.globalPrefixUri', '/');
  const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);
  const isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
  const swaggerPath = configService.get<string>('swagger.path', '/doc');
  const isGraphqlDebug = configService.get<boolean>('graphql.debug', false);
  const graphqlPath = configService.get<string>('graphql.path', '/graphql');
  const proxyConfig = configService.get<Record<string, ProxyOptions>>('proxy');

  // 启动跨域
  if (cors) {
    cors === true ? app.enableCors() : app.enableCors(cors);
  }

  // 全局前缀
  app.setGlobalPrefix(globalPrefixUri);

  // swagger
  if (isSwaggerDebug) {
    const api = new DocumentBuilder()
      .setTitle('APIs')
      .setDescription('The API description')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('options', 'Option configs.')
      .addTag('templates', 'Template common actions.')
      .addTag('templates/form', 'From template.')
      .addTag('templates/page', 'Page template.')
      .addTag('templates/post', 'Post template.')
      .addTag('submodules', 'Micro front-end sub modules.')
      .addTag('term-taxonomy', 'Term taxonomy.')
      .addTag('resources', 'Resources management.')
      .build();
    const document = SwaggerModule.createDocument(app, api);
    SwaggerModule.setup(swaggerPath, app, document);
  }

  // 启动 root 页面
  app.getHttpAdapter().get('/', (req: Request, res: Response) => {
    res.send('hello world!');
  });

  // proxy
  if (proxyConfig) {
    Object.keys(proxyConfig).forEach((filter) => {
      app.getHttpAdapter().use(createProxyMiddleware(filter, proxyConfig[filter]));
    });
  }

  await app.listen(port, host);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Application's global prefix uri is: ${globalPrefixUri} `);
  logger.log(`Application is enable cors: ${!!cors}`);
  isSwaggerDebug && logger.log(`Swagger server is running on: ${await app.getUrl()}${swaggerPath}`);
  isGraphqlDebug && logger.log(`Graphql server is running on: ${await app.getUrl()}${graphqlPath}`);

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

// start
bootstrap().then(() => null);
