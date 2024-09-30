import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Log4jsService } from '@ace-pomelo/nestjs-log4js';
import { bootstrap, normalizeRoutePath, stripForegoingSlash } from '@ace-pomelo/shared/server';
import { AppModule } from './app.module';
import { version } from './version';

declare const module: any;
const logger = new Logger('Main', { timestamp: true });

// start
let globalPrefix: string, isSwaggerDebug: boolean, swaggerPath: string, isGraphqlDebug: boolean, graphqlPath: string;
bootstrap<NestExpressApplication>(AppModule, {
  optionsFactory: (app) => {
    const configService = app.get(ConfigService);

    // log4js
    app.useLogger(app.get(Log4jsService));

    const host = configService.get<string>('server.host', '');
    const port = configService.get<number>('server.port', 3000);
    const cors = configService.get<boolean | CorsOptions>('server.cors', false);
    globalPrefix = normalizeRoutePath(configService.get<string>('server.globalPrefixUri', ''));
    isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
    swaggerPath = normalizeRoutePath(configService.get<string>('swagger.path', '/doc'));
    isGraphqlDebug = configService.get<boolean>('graphql.debug', false);
    graphqlPath = normalizeRoutePath(configService.get<string>('graphql.path', '/graphql'));

    // https://expressjs.com/en/guide/behind-proxies.html
    app.set('trust proxy', (addr: string, i: number) => {
      logger.debug(`trust proxy, addr: ${addr}, i: ${i}`);
      return true;
    });

    // ignore favicon.ico
    app.use(function (req: any, res: any, next: Function) {
      if (req.originalUrl && req.originalUrl.split('/').pop() === 'favicon.ico') {
        return res.sendStatus(204);
      }

      next();
    });

    // graphql upload file
    app.use(
      globalPrefix + graphqlPath,
      graphqlUploadExpress({
        maxFileSize: configService.get<number>('upload.maxFileSize', 1024 * 1024 * 10),
        maxFiles: configService.get<number>('upload.maxFiles', 10),
      }),
    );

    return {
      host,
      port,
      cors,
      prefix: globalPrefix
        ? {
            path: globalPrefix,
            exclude: [
              { path: '', method: RequestMethod.GET },
              { path: 'health', method: RequestMethod.GET },
            ],
          }
        : void 0,
      swagger: isSwaggerDebug
        ? {
            path: swaggerPath,
            configFactory: () =>
              new DocumentBuilder()
                .setTitle('Pomelo infrastructure BFF APIs')
                .setDescription(
                  `The RESTful API documentation.<br/>graphql support: <a href="${stripForegoingSlash(
                    graphqlPath,
                  )}" target="_blank">Documentation</a>`,
                )
                .setVersion(version)
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
                .build(),
            useGlobalPrefix: true,
          }
        : void 0,
    };
  },
}).then(async (app) => {
  isSwaggerDebug && logger.log(`Swagger server is running on: ${await app.getUrl()}${globalPrefix}${swaggerPath}`);
  isGraphqlDebug && logger.log(`Graphql server is running on: ${await app.getUrl()}${globalPrefix}${graphqlPath}`);

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
});
