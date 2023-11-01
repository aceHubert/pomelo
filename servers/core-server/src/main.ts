import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { AppModule } from './app.module';

declare const module: any;

const logger = new Logger('Main', { timestamp: true });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const host = configService.get<string>('webServer.host', '');
  const port = configService.get<number>('webServer.port', 3000);
  const globalPrefixUri = configService.get<string>('webServer.globalPrefixUri', '');
  const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);
  const isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
  const swaggerPath = configService.get<string>('swagger.path', '/doc');
  const isGraphqlDebug = configService.get<boolean>('graphql.debug', false);
  const graphqlPath = configService.get<string>('graphql.path', '/graphql');

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // enable cors
  if (cors) {
    cors === true ? app.enableCors() : app.enableCors(cors);
  }

  // add grobal prefix
  app.setGlobalPrefix(globalPrefixUri);

  // graphql upload file
  app.use(
    configService.get<string>('graphql.path', '/graphql'),
    graphqlUploadExpress({
      maxFileSize: configService.get<number>('upload.maxFileSize'),
      maxFiles: configService.get<number>('upload.maxFiles'),
    }),
  );

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
      // .addTag('submodules', 'Micro front-end sub modules.')
      .addTag('term-taxonomy', 'Term taxonomy.')
      .addTag('resources', 'Resources management.')
      .build();
    const document = SwaggerModule.createDocument(app, api);
    SwaggerModule.setup(swaggerPath, app, document);
  }

  await app.listen(port, host);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  globalPrefixUri && logger.log(`Application's global prefix uri is: ${globalPrefixUri} `);
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
