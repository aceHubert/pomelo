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
  const globalPrefix = normalizeRoutePath(configService.get<string>('webServer.globalPrefixUri', ''));
  const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // enable cors
  if (cors) {
    if (cors === true) {
      app.enableCors();
      logger.debug('cors is enabled');
    } else {
      app.enableCors(cors);
      logger.debug('cors is enabled', cors);
    }
  }

  // add grobal prefix
  app.setGlobalPrefix(globalPrefix);

  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', (addr: string, i: number) => {
    logger.debug(`trust proxy, addr: ${addr}, i: ${i}`);
    return true;
  });

  // set application/x-www-form-urlencoded body parser
  app.use(urlencoded({ extended: false }));

  // set layout
  app
    .use(expressEjsLayout)
    .useStaticAssets(join(__dirname, '../', 'public'), {
      // https://github.com/nestjs/serve-static/issues/1280
      prefix: globalPrefix,
    })
    .setBaseViewsDir(join(__dirname, '../', 'views'))
    .setLocal('title', 'Pomelo Identity Server')
    .setLocal('baseURL', `${globalPrefix}/`)
    .set('view engine', 'ejs')
    .set('layout', 'layouts/default')
    .set('layout extractScripts', true)
    .set('layout extractStyles', true)
    .set('layout extractMetas', true);

  await app.listen(port, host);
  logger.log(
    `Application is running on: ${await app.getUrl()}${globalPrefix ? ' with global prefix: ' + globalPrefix : ''}`,
  );
  logger.log(
    `OpenID-Connect discovery endpoint: ${await app.getUrl()}${globalPrefix}/.well-known/openid-configuration`,
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
    logger.error(err, err.stack);
    process.exit(1);
  });
