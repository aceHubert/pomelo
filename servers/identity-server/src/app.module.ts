import * as path from 'path';
import * as fs from 'fs';
import { createLocalJWKSet } from 'jose';
import { APP_PIPE, APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { Logger, Module, NestModule, RequestMethod, OnModuleInit, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
// import { print, parse, getIntrospectionQuery } from 'graphql';
import { OidcModule } from 'nest-oidc-provider';
import {
  I18nModule,
  I18nService,
  I18nValidationPipe,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  CookieResolver,
  GraphQLWebsocketResolver,
} from 'nestjs-i18n';
import { Log4jsModule, LOG4JS_NO_COLOUR_DEFAULT_LAYOUT } from '@ace-pomelo/nestjs-log4js';
import { configuration, normalizeRoutePath, INFRASTRUCTURE_SERVICE } from '@ace-pomelo/shared/server';
import { AuthorizationModule, getJWKS } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorizationModule } from '@ace-pomelo/nestjs-ram-authorization';
import { ErrorHandlerClientTCP, I18nSerializer } from './common/utils/i18n-client-tcp.util';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { StorageModule, STORAGE_OPTIONS, StorageOptions, RedisStorage, MemeryStorage } from './storage';
import { IdentityDatasourceModule } from './datasource/datasource.module';
import { ApisModule } from './apis/apis.module';
import { AccountProviderModule } from './account-provider/account-provider.module';
import { AccountConfigService } from './account-config/account-config.service';
import { OidcConfigModule } from './oidc-config/oidc-config.module';
import { OidcConfigService } from './oidc-config/oidc-config.service';
import { AccountModule } from './account/account.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// extends
import './common/extends/i18n.extend';
import './common/extends/observable.extend';

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
    Log4jsModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        return {
          isGlobal: true,
          appenders: {
            dateFile: {
              type: 'dateFile',
              filename: config.get('LOG_FILENAME', './logs/identity-server.log'),
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
    StorageModule.forRootAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => {
        const redisConnection = config.get('REDIS_URL');
        return {
          use: redisConnection ? new RedisStorage(redisConnection) : new MemeryStorage(),
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
          viewEngine: 'ejs',
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
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (config: ConfigService) => {
        const isDebug = config.get<boolean>('graphql.debug', false);
        const graphqlPath = config.get<string>('graphql.path', '/graphql');
        return {
          debug: isDebug,
          playground: isDebug,
          introspection: isDebug,
          path: graphqlPath,
          useGlobalPrefix: true,
          cache: new InMemoryLRUCache(),
          autoSchemaFile: path.join(__dirname, 'schema.gql'),
          context: async ({ req }: any) => req,
        };
      },
      inject: [ConfigService],
    }),
    AuthorizationModule.forRootAsync({
      isGlobal: true,
      useFactory: async (config: ConfigService) => ({
        publicKey: createLocalJWKSet(await getJWKS(config.get('PRIVATE_KEY'))),
      }),
      inject: [ConfigService],
    }),
    RamAuthorizationModule.forRoot({
      isGlobal: true,
      serviceName: 'identity',
    }),
    IdentityDatasourceModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService, i18n: I18nService) => ({
        isGlobal: true,
        connection: config.get('IDENTITY_DATABASE_CONNECTION')
          ? config.get<string>('IDENTITY_DATABASE_CONNECTION')!
          : {
              database: config.getOrThrow('IDENTITY_DATABASE_NAME'),
              username: config.getOrThrow('IDENTITY_DATABASE_USERNAME'),
              password: config.getOrThrow('IDENTITY_DATABASE_PASSWORD'),
              dialect: config.get('IDENTITY_DATABASE_DIALECT', 'mysql'),
              host: config.get('IDENTITY_DATABASE_HOST', 'localhost'),
              port: config.get('IDENTITY_DATABASE_PORT', 3306),
              define: {
                charset: config.get('IDENTITY_DATABASE_CHARSET', 'utf8'),
                collate: config.get('IDENTITY_DATABASE_COLLATE', ''),
              },
            },
        tablePrefix: config.get('TABLE_PREFIX'),
        translate: (key, fallback, args) =>
          i18n?.translate(key, {
            defaultValue: fallback,
            args,
          }),
      }),
      inject: [ConfigService, I18nService],
    }),
    ApisModule,
    AccountProviderModule.forRootAsync({
      isGlobal: true,
      useClass: AccountConfigService,
    }),
    AccountModule.forRootAsync({
      useFactory: (storageOptions: StorageOptions) => ({
        storage: storageOptions.use,
      }),
      inject: [STORAGE_OPTIONS],
    }),
    // All routes proxy to oidc provider, must be the last one
    OidcConfigModule.forRootAsync({
      isGlobal: true,
      useFactory: async (config: ConfigService, storageOptions: StorageOptions) => ({
        debug: config.get('debug', false),
        issuer: `${config.getOrThrow('server.origin')}${normalizeRoutePath(
          config.get<string>('server.globalPrefixUri', ''),
        )}`,
        path: normalizeRoutePath(config.get('OIDC_PATH', '/oidc')),
        jwks: await getJWKS(config.get('PRIVATE_KEY')),
        storage: storageOptions.use,
      }),
      inject: [ConfigService, STORAGE_OPTIONS],
    }),
    OidcModule.forRootAsync({
      imports: [OidcConfigModule],
      useExisting: OidcConfigService,
    }),
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
export class AppModule implements NestModule, OnModuleInit {
  constructor(private readonly adapter: HttpAdapterHost, private readonly i18n: I18nService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: any) => {
        // save locale from query to cookie when request is a html
        let lang, requestAccept;
        if (
          (requestAccept = req.headers['accept']) &&
          requestAccept.includes('text/html') // only html request
        ) {
          if ((lang = req.query.lang || req.query.locale)) {
            // same config with i18n QueryResolver
            this.setLangToCookie(res, lang);
          } else if (req.query.ui_locales) {
            // openid connect
            const langs = req.query.ui_locales.split(' ');
            for (const lang of langs) {
              if (this.setLangToCookie(res, lang)) {
                break;
              }
            }
          }
        }
        next();
      })
      .forRoutes({ method: RequestMethod.GET, path: '*' });
  }

  onModuleInit() {
    const app = this.adapter.httpAdapter.getInstance();
    app.locals['tv'] = (key: string, fallback: any, lang: any, args: any) => {
      return this.i18n.t(key, { defaultValue: fallback, lang, args });
    };
  }

  private setLangToCookie(res: any, lang: string) {
    const resolveLang = this.i18n.resolveLanguage(lang);
    // include i18n fa
    if (['en-US', ...this.i18n.getSupportedLanguages()].includes(resolveLang)) {
      // TODO: 造成oidc-provider中的 headers.get('set-cookie') 变成字符串
      // res.cookie('locale', resolveLang, { httpOnly: true });
      logger.debug(`Set locale to ${resolveLang} from query`);
      return true;
    }
    return false;
  }
}
