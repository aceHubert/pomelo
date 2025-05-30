import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Log4jsService } from '@ace-pomelo/nestjs-log4js';
import { bootstrap, normalizeRoutePath } from '@ace-pomelo/shared/server';
import { I18nServerTcp } from './common/utils/i18n-server-tcp.util';
import { AppModule } from './app.module';
import { syncDatabase } from './db.sync';
import { version } from './version';

declare const module: any;
const logger = new Logger('Main', { timestamp: true });

let globalPrefix: string, isSwaggerDebug: boolean, swaggerPath: string;
bootstrap(AppModule, {
  optionsFactory: async (app) => {
    const configService = app.get(ConfigService);

    // log4js
    app.useLogger(app.get(Log4jsService));

    // sync database
    await syncDatabase(app);
    const host = configService.get<string>('server.host');
    const port = configService.get<number>('server.port');
    const tcpHost = configService.get<string>('server.tcpHost');
    const tcpPort = configService.get<number>('server.tcpPort');
    const cors = configService.get<boolean | CorsOptions>('server.cors', false);
    globalPrefix = normalizeRoutePath(configService.get<string>('server.globalPrefixUri', ''));
    isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
    swaggerPath = normalizeRoutePath(configService.get<string>('swagger.path', '/doc'));

    // ignore favicon.ico
    app.use(function (req: any, res: any, next: Function) {
      if (req.originalUrl && req.originalUrl.split('/').pop() === 'favicon.ico') {
        return res.sendStatus(204);
      }

      next();
    });

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
                .setTitle('Pomelo infrastructure microservice')
                .setVersion(version)
                .addBearerAuth()
                .build(),
            useGlobalPrefix: true,
          }
        : void 0,
      microserviceService: {
        strategy: new I18nServerTcp({
          host: tcpHost ?? host,
          port: tcpPort ?? port,
        }),
      },
      hybridOptions: {
        inheritAppConfig: true,
      },
    };
  },
}).then(async (app) => {
  isSwaggerDebug && logger.log(`Swagger server is running on: ${await app.getUrl()}${globalPrefix}${swaggerPath}`);

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
});
