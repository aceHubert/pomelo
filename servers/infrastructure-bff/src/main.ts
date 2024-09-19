import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { bootstrap, normalizeRoutePath, stripForegoingSlash } from '@ace-pomelo/shared/server';
import { AppModule } from './app.module';
import { version } from './version';

declare const module: any;
const logger = new Logger('Main', { timestamp: true });

// start
let globalPrefix: string, isSwaggerDebug: boolean, swaggerPath: string, isGraphqlDebug: boolean, graphqlPath: string;
bootstrap<NestExpressApplication>(AppModule, {
  optionsFactory: (app) => {
    const configService = app.get(ConfigService);

    const host = configService.get<string>('webServer.host', '');
    const port = configService.get<number>('webServer.port', 3000);
    const cors = configService.get<boolean | CorsOptions>('webServer.cors', false);
    globalPrefix = normalizeRoutePath(configService.get<string>('webServer.globalPrefixUri', ''));
    isSwaggerDebug = configService.get<boolean>('swagger.debug', false);
    swaggerPath = normalizeRoutePath(configService.get<string>('swagger.path', '/doc'));
    isGraphqlDebug = configService.get<boolean>('graphql.debug', false);
    graphqlPath = normalizeRoutePath(configService.get<string>('graphql.path', '/graphql'));

    // https://expressjs.com/en/guide/behind-proxies.html
    app.set('trust proxy', (addr: string, i: number) => {
      logger.debug(`trust proxy, addr: ${addr}, i: ${i}`);
      return true;
    });

    // graphql upload file
    app.use(
      globalPrefix + graphqlPath,
      graphqlUploadExpress({
        maxFileSize: configService.get<number>('upload.maxFileSize'),
        maxFiles: configService.get<number>('upload.maxFiles'),
      }),
    );

    return {
      host,
      port,
      cors,
      prefix: globalPrefix,
      swagger: isSwaggerDebug
        ? {
            path: swaggerPath,
            configFactory: () =>
              new DocumentBuilder()
                .setTitle('Pomelo infrastructure BFF APIs')
                .setDescription(
                  `The RESTful API documentation.<br/>graphql support: <a href="${stripForegoingSlash(
                    graphqlPath,
                  )}" target="_blank">Documentation</a>`,
                )
                .setVersion(version)
                .addBearerAuth()
                .addOAuth2({
                  type: 'oauth2',
                  flows: {
                    authorizationCode: {
                      authorizationUrl: configService.get<string>('OIDC_ISSUER') + '/connect/authorize',
                      tokenUrl: configService.get<string>('OIDC_ISSUER') + '/connect/token',
                      scopes: {
                        openid: 'openid',
                        profile: 'profile',
                      },
                    },
                  },
                  // openIdConnectUrl: configService.get<string>('OIDC_ISSUER') + '/.well-known/openid-configuration',
                })
                .addTag('options', 'Option configs.')
                .addTag('templates', 'Template common actions.')
                .addTag('templates/form', 'From template.')
                .addTag('templates/page', 'Page template.')
                .addTag('templates/post', 'Post template.')
                .addTag('term-taxonomy', 'Term taxonomy.')
                .addTag('user', 'User.')
                .addTag('resources', 'Resources management.')
                // .addTag('submodules', 'Micro front-end sub modules.')
                .build(),
            useGlobalPrefix: true,
            swaggerOptions: {
              initOAuth: {
                clientId: configService.get<string>('OIDC_CLIENT_ID'),
                scopes: ['openid', 'profile'],
              },
            },
          }
        : void 0,
    };
  },
}).then(async (app) => {
  isSwaggerDebug && logger.log(`Swagger server is running on: ${await app.getUrl()}${globalPrefix}${swaggerPath}`);
  isGraphqlDebug && logger.log(`Graphql server is running on: ${await app.getUrl()}${globalPrefix}${graphqlPath}`);

  // hot reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
});
