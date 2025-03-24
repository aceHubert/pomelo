import * as path from 'path';
import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import { Transport } from '@nestjs/microservices';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ReflectionService } from '@grpc/reflection';
import { Log4jsService } from '@ace-pomelo/nestjs-log4js';
import { bootstrap, normalizeRoutePath, POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { AppModule } from './app.module';
import { syncDatabase } from './db.sync';
import { version } from './version';

declare const module: any;
const logger = new Logger('Main', { timestamp: true });

let globalPrefix: string, isSwaggerDebug: boolean, swaggerPath: string, gRPCServerUrl: string;
bootstrap(AppModule, {
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

    // gRPC
    const gRPCHost = configService.get<string>('GRPCHOST', 'localhost'),
      gRPCPort = configService.get<string | number>('GRPCPORT', '5000');

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
        transport: Transport.GRPC,
        options: {
          package: POMELO_SERVICE_PACKAGE_NAME,
          protoPath: path.join(__dirname, 'protos/index.proto'),
          url: (gRPCServerUrl = `${gRPCHost}:${gRPCPort}`),
          loader: {
            longs: Number,
            defaults: true,
            oneofs: true,
          },
          onLoadPackageDefinition(pkg, server) {
            new ReflectionService(pkg).addToServer(server);
          },
        },
      },
      hybridOptions: {
        // gRPC 和 HTTP 服务端口时启用微服继承 HTTP 应用的配置
        // 服务器会根据请求协议（HTTP/1.1 vs HTTP/2+gRPC）自动路由请求到正确的处理器
        // 非 SSL 下不支持 HTTP/2
        inheritAppConfig: String(port) === String(gRPCHost),
      },
    };
  },
}).then(async ({ app, microservice }) => {
  const appUrl = await app.getUrl();
  logger.log(`Http server is running on: ${appUrl}${globalPrefix}`);
  logger.log(`gRPC server is running on: ${gRPCServerUrl}`);
  isSwaggerDebug && logger.log(`Swagger server is running on: ${appUrl}${globalPrefix}${swaggerPath}`);

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => {
      app.close();
      microservice?.close();
    });
  }
});
