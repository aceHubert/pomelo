import { HttpAdapterHost } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Resolver, Context, Query, Mutation, Args } from '@nestjs/graphql';
import { INFRASTRUCTURE_SERVICE, SiteInitPattern } from '@ace-pomelo/shared/server';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { SiteInitArgsInput } from './dto/init-args.input';

@Resolver()
export class SiteInitResolver extends BaseResolver {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(INFRASTRUCTURE_SERVICE) private readonly basicService: ClientProxy,
  ) {
    super();
  }

  @Query(() => Boolean, { description: 'It is required to initial site before running.' })
  checkSiteInitialRequired(): Promise<boolean> {
    return this.basicService.send<boolean>(SiteInitPattern.IsRequired, {}).lastValue();
  }

  @Mutation(() => Boolean, { description: 'Start to initialize site datas.' })
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
      await this.basicService
        .send<void>(SiteInitPattern.Start, {
          ...initArgs,
          siteUrl,
        })
        .lastValue();

      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }
}
