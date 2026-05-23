import { Body, Controller, Get, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Authorized, Anonymous } from '@ace-nestjs/authorization';
import { RamAuthorized } from '@ace-nestjs/ram-authorization';
import {
  ApiAuthCreate,
  createResponseSuccessType,
  RequestUser,
  User,
  ValidatePayloadExistsPipe,
} from '@ace-pomelo/shared/server';
import { RuntimeExtensionAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { RestartRuntimeInput, UpdateRuntimePluginsInput } from './dto/update-runtime-plugins.input';
import { RuntimeExtensionService } from './runtime-extension.service';

@ApiTags('runtime-extensions')
@Authorized()
@Controller()
export class RuntimeExtensionController extends BaseController {
  constructor(private readonly runtimeExtensionService: RuntimeExtensionService) {
    super();
  }

  @Get('api/system/heartbeat')
  @Anonymous()
  @ApiOkResponse({
    description: 'System heartbeat',
    type: () => createResponseSuccessType({ data: {} }, 'SystemHeartbeatSuccessResp'),
  })
  heartbeat() {
    return this.success({
      data: this.runtimeExtensionService.getHeartbeat(),
    });
  }

  @Get('api/runtime-extensions')
  @RamAuthorized(RuntimeExtensionAction.List)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Runtime extension state',
    type: () => createResponseSuccessType({ data: {} }, 'RuntimeExtensionStateSuccessResp'),
  })
  async getState() {
    return this.success({
      data: await this.runtimeExtensionService.getState(),
    });
  }

  @Put('api/runtime-extensions/plugins')
  @RamAuthorized(RuntimeExtensionAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Update plugin options',
    type: () => createResponseSuccessType({ data: {} }, 'UpdateRuntimePluginsSuccessResp'),
  })
  async updatePlugins(
    @Body(ValidatePayloadExistsPipe) input: UpdateRuntimePluginsInput,
    @User() requestUser: RequestUser,
  ) {
    return this.success({
      data: await this.runtimeExtensionService.updatePlugins(input, requestUser),
    });
  }

  @Post('api/system/restart')
  @RamAuthorized(RuntimeExtensionAction.Restart)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Restart accepted',
    type: () => createResponseSuccessType({ data: {} }, 'RestartRuntimeSuccessResp'),
  })
  restart(@Body() input: RestartRuntimeInput = {}) {
    return this.success({
      data: this.runtimeExtensionService.restart(input),
    });
  }
}
