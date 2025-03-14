import { ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Query, Param, Scope } from '@nestjs/common';
// import { I18n, I18nContext } from 'nestjs-i18n';
import { ParseQueryPipe, createResponseSuccessType } from '@ace-pomelo/shared/server';
import { UnpkgSubModuleService } from './unpkg.service';
import { SubModuleModelResp, SubModuleManifestModelResp, PagedSubModuleModelResp } from './resp/submodule-model.resp';
import { PagedSubModuleQueryDto } from './dto/paged-sub-module-query.dto';

@ApiTags('submodules')
@Controller({ path: 'api/submodules/unpkg', scope: Scope.REQUEST })
export class UnpkgSubModuleController {
  constructor(private readonly unpkgService: UnpkgSubModuleService) {}

  /**
   * Search package by keywords or package name
   */
  @Get()
  @ApiOkResponse({
    description: 'Paged micro front-end sub modules.',
    type: () => createResponseSuccessType({ data: PagedSubModuleModelResp }, 'PagedSubModuleSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedSubModuleQueryDto) {
    const { objects, total } = await this.unpkgService.getPaged(query);

    return {
      success: true,
      data: {
        rows: objects.map((item) => {
          return {
            name: item.package.name,
            description: item.package.description,
            version: item.package.version,
            publisher: item.package.publisher,
            createdAt: item.package.date,
          };
        }),
        total,
      },
    };
  }

  /**
   * Get sub-module manifest
   */
  @Get(':name/manifest')
  @ApiQuery({ name: 'version', required: false })
  @ApiOkResponse({
    description: 'Sub-module manifest.',
    type: () => createResponseSuccessType({ data: SubModuleManifestModelResp }, 'SubModuleManifestModelSuccessResp'),
  })
  async getManifest(@Param('name') name: string, @Query('version') version?: string) {
    const {
      _id: id,
      name: pkgName,
      description,
      version: pkgVersion,
      main,
      publisher,
      dist: { tarball, fileCount, unpackedSize },
      configuration,
      createdAt,
    } = await this.unpkgService.getManifest(name, version);

    return {
      success: true,
      data: {
        id,
        name: pkgName,
        description,
        version: pkgVersion,
        main,
        publisher,
        dist: {
          tarball,
          fileCount,
          unpackedSize,
        },
        configuration,
        createdAt,
      },
    };
  }

  /**
   * Get sub-module model.
   */
  @Get(':name')
  @ApiOkResponse({
    description: 'Sub-module model.',
    type: () => createResponseSuccessType({ data: SubModuleModelResp }, 'SubModuleModelSuccessResp'),
  })
  async get(@Param('name') name: string) {
    const {
      _id: id,
      name: pkgName,
      description,
      time,
      distTags,
      readme,
      readmeFilename,
    } = await this.unpkgService.get(name);

    return {
      success: true,
      data: {
        id,
        name: pkgName,
        description,
        tags: Object.entries(distTags).map(([name, version]) => ({ name, version })),
        versions: Object.entries(time).map(([version, createdAt]) => ({ version, createdAt })),
        readme,
        readmeFilename,
      },
    };
  }
}
