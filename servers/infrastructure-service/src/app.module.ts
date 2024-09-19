import * as path from 'path';
import * as fs from 'fs';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  I18nModule,
  // I18nMiddleware,
  I18nContext,
  I18nValidationPipe,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
  CookieResolver,
  GraphQLWebsocketResolver,
} from 'nestjs-i18n';
import { InfrastructureDatasourceModule } from '@/datasource/datasource.module';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { DbCheckInterceptor } from './common/interceptors/db-check.interceptor';
import { configuration } from './common/utils/configuration.util';
import { SiteInitController } from './controllers/site-init.controller';
import { CommentController } from './controllers/comment.controller';
import { LinkController } from './controllers/link.controller';
import { MediaController } from './controllers/media.controller';
import { OptionController } from './controllers/option.contrller';
import { TemplateController } from './controllers/template.controller';
import { TermTaxonomyController } from './controllers/term-taxonomy.controller';
import { UserController } from './controllers/user.constroller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envFilePaths } from './db.sync';

// extends
// eslint-disable-next-line import/order
import '@/common/extends/i18n.extend';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths,
      load: [configuration()],
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
    InfrastructureDatasourceModule.registerAsync({
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
  ],
  controllers: [
    AppController,
    SiteInitController,
    CommentController,
    LinkController,
    MediaController,
    OptionController,
    TemplateController,
    TermTaxonomyController,
    UserController,
  ],
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
export class AppModule {}
