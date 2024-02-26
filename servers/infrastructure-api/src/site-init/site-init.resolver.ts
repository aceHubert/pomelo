import { HttpAdapterHost } from '@nestjs/core';
import { Resolver, Context, Query, Mutation, Args } from '@nestjs/graphql';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { IgnoreDbCheckInterceptor } from '@/common/interceptors/db-check.interceptor';
import { SiteInitService } from './site-init.service';
import { SiteInitArgsInput } from './dto/init-args.input';

@IgnoreDbCheckInterceptor()
@Resolver()
export class SiteInitResolver extends BaseResolver {
  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly dbInitService: SiteInitService) {
    super();
  }

  @Query(() => Boolean, { description: 'It is required to initial database before running site.' })
  checkSiteInitialRequired() {
    return this.dbInitService.initialRequired();
  }

  @Mutation(() => Boolean, { description: 'Sync database and initialize datas if database has not been initialized' })
  async startSiteInitial(
    @Args('model', { type: () => SiteInitArgsInput }) initArgs: SiteInitArgsInput,
    @Context('req') request: any,
  ) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();
    let siteUrl = '';
    if (platformName === 'express') {
      siteUrl = `${request.protocol}://${request.get('host')}`;
    } else {
      // else if (platformName === 'fastify') {
      this.logger.warn(`server platform "${platformName}" is not support!`);
    }

    try {
      await this.dbInitService.initialize({
        ...initArgs,
        siteUrl,
      });

      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }
}
