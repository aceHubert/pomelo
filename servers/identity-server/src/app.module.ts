import * as path from 'path';
import * as fs from 'fs';
import { APP_PIPE, APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { Logger, Module, NestModule, RequestMethod, OnModuleInit, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  I18nModule,
  I18nService,
  I18nContext,
  I18nValidationPipe,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  CookieResolver,
  GraphQLWebsocketResolver,
} from 'nestjs-i18n';
import { OidcModule } from 'nest-oidc-provider';
import { normalizeRoutePath } from '@ace-pomelo/shared-server';
import { IdentityModule } from '@ace-pomelo/identity-datasource';
import { InfrastructureModule } from '@ace-pomelo/infrastructure-datasource';
import { configuration } from './common/utils/configuration.util';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { StorageModule, STORAGE_OPTIONS, StorageOptions, RedisStorage, MemeryStorage } from './storage';
import { AccountProviderModule } from './account-provider/account-provider.module';
import { AccountConfigService } from './account-config/account-config.service';
import { OidcConfigModule } from './oidc-config/oidc-config.module';
import { OidcConfigService } from './oidc-config/oidc-config.service';
import { AccountModule } from './account/account.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envFilePaths } from './db.sync';

// extends
// eslint-disable-next-line import/order
import '@/common/extends/i18n.extend';

const logger = new Logger('AppModule', { timestamp: true });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths,
      load: [configuration()],
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
    InfrastructureModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => ({
        isGlobal: true,
        connection: config.getOrThrow('database.infrastructure.connection'),
        tablePrefix: config.get('database.infrastructure.tablePrefix', ''),
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
    IdentityModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => ({
        isGlobal: true,
        connection: config.getOrThrow('database.identity.connection'),
        tablePrefix: config.get('database.identity.tablePrefix', ''),
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
    AccountProviderModule.forRootAsync({
      isGlobal: true,
      imports: [InfrastructureModule],
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
      useFactory: (config: ConfigService, storageOptions: StorageOptions) => ({
        debug: config.get('debug', false),
        issuer: `${config.getOrThrow('ORIGIN')}${normalizeRoutePath(
          config.get<string>('webServer.globalPrefixUri', ''),
        )}`,
        path: normalizeRoutePath(config.get('OIDC_PATH', '')),
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
