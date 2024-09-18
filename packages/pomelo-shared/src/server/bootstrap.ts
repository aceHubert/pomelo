import { NestFactory } from '@nestjs/core';
import { Logger, INestApplication, NestHybridApplicationOptions } from '@nestjs/common';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import {
  SwaggerModule,
  DocumentBuilder,
  OpenAPIObject,
  SwaggerDocumentOptions,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { MicroserviceOptions } from '@nestjs/microservices';

export interface SwaggerSimpleOptions {
  path: string;
  title: string;
  description: string;
  version?: string;
  tags?: Record<string, string>;
  documentOptions?: SwaggerDocumentOptions;
}

export interface BootstrapOptions {
  /**
   * The host the application will listen to.
   */
  host?: string;
  /**
   * The port the application will listen to.
   * @default 3000
   */
  port?: number;
  /**
   * Global prefix for all routes.
   */
  prefix?: string;
  /**
   * Enable cors for the application.
   * @default false
   */
  cors?: boolean | CorsOptions;
  /**
   * Swagger options object
   */
  swagger?: (
    | SwaggerSimpleOptions
    | ({
        configFactory: () => Omit<OpenAPIObject, 'paths'>;
      } & Pick<SwaggerSimpleOptions, 'path' | 'documentOptions'>)
  ) &
    SwaggerCustomOptions;
  /**
   * Microservice options object
   */
  microserviceService?: MicroserviceOptions;
  /**
   * Hybrid options object
   */
  hybridOptions?: NestHybridApplicationOptions;
}

export async function bootstrap<NestApplication extends INestApplication<any> = INestApplication<any>>(
  AppModule: any,
  options: (
    | BootstrapOptions
    | { optionsFactory: (app: NestApplication) => Promise<BootstrapOptions> | BootstrapOptions }
  ) &
    NestApplicationOptions,
) {
  let optionsFactory: ((app: NestApplication) => Promise<BootstrapOptions> | BootstrapOptions) | undefined,
    nestApplicationOptions: NestApplicationOptions = {},
    host: string | undefined,
    port: number | undefined,
    prefix: string | undefined,
    cors: BootstrapOptions['cors'],
    swagger: BootstrapOptions['swagger'],
    microserviceOptions: BootstrapOptions['microserviceService'],
    hybridOptions: BootstrapOptions['hybridOptions'];
  if (Object.hasOwn(options, 'optionsFactory')) {
    ({ optionsFactory, ...nestApplicationOptions } = options as {
      optionsFactory: (app: NestApplication) => Promise<BootstrapOptions> | BootstrapOptions;
    } & NestApplicationOptions);
  } else {
    ({
      host,
      port,
      prefix,
      cors = false,
      swagger,
      microserviceService: microserviceOptions,
      hybridOptions,
      ...nestApplicationOptions
    } = options as BootstrapOptions & NestApplicationOptions);
  }

  const app = await NestFactory.create<NestApplication>(AppModule, nestApplicationOptions);

  optionsFactory &&
    ({
      host,
      port,
      prefix,
      cors = false,
      swagger,
      microserviceService: microserviceOptions,
      hybridOptions,
    } = await optionsFactory(app));

  const logger = new Logger('Bootstrap', { timestamp: true });

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // add grobal prefix
  prefix && app.setGlobalPrefix(prefix);

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

  // swagger
  if (swagger) {
    let path = '/doc',
      config: Omit<OpenAPIObject, 'paths'>,
      configFactory: (() => Omit<OpenAPIObject, 'paths'>) | undefined,
      documentOptions: SwaggerDocumentOptions | undefined,
      customOptions: SwaggerCustomOptions | undefined;
    if (Object.hasOwn(swagger, 'configFactory')) {
      ({ configFactory, path, documentOptions, ...customOptions } = swagger as {
        configFactory: () => Omit<OpenAPIObject, 'paths'>;
      } & Pick<SwaggerSimpleOptions, 'path' | 'documentOptions'> &
        SwaggerCustomOptions);
      config = configFactory();
    } else {
      let title: string, description: string, version: string | undefined, tags: Record<string, string> | undefined;
      ({ path, title, description, version, tags, documentOptions, ...customOptions } =
        swagger as SwaggerSimpleOptions & SwaggerCustomOptions);

      const document = new DocumentBuilder().setTitle(title).setDescription(description);
      version && document.setVersion(version);
      tags && Object.keys(tags).forEach((name) => document.addTag(name, tags![name]));
      config = document.build();
    }
    const document = SwaggerModule.createDocument(app, config, documentOptions);
    SwaggerModule.setup(path, app, document, customOptions);
    logger.debug(`swigger is enabled with path: ${path}`);
  }

  // microservice
  if (microserviceOptions) {
    app.connectMicroservice<MicroserviceOptions>(microserviceOptions, hybridOptions);
    await app.startAllMicroservices();
    logger.debug(`microservice is started`);
  }

  await app.listen(port || 3000, host || '');
  logger.log(`Service is running on: ${await app.getUrl()}${prefix ? ' with global prefix: ' + prefix : ''}`);

  return app;
}
