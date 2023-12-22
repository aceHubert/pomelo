import * as path from 'path';
import * as fs from 'fs';
import { APP_PIPE, APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import {
  Logger,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
  OnModuleInit,
  MiddlewareConsumer,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  I18nModule,
  I18nService,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  CookieResolver,
  GraphQLWebsocketResolver,
} from 'nestjs-i18n';
import { OidcModule } from 'nest-oidc-provider';
import { IdentityModule } from '@ace-pomelo/identity-datasource';
import { InfrastructureModule } from '@ace-pomelo/infrastructure-datasource';
import { configuration } from './common/utils/configuration.util';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
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
      load: [configuration(process.cwd())],
    }),
    I18nModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isDebug = config.get('debug', false);
        const contentPath = path.join(config.getOrThrow<string>('contentPath'), '/languages/identity-server');
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
          viewEngine: 'ejs',
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
    InfrastructureModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService, i18n: I18nService) => ({
        isGlobal: true,
        connection: config.getOrThrow('database.infrastructure.connection'),
        tablePrefix: config.get('database.infrastructure.tablePrefix', ''),
        translate: i18n.tv.bind(i18n),
      }),
      inject: [ConfigService, I18nService],
    }),
    IdentityModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService, i18n: I18nService) => ({
        isGlobal: true,
        connection: config.getOrThrow('database.identity.connection'),
        tablePrefix: config.get('database.identity.tablePrefix', ''),
        translate: i18n.tv.bind(i18n),
      }),
      inject: [ConfigService, I18nService],
    }),
    AccountModule,
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
        return new ValidationPipe({
          enableDebugMessages: isDebug,
          stopAtFirstError: true,
        });
      },
      inject: [ConfigService],
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthorizedGuard,
    // },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(private adapter: HttpAdapterHost, private readonly i18n: I18nService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: any) => {
        let lang;
        const requestAccept = req.headers['accept'];
        if (requestAccept && requestAccept.includes('text/html') && (lang = req.query.lang || req.query.locale)) {
          const resolveLang = this.i18n.resolveLanguage(lang);
          if (['en-US', ...this.i18n.getSupportedLanguages()].includes(resolveLang)) {
            res.cookie('locale', resolveLang, { httpOnly: true });
            logger.debug(`Set locale to ${resolveLang}`);
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
}
