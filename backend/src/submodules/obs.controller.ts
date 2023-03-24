import { ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Query, Param, Scope } from '@nestjs/common';
// import { I18n, I18nContext } from 'nestjs-i18n';
import { BaseController } from '@/common/controllers/base.controller';
import { ParseQueryPipe } from '@/common/pipes/parse-query.pipe';
import { createResponseSuccessType, describeType } from '@/common/utils/swagger-type.util';
import { ObsSubModuleService } from './obs.service';

// Types
import { PagedObsSubModuleQueryDto } from './dto/paged-sub-module-query.dto';
import {
  ObsSubModuleModelResp,
  ObsSubModuleManifestModelResp,
  PagedObsSubModuleModelResp,
} from './resp/submodule-model.resp';

@ApiTags('submodules')
@Controller({ path: 'api/submodules/obs', scope: Scope.REQUEST })
export class ObsSubModuleController extends BaseController {
  constructor(private readonly obsService: ObsSubModuleService) {
    super();
  }

  /**
   * Search package by keywords or package name
   */
  @Get()
  @ApiOkResponse({
    description: 'Paged micro front-end sub modules.',
    type: () => createResponseSuccessType({ data: PagedObsSubModuleModelResp }, 'PagedObsSubModuleSuccessResp'),
  })
  async getPaged(
    @Query(ParseQueryPipe) query: PagedObsSubModuleQueryDto,
  ): Promise<{ data: PagedObsSubModuleModelResp }> {
    const { objects, nextMarker } = await this.obsService.getPaged(query);

    return this.success({
      data: {
        rows: objects,
        nextMarker,
      },
    });
  }

  /**
   * Get sub-module manifest
   */
  @Get(':name/manifest')
  @ApiQuery({ name: 'version', required: false })
  @ApiOkResponse({
    description: 'Sub-module manifest.',
    type: () =>
      createResponseSuccessType(
        { data: describeType(ObsSubModuleManifestModelResp, { nullable: true }) },
        'ObsSubModuleManifestModelSuccessResp',
      ),
  })
  async getManifest(
    @Param('name') name: string,
    @Query('version') version?: string,
  ): Promise<ResponseOf<{ data: ObsSubModuleManifestModelResp }>> {
    const manifest = await this.obsService.getManifest(name, version);

    if (manifest) {
      const { name: pkgName, description, version: pkgVersion, main, configuration, readme, readmeFilename } = manifest;

      return this.success({
        data: {
          name: pkgName,
          description,
          version: pkgVersion,
          main,
          configuration,
          readme,
          readmeFilename,
        },
      });
    }
    return this.faild(`${name} not exists!`);
  }

  /**
   * Get sub-module model.
   */
  @Get(':name')
  @ApiOkResponse({
    description: 'Sub-module model.',
    type: () =>
      createResponseSuccessType(
        { data: describeType(ObsSubModuleModelResp, { nullable: true }) },
        'ObsSubModuleModelSuccessResp',
      ),
  })
  async get(@Param('name') name: string): Promise<ResponseOf<{ data: ObsSubModuleModelResp }>> {
    const mode = await this.obsService.get(name);

    if (mode) {
      const { name: pkgName, description, time } = mode;

      return this.success({
        data: {
          name: pkgName,
          description,
          versions: Object.entries(time).map(([version, createdAt]) => ({ version, createdAt })),
        },
      });
    }
    return this.faild(`${name} not exists!`);
  }
}
