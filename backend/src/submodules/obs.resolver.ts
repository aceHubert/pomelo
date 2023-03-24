import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { ObsSubModuleService } from './obs.service';

// Types
import { PagedObsSubModuleArgs } from './dto/paged-sub-module.args';
import { ObsSubModuleModel, ObsSubModuleManifestModel, PagedObsSubModuleModel } from './models/submodule.model';

@Resolver(() => ObsSubModuleModel)
export class ObsSubModuleResolver extends BaseResolver {
  constructor(private readonly obsService: ObsSubModuleService) {
    super();
  }

  @Query((returns) => PagedObsSubModuleModel, { description: 'Get paged micro front-end sub modules.' })
  async obsSubModules(@Args() args: PagedObsSubModuleArgs): Promise<PagedObsSubModuleModel> {
    const { objects, nextMarker } = await this.obsService.getPaged(args);

    return {
      rows: objects,
      nextMarker,
    };
  }

  @Query((returns) => ObsSubModuleManifestModel, { nullable: true, description: 'Get sub-module manifest.' })
  async obsSubModuleManifest(
    @Args('name', { description: 'package name' }) name: string,
    @Args('version', { nullable: true, description: 'package version (default: `latest`)' }) version?: string,
  ): Promise<ObsSubModuleManifestModel | undefined> {
    const manifest = await this.obsService.getManifest(name, version);

    if (manifest) {
      const { name: pkgName, description, version: pkgVersion, main, configuration, readme, readmeFilename } = manifest;
      return {
        name: pkgName,
        description,
        version: pkgVersion,
        main,
        configuration,
        readme,
        readmeFilename,
      };
    }
    return;
  }

  @Query((returns) => ObsSubModuleModel, { nullable: true, description: 'Get sub-module model.' })
  async obsSubModule(
    @Args('name', { description: 'package name' }) name: string,
  ): Promise<ObsSubModuleModel | undefined> {
    const model = await this.obsService.get(name);

    if (model) {
      const { name: pkgName, description, time } = model;
      return {
        name: pkgName,
        description,
        versions: Object.entries(time).map(([version, createdAt]) => ({ version, createdAt })),
      };
    }
    return;
  }
}
