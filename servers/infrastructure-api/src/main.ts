import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupSession } from '@ace-pomelo/nestjs-oidc';
import { normalizeRoutePath } from '@ace-pomelo/shared-server';
import { AppModule } from './app.module';
import { syncDatabase } from './db.sync';

declare const module: any;

const packageName = process.env.npm_package_name;
const packageVersion = process.env.npm_package_version;
const logger = new Logger('Main', { timestamp: true });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const host = configService.get<string>('webServer.host', '');
  const port = configService.get<number>('webServer.port', 3000);
  const globalPrefixUri = normalizeRoutePath(configService.get<string>('webServer.globalPrefixUri', ''));
  const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);
  const isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
  const swaggerPath = normalizeRoutePath(configService.get<string>('swagger.path', '/doc'));
  const isGraphqlDebug = configService.get<boolean>('graphql.debug', false);
  const graphqlPath = normalizeRoutePath(configService.get<string>('graphql.path', '/graphql'));

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
      .setTitle(
        packageName
          ?.replace('@', '')
          .replace('/', ' ')
          .replace(/apis?$/, 'APIs') || 'ace-pomelo infrastructure  APIs',
      )
      .setDescription(
        `The RESTful API documentation.<br/>graphql support: <a href="${graphqlPath}" target="_blank">Documentation</a>`,
      )
      .setVersion(packageVersion || '1.0.0')
      .addBearerAuth()
      .addTag('options', 'Option configs.')
      .addTag('templates', 'Template common actions.')
      .addTag('templates/form', 'From template.')
      .addTag('templates/page', 'Page template.')
      .addTag('templates/post', 'Post template.')
      .addTag('term-taxonomy', 'Term taxonomy.')
      .addTag('user', 'User.')
      .addTag('resources', 'Resources management.')
      // .addTag('submodules', 'Micro front-end sub modules.')
      .build();
    const document = SwaggerModule.createDocument(app, api);
    SwaggerModule.setup(swaggerPath, app, document);
  }

  setupSession(app, packageName?.replace('@', '').replace('/', ':') || 'ace-pomelo:infrastructure-api');

  await app.listen(port, host);
  logger.log(
    `Application is running on: ${await app.getUrl()}${
      globalPrefixUri ? ' with global prefix: ' + globalPrefixUri : ''
    }`,
  );
  !!cors && logger.log('cors is enabled');
  isSwaggerDebug && logger.log(`Swagger server is running on: ${await app.getUrl()}${globalPrefixUri}${swaggerPath}`);
  isGraphqlDebug && logger.log(`Graphql server is running on: ${await app.getUrl()}${globalPrefixUri}${graphqlPath}`);

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

syncDatabase()
  .then(() => {
    // start
    bootstrap().then(() => null);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
