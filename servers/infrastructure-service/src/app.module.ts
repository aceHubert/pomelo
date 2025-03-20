import * as path from 'path';
import * as fs from 'fs';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I18nModule, I18nService, I18nValidationPipe } from 'nestjs-i18n';
import { Log4jsModule, LOG4JS_NO_COLOUR_DEFAULT_LAYOUT } from '@ace-pomelo/nestjs-log4js';
import { configuration } from '@ace-pomelo/shared/server';
import { InfrastructureDatasourceModule } from '@/datasource/datasource.module';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { DbCheckInterceptor } from './common/interceptors/db-check.interceptor';
import { I18nTcpResolver } from './common/utils/i18n-server-tcp.util';
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

// extends
// eslint-disable-next-line import/order
import '@/common/extends/i18n.extend';

@Module({
  imports: [
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
        const logDir = config.get('LOG_FILENAME_DIR', path.join(config.getOrThrow<string>('contentPath'), '../logs'));
        return {
          isGlobal: true,
          appenders: {
            dateFile: {
              type: 'dateFile',
              keepFileExt: true,
              filename: path.join(logDir, '/infrastructure-service.log'),
              layout: LOG4JS_NO_COLOUR_DEFAULT_LAYOUT,
            },
          },
          categories: {
            default: {
              enableCallStack: isDebug,
              appenders: ['stdout', 'dateFile'],
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
        };
      },
      resolvers: [new I18nTcpResolver(['lang', 'locale'])],
      inject: [ConfigService],
    }),
    InfrastructureDatasourceModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService, i18n: I18nService) => ({
        isGlobal: true,
        connection: config.get('INFRASTRUCTURE_DATABASE_CONNECTION')
          ? config.get<string>('INFRASTRUCTURE_DATABASE_CONNECTION')!
          : {
              database: config.getOrThrow('INFRASTRUCTURE_DATABASE_NAME'),
              username: config.getOrThrow('INFRASTRUCTURE_DATABASE_USERNAME'),
              password: config.getOrThrow('INFRASTRUCTURE_DATABASE_PASSWORD'),
              dialect: config.get('INFRASTRUCTURE_DATABASE_DIALECT', 'mysql'),
              host: config.get('INFRASTRUCTURE_DATABASE_HOST', 'localhost'),
              port: config.get('INFRASTRUCTURE_DATABASE_PORT', 3306),
              define: {
                charset: config.get('INFRASTRUCTURE_DATABASE_CHARSET', 'utf8'),
                collate: config.get('INFRASTRUCTURE_DATABASE_COLLATE', ''),
              },
            },
        tablePrefix: config.get('TABLE_PREFIX'),
        translate: (key, fallback, args) =>
          i18n.translate(key, {
            defaultValue: fallback,
            args,
          }),
      }),
      inject: [ConfigService, I18nService],
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
