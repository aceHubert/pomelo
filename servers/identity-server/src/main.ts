import { join } from 'path';
import { urlencoded } from 'body-parser';
import { default as expressEjsLayout } from 'express-ejs-layouts';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { normalizeRoutePath } from '@ace-pomelo/shared-server';
import { AppModule } from './app.module';
import { syncDatabase } from './db.sync';

declare const module: any;

const logger = new Logger('Main', { timestamp: true });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const host = configService.get<string>('webServer.host', '');
  const port = configService.get<number>('webServer.port', 3000);
  const globalPrefixUri = normalizeRoutePath(configService.get<string>('webServer.globalPrefixUri', ''));
  const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);
  const oidcPath = normalizeRoutePath(configService.get<string>('OIDC_PATH', '/oidc'));

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // set application/x-www-form-urlencoded body parser
  app.use(urlencoded({ extended: false }));

  // set layout
  app.use(expressEjsLayout);
  app.useStaticAssets(join(__dirname, '../', 'public'));
  app.setBaseViewsDir(join(__dirname, '../', 'views'));
  app.set('view engine', 'ejs');
  app.set('layout', 'layouts/default');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);
  app.set('layout extractMetas', true);

  // enable cors
  if (cors) {
    cors === true ? app.enableCors() : app.enableCors(cors);
  }

  // add grobal prefix
  app.setGlobalPrefix(globalPrefixUri);

  await app.listen(port, host);
  logger.log(
    `Application is running on: ${await app.getUrl()}${
      globalPrefixUri ? ' with global prefix: ' + globalPrefixUri : ''
    }`,
  );
  !!cors && logger.log('cors is enabled');
  logger.log(
    `OpenID-Connect discovery endpoint: ${await app.getUrl()}${globalPrefixUri}${oidcPath}/.well-known/openid-configuration`,
  );

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

syncDatabase()
  .then(() => {
    // start
    bootstrap().then(() => null);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
