import { Resolver, Query, Args } from '@nestjs/graphql';
import { UnpkgSubModuleService } from './unpkg.service';
import { PagedSubModuleArgs } from './dto/paged-sub-module.args';
import { SubModuleModel, SubModuleManifestModel, PagedSubModuleModel } from './models/submodule.model';

@Resolver(() => SubModuleModel)
export class UnpkgSubModuleResolver {
  constructor(private readonly unpkgService: UnpkgSubModuleService) {}

  @Query((returns) => PagedSubModuleModel, { description: 'Get paged micro front-end sub modules.' })
  async unpkgSubModules(@Args() args: PagedSubModuleArgs): Promise<PagedSubModuleModel> {
    const { objects, total } = await this.unpkgService.getPaged(args);

    return {
      rows: objects.map((item) => {
        return {
          name: item.package.name,
          description: item.package.description,
          version: item.package.version,
          publisher: item.package.publisher,
          createdAt: new Date(item.package.date),
        };
      }),
      total,
    };
  }

  @Query((returns) => SubModuleManifestModel, { nullable: true, description: 'Get sub-module manifest.' })
  async unpkgSubModuleManifest(
    @Args('name', { description: 'package name' }) name: string,
    @Args('version', { nullable: true, description: 'package version (default: `latest`)' }) version?: string,
  ): Promise<SubModuleManifestModel> {
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
      createdAt: new Date(createdAt),
    };
  }

  @Query((returns) => SubModuleModel, { nullable: true, description: 'Get sub-module model.' })
  async unpkgSubModule(@Args('name', { description: 'package name' }) name: string): Promise<SubModuleModel> {
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
      id,
      name: pkgName,
      description,
      tags: Object.entries(distTags).map(([name, version]) => ({ name, version })),
      versions: Object.entries(time).map(([version, createdAt]) => ({ version, createdAt: new Date(createdAt) })),
      readme,
      readmeFilename,
    };
  }
}
