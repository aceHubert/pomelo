import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupSession } from '@ace-pomelo/nestjs-oidc';
import { normalizeRoutePath, stripForegoingSlash } from '@ace-pomelo/shared-server';
import { AppModule } from './app.module';
import { version } from './version';
import { syncDatabase } from './db.sync';

declare const module: any;

const logger = new Logger('Main', { timestamp: true });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const host = configService.get<string>('webServer.host', '');
  const port = configService.get<number>('webServer.port', 3000);
  const globalPrefix = normalizeRoutePath(configService.get<string>('webServer.globalPrefixUri', ''));
  const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);
  const isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
  const swaggerPath = normalizeRoutePath(configService.get<string>('swagger.path', '/doc'));
  const isGraphqlDebug = configService.get<boolean>('graphql.debug', false);
  const graphqlPath = normalizeRoutePath(configService.get<string>('graphql.path', '/graphql'));

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // enable cors
  if (cors) {
    if (cors === true) {
      app.enableCors();
      logger.debug('cors is enabled');
    } else {
      app.enableCors(cors);
      logger.debug('cors is enabled', cors);
    }
  }

  // add grobal prefix
  app.setGlobalPrefix(globalPrefix);

  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', (addr: string, i: number) => {
    logger.debug(`trust proxy, addr: ${addr}, i: ${i}`);
    return true;
  });

  // graphql upload file
  app.use(
    globalPrefix + graphqlPath,
    graphqlUploadExpress({
      maxFileSize: configService.get<number>('upload.maxFileSize'),
      maxFiles: configService.get<number>('upload.maxFiles'),
    }),
  );

  // swagger
  if (isSwaggerDebug) {
    const api = new DocumentBuilder()
      .setTitle('Pomelo infrastructure APIs')
      .setDescription(
        `The RESTful API documentation.<br/>graphql support: <a href="${stripForegoingSlash(
          graphqlPath,
        )}" target="_blank">Documentation</a>`,
      )
      .setVersion(version)
      .addBearerAuth()
      .addOAuth2({
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: configService.get<string>('OIDC_ISSUER') + '/connect/authorize',
            tokenUrl: configService.get<string>('OIDC_ISSUER') + '/connect/token',
            scopes: {
              openid: 'openid',
              profile: 'profile',
            },
          },
        },
        // openIdConnectUrl: configService.get<string>('OIDC_ISSUER') + '/.well-known/openid-configuration',
      })
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
    SwaggerModule.setup(swaggerPath, app, document, {
      useGlobalPrefix: true,
      swaggerOptions: {
        initOAuth: {
          clientId: configService.get<string>('OIDC_CLIENT_ID'),
          scopes: ['openid', 'profile'],
        },
      },
    });
  }

  setupSession(app, 'pomelo:infrastructure-api');

  await app.listen(port, host);
  logger.log(
    `Application is running on: ${await app.getUrl()}${globalPrefix ? ' with global prefix: ' + globalPrefix : ''}`,
  );
  isSwaggerDebug && logger.log(`Swagger server is running on: ${await app.getUrl()}${globalPrefix}${swaggerPath}`);
  isGraphqlDebug && logger.log(`Graphql server is running on: ${await app.getUrl()}${globalPrefix}${graphqlPath}`);

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
