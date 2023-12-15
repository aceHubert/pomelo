import * as path from 'path';
import * as fs from 'fs';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
// import { print, parse, getIntrospectionQuery } from 'graphql';
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
import { OidcModule } from '@ace-pomelo/nestjs-oidc';
import { AuthorizationModule } from '@ace-pomelo/authorization';
import { RamAuthorizationModule } from '@ace-pomelo/ram-authorization';
import { IdentityModule } from '@ace-pomelo/identity-datasource';
import { configuration } from './common/utils/configuration.utils';
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
          ? ['.env.production.local', '.env.production', '.env']
          : ['.env.development.local', '.env.development']),
      load: [configuration(process.cwd())],
    }),
    I18nModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        const contentPath = path.join(config.getOrThrow<string>('contentPath'), '/languages/identity-api');
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
    IdentityModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService, i18n: I18nService) => ({
        isGlobal: true,
        connection: config.getOrThrow('database.connection'),
        tablePrefix: config.get('database.tablePrefix', ''),
        translate: i18n.tv.bind(i18n),
      }),
      inject: [ConfigService, I18nService],
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
      useFactory: (config: ConfigService) => {
        const isDebug = config.get<boolean>('graphql.debug', false);
        const graphqlPath = config.get<string>('graphql.path', '/graphql');
        return {
          debug: isDebug,
          playground: isDebug,
          introspection: isDebug,
          path: graphqlPath,
          installSubscriptionHandlers: true,
          cache: new InMemoryLRUCache(),
          autoSchemaFile: path.join(__dirname, 'schema.gql'),
          context: async ({ req }: any) => {
            return {
              user: req.user, // from express-jwt
              req, // for nestjs-i18n
            };
          },
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
