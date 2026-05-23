import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Anonymous, Authorized } from '@ace-nestjs/authorization';
import { RamAuthorized } from '@ace-nestjs/ram-authorization';
import { RequestUser, User } from '@ace-pomelo/shared/server';
import { RuntimeExtensionAction } from '@/common/actions';
import { RestartRuntimeInput, UpdateRuntimePluginsInput } from './dto/update-runtime-plugins.input';
import {
  RestartRuntimePayloadModel,
  RuntimeExtensionStateModel,
  SystemHeartbeatModel,
  UpdateRuntimePluginsPayloadModel,
} from './models/runtime-extension.model';
import { RuntimeExtensionService } from './runtime-extension.service';

@Authorized()
@Resolver()
export class RuntimeExtensionResolver {
  constructor(private readonly runtimeExtensionService: RuntimeExtensionService) {}

  @Anonymous()
  @Query(() => SystemHeartbeatModel, { description: 'Get system heartbeat.' })
  systemHeartbeat() {
    return this.runtimeExtensionService.getHeartbeat();
  }

  @RamAuthorized(RuntimeExtensionAction.List)
  @Query(() => RuntimeExtensionStateModel, { description: 'Get runtime extension state.' })
  runtimeExtensions() {
    return this.runtimeExtensionService.getState();
  }

  @RamAuthorized(RuntimeExtensionAction.Update)
  @Mutation(() => UpdateRuntimePluginsPayloadModel, { description: 'Update runtime plugin options.' })
  updateRuntimePlugins(@Args('model') model: UpdateRuntimePluginsInput, @User() requestUser: RequestUser) {
    return this.runtimeExtensionService.updatePlugins(model, requestUser);
  }

  @RamAuthorized(RuntimeExtensionAction.Restart)
  @Mutation(() => RestartRuntimePayloadModel, { description: 'Restart BFF process.' })
  restartSystem(@Args('model', { nullable: true }) model?: RestartRuntimeInput) {
    return this.runtimeExtensionService.restart(model);
  }
}
