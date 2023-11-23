import { join } from 'path';
import { urlencoded } from 'body-parser';
import { default as expressEjsLayout } from 'express-ejs-layouts';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { AppModule } from './app.module';

declare const module: any;

const logger = new Logger('Main', { timestamp: true });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const host = configService.get<string>('webServer.host', '');
  const port = configService.get<number>('webServer.port', 3000);
  const globalPrefixUri = configService.get<string>('webServer.globalPrefixUri', '');
  const oidcPath = configService.get<string>('OIDC_PATH', '/oidc');
  const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  app.use(expressEjsLayout);
  app.useStaticAssets(join(__dirname, '../', 'public'));
  app.setBaseViewsDir(join(__dirname, '../', 'views'));
  app.set('view engine', 'ejs');
  app.set('layout', 'layouts/default');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);
  app.set('layout extractMetas', true);

  app.use('/interaction', urlencoded({ extended: false }));

  // enable cors
  if (cors) {
    cors === true ? app.enableCors() : app.enableCors(cors);
  }

  // add grobal prefix
  app.setGlobalPrefix(globalPrefixUri);

  await app.listen(port, host);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  globalPrefixUri && logger.log(`Application's global prefix uri is: ${globalPrefixUri} `);
  logger.log(`Discovery endpoint: ${await app.getUrl()}${oidcPath}/.well-known/openid-configuration`);
  logger.log(`Application is enable cors: ${!!cors}`);

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

// start
bootstrap().then(() => null);
