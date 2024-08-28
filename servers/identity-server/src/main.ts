import { join } from 'path';
import { urlencoded } from 'body-parser';
import { default as expressEjsLayout } from 'express-ejs-layouts';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { normalizeRoutePath, stripForegoingSlash } from '@ace-pomelo/shared-server';
import { ApiModule } from './api/api.module';
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

  // swagger
  if (isSwaggerDebug) {
    const api = new DocumentBuilder()
      .setTitle('Pomelo identity APIs')
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
      .addTag('clients', 'Clients.')
      .addTag('identityResources', 'Identity Resources.')
      .addTag('apiResources', 'Api Resources.')
      .build();
    const document = SwaggerModule.createDocument(app, api, {
      include: [ApiModule],
    });
    SwaggerModule.setup(swaggerPath, app, document, {
      useGlobalPrefix: true,
    });
  }

  // set application/x-www-form-urlencoded body parser
  app.use(urlencoded({ extended: false }));

  // set layout
  app
    .use(expressEjsLayout)
    .useStaticAssets(join(__dirname, '../', 'public'), {
      // https://github.com/nestjs/serve-static/issues/1280
      prefix: globalPrefix,
    })
    .setBaseViewsDir(join(__dirname, '../', 'views'))
    .setLocal('title', 'Pomelo Identity Server')
    .setLocal('baseURL', `${globalPrefix}/`)
    .set('view engine', 'ejs')
    .set('layout', 'layouts/default')
    .set('layout extractScripts', true)
    .set('layout extractStyles', true)
    .set('layout extractMetas', true);

  await app.listen(port, host);
  logger.log(
    `Application is running on: ${await app.getUrl()}${globalPrefix ? ' with global prefix: ' + globalPrefix : ''}`,
  );
  logger.log(
    `OpenID-Connect discovery endpoint: ${await app.getUrl()}${globalPrefix}/.well-known/openid-configuration`,
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
    logger.error(err, err.stack);
    process.exit(1);
  });
