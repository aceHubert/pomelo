import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { MisdirectedStatus } from '../interfaces/misdirected-status.enum';
import { filter } from '../utils/conditional-exception-filter';

@Catch(
  filter({
    for: HttpException,
    when: (exception: HttpException) => exception.getStatus() === MisdirectedStatus.MISDIRECTED,
  }),
)
export class MisdirectedExceptionFilter implements ExceptionFilter {
  private logger = new Logger(MisdirectedExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost,
      ctx = host.switchToHttp(),
      request = ctx.getRequest(),
      response = ctx.getResponse();

    this.logger.debug('Misdirected request detected', { params: request.params, user: request.user });
    const requestedTenant = request.params.tenantId;
    const requestedChannel = request.params.channelType;
    const originalTenant = request.user?.profile.tenantId;
    const originalChannel = request.user?.profile.channelType;
    return httpAdapter.redirect(
      response,
      HttpStatus.FOUND,
      `/tenant-switch-warn?requestedTenant=${requestedTenant}&requestedChannel=${requestedChannel}&originalTenant=${originalTenant}&originalChannel=${originalChannel}`,
    );
  }
}
