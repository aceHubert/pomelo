import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';
import { APP_PIPE, APP_FILTER, ModuleRef } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { MulterModule } from '@nestjs/platform-express';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
// import { print, parse, getIntrospectionQuery } from 'graphql';
import { Context } from 'graphql-ws';
import { PubSub } from 'graphql-subscriptions';
import {
  I18nModule,
  I18nMiddleware,
  I18nValidationPipe,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  CookieResolver,
  GraphQLWebsocketResolver,
} from 'nestjs-i18n';
import { Log4jsModule, LOG4JS_NO_COLOUR_DEFAULT_LAYOUT } from '@ace-pomelo/nestjs-log4js';
import { configuration, normalizeRoutePath, INFRASTRUCTURE_SERVICE } from '@ace-pomelo/shared/server';
import {
  AuthorizationModule,
  AuthorizationService,
  createLocalJWKSet,
  getJWKS,
  getSigningKey,
} from '@ace-pomelo/nestjs-authorization';
import { RamAuthorizationModule } from '@ace-pomelo/nestjs-ram-authorization';
import { ErrorHandlerClientTCP, I18nSerializer } from './common/utils/i18n-client-tcp.util';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { MediaModule } from './medias/media.module';
import { MessageModule } from './messages/message.module';
import { SiteInitModule } from './site-init/site-init.module';
import { OptionModule } from './options/option.module';
import { TermTaxonomyModule } from './term-taxonomy/term-taxonomy.module';
import { TemplateModule } from './templates/template.module';
import { UserModule } from './users/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// extends
import './common/extends/i18n.extend';
import './common/extends/observable.extend';

// format introspection query same way as apollo tooling do
// const IntrospectionQuery = print(parse(getIntrospectionQuery()));

const logger = new Logger('AppModule', { timestamp: true });

@Module({
  imports: [
    HttpModule,
    TerminusModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: process.env.ENV_FILE
        ? [process.env.ENV_FILE]
        : (process.env.NODE_ENV === 'production'
            ? ['.env.production', '.env']
            : ['.env.development.local', '.env.development']
          ).flatMap((file) => [path.join(__dirname, file), path.join(__dirname, '../', file)]),
      load: [configuration()],
    }),
    ServeStaticModule.forRootAsync({
      useFactory: (config: ConfigService) =>
        process.env.NODE_ENV !== 'production' // only serve static files in development mode
          ? [
              {
                rootPath: config.getOrThrow<string>('contentPath'),
                renderPath: /$(uploads|languages|themes|plugins)\//i,
              },
            ]
          : [],
      inject: [ConfigService],
    }),
    Log4jsModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        return {
          isGlobal: true,
          appenders: {
            dateFile: {
              type: 'dateFile',
              filename: config.get('LOG_FILENAME', './logs/infrastructure-bff.log'),
              keepFileExt: true,
              layout: LOG4JS_NO_COLOUR_DEFAULT_LAYOUT,
            },
          },
          categories: {
            default: {
              enableCallStack: true,
              appenders: config.get('LOG_APPENDERS', ['stdout', 'dateFile']),
              level: config.get('LOG_LEVEL', isDebug ? 'debug' : 'info'),
            },
          },
          pm2: !isDebug,
        };
      },
      inject: [ConfigService],
    }),
    I18nModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        const loaderPath = path.join(config.getOrThrow<string>('contentPath'), '/languages');
        if (!fs.existsSync(loaderPath)) {
          fs.mkdirSync(loaderPath, { recursive: true });
        }
        return {
          fallbackLanguage: 'en-US',
          fallbacks: {
            en: 'en-US',
            'en-*': 'en-US',
            zh: 'zh-CN',
            'zh-*': 'zh-CN',
          },
          loaderOptions: {
            path: loaderPath,
            includeSubfolders: true,
            watch: isDebug,
          },
          logging: isDebug,
          disableMiddleware: true,
        };
      },
      resolvers: [
        new GraphQLWebsocketResolver(),
        new QueryResolver(['lang', 'locale']),
        new HeaderResolver(['x-custom-lang', 'x-custom-locale']),
        new CookieResolver(['lang', 'locale']),
        new AcceptLanguageResolver(),
      ],
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [
        {
          name: INFRASTRUCTURE_SERVICE,
          useFactory: (config: ConfigService) => ({
            customClass: ErrorHandlerClientTCP,
            options: {
              host: config.get('INFRASTRUCTURE_SERVICE_HOST', ''),
              port: config.getOrThrow('INFRASTRUCTURE_SERVICE_PORT'),
              serializer: new I18nSerializer(),
            },
          }),
          inject: [ConfigService],
        },
      ],
    }),
    AuthorizationModule.forRootAsync({
      isGlobal: true,
      useFactory: async (config: ConfigService) => {
        const { keys } = await getJWKS([config.get('PRIVATE_KEY')].filter(Boolean) as string[]);
        return {
          verifyingKey: createLocalJWKSet({
            keys: keys.map((jwk) => ({
              kty: jwk.kty,
              use: jwk.use,
              key_ops: jwk.key_ops ? [...jwk.key_ops] : undefined,
              kid: jwk.kid,
              alg: jwk.alg,
              crv: jwk.crv,
              e: jwk.e,
              n: jwk.n,
              x: jwk.x,
              x5c: jwk.x5c ? [...jwk.x5c] : undefined,
              y: jwk.y,
            })),
          }),
        };
      },
      inject: [ConfigService],
    }),
    RamAuthorizationModule.forRoot({
      isGlobal: true,
      serviceName: 'basic',
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (config: ConfigService, authService: AuthorizationService) => {
        const isDebug = config.get<boolean>('graphql.debug', false);
        const graphqlPath = config.get<string>('graphql.path', '/graphql');
        // https://github.com/nestjs/graphql/issues/2477
        const graphqlSubscriptionPath = `${normalizeRoutePath(
          config.get<string>('server.globalPrefixUri', ''),
        )}${config.get<string>('graphql.subscription_path', graphqlPath)}`;
        return {
          debug: isDebug,
          playground: isDebug,
          path: graphqlPath,
          introspection: isDebug,
          useGlobalPrefix: true,
          installSubscriptionHandlers: true,
          cache: new InMemoryLRUCache(),
          autoSchemaFile: path.join(__dirname, 'schema.gql'),
          subscriptions: {
            'graphql-ws': {
              path: graphqlSubscriptionPath,
              onConnect: async (context) => {
                const { connectionParams, extra } = context as Context<
                  ConnectionParams,
                  { user?: any; connectionParams?: ConnectionParams }
                >;
                logger.debug(`graphql-ws connect: ${JSON.stringify(connectionParams, void 0, 2)}`);
                let user: any, userStr: string;
                if ((userStr = connectionParams?.['x-userinfo'])) {
                  user = JSON.parse(Buffer.from(userStr, 'base64').toString('utf-8'));
                } else if (connectionParams?.token) {
                  try {
                    user = await authService.verifyToken(
                      connectionParams.token,
                      connectionParams.tenantId,
                      connectionParams.channelType,
                    );
                  } catch {}
                }
                extra.user = user;
                extra.connectionParams = connectionParams;
              },
              onDisconnect: (context, code, reason) => {
                logger.debug(`graphql-ws disconnect, code: ${code}, reason: ${reason}`);
              },
            },
            'subscriptions-transport-ws': {
              path: graphqlSubscriptionPath,
              onConnect: async (connectionParams: ConnectionParams) => {
                logger.debug(`subscriptions-transport-ws connect: ${JSON.stringify(connectionParams, void 0, 2)}`);
                let user: any, userStr: string;
                if ((userStr = connectionParams?.['x-userinfo'])) {
                  user = JSON.parse(Buffer.from(userStr, 'base64').toString('utf-8'));
                } else if (connectionParams?.token) {
                  try {
                    user = await authService.verifyToken(
                      connectionParams.token,
                      connectionParams.tenantId,
                      connectionParams.channelType,
                    );
                  } catch {}
                }

                return {
                  user,
                  connectionParams,
                };
              },
              onDisconnect: (...args: any[]) => {
                logger.debug(`subscriptions-transport-ws disconnect, args: ${JSON.stringify(args, void 0, 2)}`);
              },
            },
          },
          context: (ctx: any) => {
            return ctx.extra ?? ctx.req;
          },
        };
      },
      inject: [ConfigService, AuthorizationService],
    }),
    SiteInitModule,
    MessageModule.forRoot({
      isGlobal: true,
      // TODO: PubSub 是使用内存管理，生产环境需要更换
      pubSub: new PubSub(),
    }),
    // file upload
    MulterModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        storage: multer.diskStorage({
          // 临时上传文件目录
          destination: path.join(config.get('upload.dest', config.getOrThrow<string>('contentPath')), 'uploads'),
        }),
        // config.get('file_storage') === 'disk'
        //   ? multer.diskStorage({ destination: config.get('file_dest') })
        //   : multer.memoryStorage(),
        limits: {
          fileSize: config.get<number>('upload.maxFileSize'),
          files: config.get<number>('upload.maxFiles'),
        },
      }),
      inject: [ConfigService],
    }),
    MediaModule.forRootAsync({
      // isGlobal: true,
      useFactory: (config: ConfigService) => ({
        dest: config.get('upload.dest', config.getOrThrow<string>('contentPath')),
      }),
      inject: [ConfigService],
    }),
    OptionModule,
    TermTaxonomyModule,
    TemplateModule,
    UserModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        isGlobal: true,
        signingKey: await getSigningKey(config.get('PRIVATE_KEY')),
        tokenExpiresIn: config.get('JWT_EXPIRES_IN'),
      }),
      inject: [ConfigService],
    }),
    // ObsModule.forRootAsync({
    //   useFactory: (config: ConfigService) => ({
    //     accessKey: config.get('OBS_ACCESS_KEY', ''),
    //     secretKey: config.get('OBS_SECRET_KEY', ''),
    //     endpoint: config.get('OBS_ENDPOINT', ''),
    //   }),
    //   inject: [ConfigService],
    // }),
    // SubModuleModule.forRootAsync({
    //   useFactory: (config: ConfigService) => ({
    //     keywords: config
    //       .get<string>('SUBMODULE_KEYWORDS', '')
    //       .split('|')
    //       .map((keyword) => keyword.trim())
    //       .filter((keyword) => keyword),
    //     registry: config.get('SUBMODULE_REGISTRY', 'https://registry.npmjs.org'),
    //     mirrors: config
    //       .get<string>('SUBMODULE_MIRRORS', '')
    //       .split('|')
    //       .map((mirror) => mirror.trim())
    //       .filter((mirror) => mirror),
    //     cached: config.get<string>('SUBMODULE_CACHE', 'false') === 'true',
    //     bucket: config.get<string>('SUBMODULE_BUCKET'),
    //     prefix: config.get<string>('SUBMODULE_PREFIX'),
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        return new I18nValidationPipe({
          enableDebugMessages: isDebug,
          stopAtFirstError: true,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly moduleRef: ModuleRef, private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const appConfig = this.moduleRef['container'].applicationConfig,
      globalPrefix = normalizeRoutePath(appConfig?.getGlobalPrefix() ?? ''),
      graphqlPath = normalizeRoutePath(this.configService.get<string>('graphql.path', '/graphql'));

    consumer
      .apply(I18nMiddleware)
      // exclude routes
      // .exclude()
      .forRoutes(`${globalPrefix}${graphqlPath}`, `${globalPrefix}/api/*`);
  }
}
