import * as path from 'path';
import * as fs from 'fs';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, ModuleRef } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
// import { print, parse, getIntrospectionQuery } from 'graphql';
import {
  I18nModule,
  I18nMiddleware,
  I18nContext,
  I18nValidationPipe,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  CookieResolver,
  GraphQLWebsocketResolver,
} from 'nestjs-i18n';
import { normalizeRoutePath } from '@ace-pomelo/shared-server';
import { OidcModule } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorizationModule } from '@ace-pomelo/ram-authorization';
import { IdentityModule } from '@ace-pomelo/identity-datasource';
import { configuration } from './common/utils/configuration.utils';
import { DbCheckInterceptor } from './common/interceptors/db-check.interceptor';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { ApiResourceModule } from './api-resources/api-resource.module';
import { IdentityResourceModule } from './identity-resources/identity-resource.module';
import { ClientModule } from './clients/client.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// extends
// eslint-disable-next-line import/order
import '@/common/extends/i18n.extend';

// format introspection query same way as apollo tooling do
// const IntrospectionQuery = print(parse(getIntrospectionQuery()));

// const logger = new Logger('AppModule', { timestamp: true });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.ENV_FILE ??
        (process.env.NODE_ENV === 'production'
          ? ['.env.production', '.env']
          : ['.env.development.local', '.env.development']),
      load: [configuration()],
    }),
    I18nModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        const loaderPath = path.join(config.getOrThrow<string>('contentPath'), '/languages/server');
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
    IdentityModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => ({
        isGlobal: true,
        connection: config.getOrThrow('database.connection'),
        tablePrefix: config.get('database.tablePrefix', ''),
        translate: (key, fallback, args) => {
          const i18n = I18nContext.current();
          return (
            i18n?.translate(key, {
              defaultValue: fallback,
              args,
            }) ?? fallback
          );
        },
      }),
      inject: [ConfigService],
    }),
    OidcModule.forRootAsync({
      isGlobal: true,
      disableController: true,
      useFactory: (config: ConfigService) => ({
        origin: `${config.getOrThrow('ORIGIN')}${normalizeRoutePath(
          config.get<string>('webServer.globalPrefixUri', ''),
        )}`,
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
    RamAuthorizationModule.forRoot({
      serviceName: 'basic',
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
    ApiResourceModule,
    IdentityResourceModule,
    ClientModule,
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
      provide: APP_INTERCEPTOR,
      useClass: DbCheckInterceptor,
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
    const appConfig = this.moduleRef['container'].applicationConfig;
    const globalPrefix = normalizeRoutePath(appConfig?.getGlobalPrefix() ?? ''),
      graphqlPath = normalizeRoutePath(this.configService.get<string>('graphql.path', '/graphql'));

    consumer
      .apply(I18nMiddleware)
      // exclude routes
      // .exclude()
      .forRoutes(`${globalPrefix}${graphqlPath}`, `${globalPrefix}/api/*`);
  }
}
