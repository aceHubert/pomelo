import { Injectable, Inject } from '@nestjs/common';
import { trailingSlash } from '../common/utils/path.util';
import { HWCloudObsService } from '../files/obs.service';
import { ObsCommonError } from '../files/errors/ObsCommonError';
import { SUBMODULE_OPTIONS } from './constants';

// Types
import { PackageJSON } from 'query-registry';
import { ObsSubModuleOptions } from './interfaces/submodule-options.interface';
import { PagedObsSubModuleArgs } from './interfaces/submodule-args.interface';
import { SubModuleConfig } from './interfaces/submodule-config.interface';
import { jsonSafeParse } from '@/common/utils/json-safe-parse.util';

@Injectable()
export class ObsSubModuleService {
  //   private readonly logger = new Logger(SubModuleService.name, { timestamp: true });

  constructor(
    @Inject(SUBMODULE_OPTIONS) private readonly options: ObsSubModuleOptions,
    private readonly hwCloudObsService: HWCloudObsService,
  ) {}

  private get trailingSlashPrefix() {
    return this.options.prefix ? trailingSlash(this.options.prefix) : '';
  }

  /**
   * search for packages
   */
  async getPaged(query: PagedObsSubModuleArgs) {
    const { name, limit = 20, marker } = query;

    const { prefixes = [], nextMarker } = await this.hwCloudObsService.listObjects({
      bucket: this.options.bucket,
      prefix: `${this.trailingSlashPrefix}${name || ''}`,
      marker,
      maxKeys: limit,
      delimiter: '@',
    });

    return {
      objects: await Promise.all(
        prefixes.map(async (item) => {
          const name = item
            .substring(0, item.length - 1) // delimiter 会在最后一位
            .split('/')
            .filter(Boolean)
            .at(-1)!;

          const model = await this.get(name);

          return {
            name: model!.name,
            description: model!.description,
            version: model!.version,
          };
        }),
      ),
      nextMarker,
    };
  }

  /**
   * get package mainfest
   */
  async getManifest(
    name: string,
    version?: string,
  ): Promise<(PackageJSON & { configuration?: SubModuleConfig | Record<string, SubModuleConfig> }) | undefined> {
    let prefix: string;
    if (!version) {
      const { prefixes = [] } = await this.hwCloudObsService.listObjects({
        bucket: this.options.bucket,
        prefix: `${this.options.prefix || ''}${name}`,
        delimiter: '/',
      });

      if (!prefixes.length) {
        return;
      }

      prefix = prefixes.at(-1)!;
    } else {
      prefix = `${this.trailingSlashPrefix}${name}@${version}/`;
    }

    try {
      const { content: pkgFile } = await this.hwCloudObsService.getObject({
        bucket: this.options.bucket,
        key: `${prefix}package.json`,
      });

      const manifest = jsonSafeParse<PackageJSON>(pkgFile as string);
      if (manifest) {
        const readmeKey = `${prefix}README.md`;
        const { content: readme } = await this.hwCloudObsService
          .getObject({
            bucket: this.options.bucket,
            key: readmeKey,
          })
          .catch(() => {
            return { content: '' };
          });

        return { ...manifest, readme: readme as string, readmeFilename: readmeKey };
      }
      return;
    } catch (err) {
      if (err instanceof ObsCommonError && err.code === 'NoSuchKey') {
        return;
      }
      throw err;
    }
  }

  async get(name: string): Promise<
    | {
        name: string;
        description?: string;
        version: string;
        time: Record<string, string>;
      }
    | undefined
  > {
    const { prefixes = [] } = await this.hwCloudObsService.listObjects({
      bucket: this.options.bucket,
      prefix: `${this.trailingSlashPrefix}${name}`,
      delimiter: '/',
    });

    if (!prefixes.length) {
      return;
    }

    try {
      const { content: pkgFile } = await this.hwCloudObsService.getObject({
        bucket: this.options.bucket,
        key: `${prefixes.at(-1)!}package.json`,
      });

      const mainfest = jsonSafeParse<PackageJSON>(pkgFile as string);

      if (mainfest) {
        return {
          name: mainfest.name,
          description: mainfest.description,
          version: mainfest.version,
          time: prefixes.reduce((prev, prefix) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, version] = prefix
              .substring(0, prefix.length - 1) // delimiter 会在最后一位
              .split('/')
              .filter(Boolean)
              .at(-1)!
              .split('@');
            prev[version] = '';
            return prev;
          }, {} as Record<string, string>),
        };
      }

      return;
    } catch (err) {
      if (err instanceof ObsCommonError && err.code === 'NoSuchKey') {
        return;
      }
      throw err;
    }
  }
}
