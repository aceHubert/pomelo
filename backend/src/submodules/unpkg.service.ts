import { Injectable, Inject } from '@nestjs/common';
import { getPackument, getPackageManifest, searchPackages } from 'query-registry';
import { SUBMODULE_OPTIONS } from './constants';

// Types
import { SearchResults, Packument, PackageManifest } from 'query-registry';
import { UnpkgSubModuleOptions } from './interfaces/submodule-options.interface';
import { PagedSubModuleArgs } from './interfaces/submodule-args.interface';
import { SubModuleConfig } from './interfaces/submodule-config.interface';

@Injectable()
export class UnpkgSubModuleService {
  //   private readonly logger = new Logger(SubModuleService.name, { timestamp: true });

  constructor(@Inject(SUBMODULE_OPTIONS) private readonly options: UnpkgSubModuleOptions) {}

  /**
   * search for packages
   */
  getPaged(query: PagedSubModuleArgs): Promise<SearchResults> {
    const { name, limit = 20, offset = 0 } = query;

    const keywords = this.options.keywords;
    name && keywords.unshift(name);

    return searchPackages({
      query: {
        text: `keywords:${keywords.join('+')}+${name}`,
        size: limit,
        from: offset,
      },
      registry: this.options.registry,
      mirrors: this.options.mirrors,
      cached: this.options.cached,
    });
  }

  /**
   * get package mainfest
   */
  async getManifest(
    name: string,
    version?: string,
  ): Promise<PackageManifest & { configuration?: SubModuleConfig | Record<string, SubModuleConfig> }> {
    return getPackageManifest({
      name,
      version,
      registry: this.options.registry,
      mirrors: this.options.mirrors,
      cached: this.options.cached,
    });
  }

  /**
   * get packument
   */
  get(name: string): Promise<Packument> {
    return getPackument({
      name,
      registry: this.options.registry,
      mirrors: this.options.mirrors,
      cached: this.options.cached,
    });
  }
}
