import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { MisdirectedStatus } from '../interfaces/misdirected-status.enum';
import { renderMsgPage } from '../templates';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const { body, headers, method, params, query, url, user } = request;

    this.logger.warn({ request: { body, headers, method, params, query, url, user }, exception });

    switch (status) {
      case MisdirectedStatus.MISDIRECTED:
        const requestedTenant = request.params.tenantId;
        const requestedChannel = request.params.channelType;
        const originalTenant = request.user.userinfo.tenant;
        const originalChannel = request.user.userinfo.channel;
        response.redirect(
          `/tenant-switch-warn?requestedTenant=${requestedTenant}&requestedChannel=${requestedChannel}&originalTenant=${originalTenant}&originalChannel=${originalChannel}`,
        );
        break;

      case HttpStatus.INTERNAL_SERVER_ERROR:
      case HttpStatus.NOT_IMPLEMENTED:
      case HttpStatus.BAD_GATEWAY:
      case HttpStatus.SERVICE_UNAVAILABLE:
      case HttpStatus.GATEWAY_TIMEOUT:
      case HttpStatus.HTTP_VERSION_NOT_SUPPORTED:
        const errorPage = renderMsgPage({
          title: `We are sorry, we have encountered an error`,
          subtitle: `Error ${status}`,
          description: exception.message,
          redirect: {
            link: '/',
            label: 'Retry',
            type: 'button',
          },
        });
        response.send(errorPage);
        break;

      default:
        response.status(status).json(exception['response']);
        break;
    }
  }
}
