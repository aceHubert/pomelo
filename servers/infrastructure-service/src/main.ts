import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
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

    // sync database
    await syncDatabase(configService);

    const host = configService.get<string>('server.host', '');
    const port = configService.get<number>('server.port', 3000);
    const tcpHost = configService.get<string>('server.tcpHost', host);
    const tcpPort = configService.get<number>('server.tcpPort', port);
    const cors = configService.get<boolean | CorsOptions>('server.cors', false);
    globalPrefix = normalizeRoutePath(configService.get<string>('server.globalPrefixUri', ''));
    isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
    swaggerPath = normalizeRoutePath(configService.get<string>('swagger.path', '/doc'));

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
                .setTitle('Pomelo infrastructure microservice')
                .setVersion(version)
                .addBearerAuth()
                .build(),
            useGlobalPrefix: true,
          }
        : void 0,
      microserviceService: {
        strategy: new I18nServerTcp({
          host: tcpHost,
          port: tcpPort,
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
