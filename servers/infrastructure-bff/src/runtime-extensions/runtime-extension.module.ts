import { DynamicModule, Module } from '@nestjs/common';
import { OptionModule } from '@/options/option.module';
import { RUNTIME_EXTENSION_CONTEXT } from './constants';
import { RuntimeExtensionContext } from './interfaces/runtime-extension.interface';
import { RuntimeExtensionController } from './runtime-extension.controller';
import { RuntimeExtensionResolver } from './runtime-extension.resolver';
import { RuntimeExtensionService } from './runtime-extension.service';

@Module({})
export class RuntimeExtensionModule {
  static register(context: RuntimeExtensionContext): DynamicModule {
    return {
      module: RuntimeExtensionModule,
      imports: [OptionModule],
      controllers: [RuntimeExtensionController],
      providers: [
        {
          provide: RUNTIME_EXTENSION_CONTEXT,
          useValue: context,
        },
        RuntimeExtensionService,
        RuntimeExtensionResolver,
      ],
      exports: [RuntimeExtensionService, RUNTIME_EXTENSION_CONTEXT],
    };
  }
}
