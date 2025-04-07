import { join } from 'path';
// import { urlencoded } from 'body-parser';
import { default as expressEjsLayout } from 'express-ejs-layouts';
import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Log4jsService } from '@ace-pomelo/nestjs-log4js';
import { bootstrap, normalizeRoutePath, stripForegoingSlash } from '@ace-pomelo/shared/server';
import { ApisModule } from './apis/apis.module';
import { AppModule } from './app.module';
import { version } from './version';
import { syncDatabase } from './db.sync';

declare const module: any;
const logger = new Logger('Main', { timestamp: true });

// start
let globalPrefix: string,
  isSwaggerDebug: boolean,
  swaggerPath: string,
  isGraphqlDebug: boolean,
  graphqlPath: string,
  oidcPath: string;
bootstrap<NestExpressApplication>(AppModule, {
  optionsFactory: async (app) => {
    const configService = app.get(ConfigService);

    // log4js
    app.useLogger(app.get(Log4jsService));

    // sync database
    await syncDatabase(app);

    const host = configService.get<string>('server.host');
    const port = configService.get<number>('server.port');
    const cors = configService.get<boolean | CorsOptions>('server.cors', false);
    globalPrefix = normalizeRoutePath(configService.get<string>('server.globalPrefixUri', ''));
    isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
    swaggerPath = normalizeRoutePath(configService.get<string>('swagger.path', '/doc'));
    isGraphqlDebug = configService.get<boolean>('graphql.debug', false);
    graphqlPath = normalizeRoutePath(configService.get<string>('graphql.path', '/graphql'));
    oidcPath = normalizeRoutePath(configService.get<string>('OIDC_PATH', '/oidc'));

    // https://expressjs.com/en/guide/behind-proxies.html
    app.set('trust proxy', (addr: string, i: number) => {
      logger.debug(`trust proxy, addr: ${addr}, i: ${i}`);
      return true;
    });

    // set application/x-www-form-urlencoded body parser
    // app.use(urlencoded({ extended: false }));

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
      .setLocal('cdnPrefix', '//cdn.jsdmirror.com/npm/')
      .set('view engine', 'ejs')
      .set('layout', 'layouts/default')
      .set('layout extractScripts', true)
      .set('layout extractStyles', true)
      .set('layout extractMetas', true);

    return {
      host,
      port,
      cors,
      prefix: globalPrefix
        ? {
            path: globalPrefix,
            exclude: [
              // { path: '', method: RequestMethod.GET }, #FIXME: 会导致 Middleware 无法生效
              { path: 'health', method: RequestMethod.GET },
            ],
          }
        : void 0,
      swagger: isSwaggerDebug
        ? {
            path: swaggerPath,
            configFactory: () =>
              new DocumentBuilder()
                .setTitle('Pomelo identity APIs')
                .setDescription(
                  `The RESTful API documentation.<br/>graphql support: <a href="${stripForegoingSlash(
                    graphqlPath,
                  )}" target="_blank">Documentation</a>`,
                )
                .setVersion(version)
                .addBearerAuth()
                .addTag('clients', 'Clients.')
                .addTag('identityResources', 'Identity Resources.')
                .addTag('apiResources', 'Api Resources.')
                .build(),
            documentOptions: {
              include: [ApisModule],
            },
            // custom options
            useGlobalPrefix: true,
          }
        : void 0,
    };
  },
}).then(async ({ app }) => {
  const appUrl = await app.getUrl();
  logger.log(`Http server is running on: ${appUrl}${globalPrefix}`);
  logger.log(`OpenID-Connect discovery endpoint: ${appUrl}${globalPrefix}${oidcPath}/.well-known/openid-configuration`);
  isSwaggerDebug && logger.log(`Swagger server is running on: ${appUrl}${globalPrefix}${swaggerPath}`);
  isGraphqlDebug && logger.log(`Graphql server is running on: ${appUrl}${globalPrefix}${graphqlPath}`);

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
});
