import * as path from 'path';
import * as fs from 'fs';
import { APP_PIPE, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
import { print, parse, getIntrospectionQuery } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import {
  I18nModule,
  I18nMiddleware,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  CookieResolver,
  GraphQLWebsocketResolver,
} from 'nestjs-i18n';
import { JwtModule, JwtService, JwtMiddleware } from 'nestjs-jwt';
import { AuthorizedGuard } from './common/guards/authorized.guard';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { DataSourceModule } from './sequelize-datasources/datasource.module';
import { FileModule, UploadUse } from './files/file.module';
import { MessageModule } from './messages/message.module';
import { DbInitModule } from './db-init/db-init.module';
import { OptionModule } from './options/option.module';
import { TermTaxonomyModule } from './term-taxonomy/term-taxonomy.module';
import { TemplateModule } from './templates/template.module';
import { SubModuleModule, SubModuleUse } from './submodules/submodules.module';
import { configuration } from './common/utils/configuration.utils';

// extends
import '@/common/extends/i18n.extend';

// Types
import { Context } from 'graphql-ws';

// format introspection query same way as apollo tooling do
const IntrospectionQuery = print(parse(getIntrospectionQuery()));

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
    I18nModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        const contentPath = path.join(
          config.get('content', path.join(process.cwd(), '../content')),
          '/languages/backend',
        );
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
    JwtModule.forRootAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => {
        const isDebug = config.get<boolean>('auth.debug', false);
        const jwtEndpoint = config.get<string>('auth.endpoint', '');

        return {
          endpoint: jwtEndpoint,
          credentialsRequired: false,
          requestProperty: 'user',
          jwksRsa: {
            rateLimit: true,
            cache: true,
          },
          unless: (req: any) => {
            if (req.body?.query === IntrospectionQuery) return true;

            // TODO: @Anonymous 跳过 token 验证
            return false;
          },
          logging: isDebug,
          disableMiddleware: true,
        };
      },
      inject: [ConfigService],
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (config: ConfigService, jwt: JwtService) => {
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
          subscriptions: {
            'graphql-ws': {
              path: graphqlSubscriptionPath,
              onConnect: async (context) => {
                const { connectionParams, extra } = context as Context<
                  ConnectionParams,
                  { user?: any; connectionParams?: ConnectionParams }
                >;
                // console.log(1, 'connect', connectionParams);
                let user: any;
                if (connectionParams?.token) {
                  try {
                    user = await jwt.verify(connectionParams.token);
                  } catch {}
                }
                extra.user = user;
                extra.connectionParams = connectionParams;
              },
              // onDisconnect: (context, code, reason) => {
              //   // console.log(1, 'disconnect', code, reason);
              // },
            },
            'subscriptions-transport-ws': {
              path: graphqlSubscriptionPath,
              onConnect: async (connectionParams: ConnectionParams) => {
                // console.log(3, 'connect', connectionParams);
                let user: any;
                if (connectionParams?.token) {
                  try {
                    user = await jwt.verify(connectionParams.token);
                  } catch {}
                }

                return {
                  user,
                  connectionParams,
                };
              },
              // onDisconnect: (...args: any[]) => {
              //   // console.log(3, 'disconnect', args);
              // },
            },
          },
          autoSchemaFile: path.join(__dirname, 'schema.gql'),
          context: async ({ req, extra }) => {
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
      inject: [ConfigService, JwtService],
    }),
    FileModule.forRootAsync({
      isGlobal: true,
      use:
        process.env.UPLOAD_USE !== void 0
          ? process.env.UPLOAD_USE.split('|').map((use) => use.trim() as any)
          : UploadUse.Local,
      useFactory: (config: ConfigService) => ({
        dist: config.get(
          'upload.dist',
          path.join(config.get('content', path.join(process.cwd(), '../content')), '/upload'),
        ),
        limit: config.get('upload.limit'),
        accessKey: config.get('upload.obsClient.accessKey', ''),
        secretKey: config.get('upload.obsClient.secretKey', ''),
        endpoint: config.get('upload.obsClient.endpoint', ''),
      }),
      inject: [ConfigService],
    }),
    MessageModule.forRoot({
      isGlobal: true,
      // TODO: PubSub 是使用内存管理，生产环境需要更换
      pubSub: new PubSub(),
    }),
    SubModuleModule.forRootAsync({
      use:
        process.env.SUBMODULES_USE !== void 0
          ? process.env.SUBMODULES_USE.split('|').map((use) => use.trim() as any)
          : SubModuleUse.Unpkg,
      useFactory: (config: ConfigService) => ({
        keywords: config.get('submodule.keywords', []),
        registry: config.get('submodule.registry'),
        mirrors: config.get('submodule.mirrors'),
        cached: config.get('submodule.cached', false),
        bucket: config.get('submodule.bucket', ''),
        prefix: config.get('submodule.prefix'),
      }),
      inject: [ConfigService],
    }),
    DataSourceModule,
    DbInitModule,
    OptionModule,
    TermTaxonomyModule,
    TemplateModule,
  ],
  providers: [
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
      provide: APP_GUARD,
      useClass: AuthorizedGuard,
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
    const globalPrefixUri = this.configService.get<string>('webServer.globalPrefixUri', '/');
    const graphqlPath = this.configService.get<string>('graphql.path', '/graphql');

    consumer
      .apply(I18nMiddleware, JwtMiddleware)
      // exclude routes
      // .exclude()
      .forRoutes(`${globalPrefixUri}${graphqlPath.substring(1)}`, `${globalPrefixUri}api/*`);
  }
}
