import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer, ValidationPipe, Logger } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MulterModule } from '@nestjs/platform-express';
import { GraphQLModule } from '@nestjs/graphql';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
// import { print, parse, getIntrospectionQuery } from 'graphql';
import { Context } from 'graphql-ws';
import { PubSub } from 'graphql-subscriptions';
import {
  I18nModule,
  I18nMiddleware,
  I18nService,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  CookieResolver,
  GraphQLWebsocketResolver,
} from 'nestjs-i18n';
import { OidcModule, OidcService } from '@ace-pomelo/nestjs-oidc';
import { AuthorizationModule } from '@ace-pomelo/authorization';
import { RamAuthorizationModule } from '@ace-pomelo/ram-authorization';
import { InfrastructureModule } from '@ace-pomelo/infrastructure-datasource';
import { configuration } from './common/utils/configuration.utils';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { MediaModule } from './medias/media.module';
import { MessageModule } from './messages/message.module';
import { DbInitModule } from './db-init/db-init.module';
import { OptionModule } from './options/option.module';
import { TermTaxonomyModule } from './term-taxonomy/term-taxonomy.module';
import { TemplateModule } from './templates/template.module';
import { UserModule } from './users/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// extends
// eslint-disable-next-line import/order
import '@/common/extends/i18n.extend';

// format introspection query same way as apollo tooling do
// const IntrospectionQuery = print(parse(getIntrospectionQuery()));

const logger = new Logger('AppModule', { timestamp: true });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.ENV_FILE ??
        (process.env.NODE_ENV === 'production'
          ? ['.env.production.local', '.env.production', '.env']
          : ['.env.development.local', '.env.development']),
      load: [configuration(process.cwd())],
    }),
    ServeStaticModule.forRootAsync({
      useFactory: (config: ConfigService) => [
        {
          rootPath: config.getOrThrow<string>('contentPath'),
          renderPath: /$(uploads|languages)\//i,
        },
      ],
      inject: [ConfigService],
    }),
    I18nModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        const contentPath = path.join(config.getOrThrow<string>('contentPath'), '/languages/core-server');
        if (!fs.existsSync(contentPath)) {
          fs.mkdirSync(contentPath, { recursive: true });
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
            path: contentPath,
            includeSubfolders: true,
            watch: isDebug,
          },
          logging: isDebug,
          disableMiddleware: true,
        };
      },
      resolvers: [
        new GraphQLWebsocketResolver(),
        new QueryResolver(['lang', 'locale', 'l']),
        new HeaderResolver(['x-custom-lang', 'x-custom-locale']),
        new CookieResolver(['lang', 'locale', 'l']),
        new AcceptLanguageResolver(),
      ],
      inject: [ConfigService],
    }),
    OidcModule.forRootAsync({
      isGlobal: true,
      disableController: true,
      useFactory: (config: ConfigService) => ({
        origin: config.getOrThrow('OIDC_ORIGIN'),
        issuer: config.getOrThrow('OIDC_ISSUER'),
        clientMetadata: {
          client_id: config.getOrThrow('OIDC_CLIENT_ID'),
          client_secret: config.get('OIDC_CLIENT_SECRET'),
        },
        authParams: {
          scope: config.get('OIDC_SCOPE'),
          resource: config.get('OIDC_RESOURCE'),
          nonce: 'true',
        },
        defaultHttpOptions: {
          timeout: 20000,
        },
      }),
      inject: [ConfigService],
    }),
    AuthorizationModule,
    RamAuthorizationModule.forRoot({
      serviceName: 'basic',
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (config: ConfigService, oidcService: OidcService) => {
        const isDebug = config.get<boolean>('graphql.debug', false);
        const graphqlPath = config.get<string>('graphql.path', '/graphql');
        const graphqlSubscriptionPath = config.get<string>('graphql.subscription_path', '/graphql');
        return {
          debug: isDebug,
          playground: isDebug,
          introspection: isDebug,
          path: graphqlPath,
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
                logger.debug('graphql-ws', 'connect', connectionParams);
                let user: any;
                if (connectionParams?.token) {
                  try {
                    user = await oidcService.verifyToken(
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
                logger.debug('graphql-ws', 'disconnect', code, reason);
              },
            },
            'subscriptions-transport-ws': {
              path: graphqlSubscriptionPath,
              onConnect: async (connectionParams: ConnectionParams) => {
                logger.debug('subscriptions-transport-ws', 'connect', connectionParams);
                let user: any;
                if (connectionParams?.token) {
                  try {
                    user = await oidcService.verifyToken(
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
                logger.debug('subscriptions-transport-ws', 'disconnect', args);
              },
            },
          },
          context: async ({ req, extra }: any) => {
            // if (connection) {
            //   // check connection for metadata
            //   return {
            //     user: connection.context.user, // from onConnect callback
            //     // ...connection.context.request, // for nestjs-i18n
            //   };
            // } else
            // graphql-ws
            if (extra) {
              return {
                user: extra.user, // from onConnect callback
                connectionParams: extra.connectionParams, // for nestjs-i18n
              };
            } else {
              return {
                user: req.user, // from express-jwt
                req, // for nestjs-i18n
              };
            }
          },
        };
      },
      inject: [ConfigService, OidcService],
    }),
    InfrastructureModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService, i18n: I18nService) => ({
        isGlobal: true,
        connection: config.getOrThrow('database.connection'),
        tablePrefix: config.get('database.tablePrefix', ''),
        translate: i18n.tv.bind(i18n),
      }),
      inject: [ConfigService, I18nService],
    }),
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
    //     keywords: config.get('submodule.keywords', []),
    //     registry: config.get('submodule.registry'),
    //     mirrors: config.get('submodule.mirrors'),
    //     cached: config.get('submodule.cached', false),
    //     bucket: config.get('submodule.bucket', ''),
    //     prefix: config.get('submodule.prefix'),
    //   }),
    //   inject: [ConfigService],
    // }),
    DbInitModule,
    OptionModule,
    TermTaxonomyModule,
    TemplateModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        return new ValidationPipe({
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
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const globalPrefixUri = this.configService.get<string>('webServer.globalPrefixUri', '');
    const graphqlPath = this.configService.get<string>('graphql.path', '/graphql');

    consumer
      .apply(I18nMiddleware)
      // exclude routes
      // .exclude()
      .forRoutes(`${globalPrefixUri}${graphqlPath}`, `${globalPrefixUri}/api/*`);
  }
}
