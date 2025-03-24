import { HttpAdapterHost } from '@nestjs/core';
import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Resolver, Context, Query, Mutation, Args } from '@nestjs/graphql';
import { POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { SiteInitServiceClient, SITE_INIT_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/site-init';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { SiteInitArgsInput } from './dto/init-args.input';

@Resolver()
export class SiteInitResolver extends BaseResolver implements OnModuleInit {
  private siteInitServiceClient!: SiteInitServiceClient;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {
    super();
  }

  onModuleInit() {
    this.siteInitServiceClient = this.client.getService<SiteInitServiceClient>(SITE_INIT_SERVICE_NAME);
  }

  @Query(() => Boolean, { description: 'It is required to initial site before running.' })
  async checkSiteInitialRequired(): Promise<boolean> {
    const { value: needInitDates } = await this.siteInitServiceClient.isRequired({}).lastValue();
    return needInitDates;
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
      await this.siteInitServiceClient
        .start({
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
