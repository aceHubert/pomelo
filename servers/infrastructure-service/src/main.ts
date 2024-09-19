import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import { Transport } from '@nestjs/microservices';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { bootstrap, normalizeRoutePath } from '@ace-pomelo/shared/server';
import { AppModule } from './app.module';
import { syncDatabase } from './db.sync';
import { version } from './version';

declare const module: any;
const logger = new Logger('Main', { timestamp: true });

syncDatabase()
  .then(() => {
    let globalPrefix: string, isSwaggerDebug: boolean, swaggerPath: string;
    bootstrap(AppModule, {
      optionsFactory: (app) => {
        const configService = app.get(ConfigService);

        const host = configService.get<string>('webServer.host', '');
        const port = configService.get<number>('webServer.port', 3000);
        const tcpPort = configService.get<number>('webServer.microserviceService.port', port);
        const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);
        globalPrefix = normalizeRoutePath(configService.get<string>('webServer.globalPrefixUri', ''));
        isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
        swaggerPath = normalizeRoutePath(configService.get<string>('swagger.path', '/doc'));

        return {
          host,
          port,
          cors,
          prefix: globalPrefix,
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
            transport: Transport.TCP,
            options: {
              host,
              port: tcpPort,
            },
          },
          hybridOptions: { inheritAppConfig: true },
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
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
