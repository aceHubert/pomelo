import { ArgumentsHost, Catch, HttpException, HttpServer, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter as CoreBaseExceptionFilter, AbstractHttpAdapter } from '@nestjs/core';
import { renderMsgPage } from '../templates/index';
import { getContextObject } from '../utils/get-context-object';

@Catch()
export class BaseExceptionFilter extends CoreBaseExceptionFilter {
  protected renderErrorPage = renderMsgPage;
  protected homePath = '/';
  protected i18nRender: (key: string, fallback: string, args?: Record<string, any>) => Promise<string> = (
    key: string,
    fallback: string,
  ) => Promise.resolve(fallback);

  async catch(exception: unknown, host: ArgumentsHost) {
    const applicationRef = this.applicationRef || (this.httpAdapterHost && this.httpAdapterHost.httpAdapter);

    if (!this.isJsonResponse(host)) {
      await this.renderHtmlErrorPage(exception, host, applicationRef!);
    } else {
      super.catch(exception, host);
    }
  }

  protected isJsonResponse(host: ArgumentsHost): boolean {
    const req = getContextObject(host),
      requestAccept = req?.headers['accept'];

    let contentType = 'text/html';
    if (requestAccept && (requestAccept.includes('json') || requestAccept.includes('text/javascript'))) {
      contentType = 'application/json';
    }

    return contentType === 'application/json';
  }

  protected async renderHtmlErrorPage(
    exception: unknown,
    host: ArgumentsHost,
    applicationRef: AbstractHttpAdapter | HttpServer,
  ) {
    const ctx = host.switchToHttp(),
      request = ctx.getRequest(),
      response = ctx.getResponse(),
      status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorTitle = await this.i18nRender('exception.error_title', 'We are sorry, we have encountered an error', {
      status,
    });
    const errorSubtitle = await this.i18nRender('exception.error_subtitle', `Error ${status}`, { status });
    const errorDescription = this.isExceptionObject(exception)
      ? exception.message
      : await this.i18nRender('exception.unknonw_message_description', 'Internal Server Error');

    switch (status) {
      case HttpStatus.NOT_FOUND:
        const path = applicationRef.getRequestUrl?.(request) ?? '/';
        applicationRef!.reply(
          response,
          this.renderErrorPage({
            title: await this.i18nRender(
              'exception.not_found_title',
              `We are sorry, the page you are looking for cannot be found`,
              { status },
            ),
            description: await this.i18nRender('exception.not_found_description', `Path: ${path}`, { path }),
            redirect: {
              link: this.homePath,
              label: await this.i18nRender('exception.home_btn_text', 'Go Home'),
              type: 'button',
            },
          }),
        );
        break;
      case HttpStatus.INTERNAL_SERVER_ERROR:
      case HttpStatus.NOT_IMPLEMENTED:
      case HttpStatus.BAD_GATEWAY:
      case HttpStatus.SERVICE_UNAVAILABLE:
      case HttpStatus.GATEWAY_TIMEOUT:
      case HttpStatus.HTTP_VERSION_NOT_SUPPORTED:
        applicationRef!.reply(
          response,
          this.renderErrorPage({
            title: errorTitle,
            subtitle: errorSubtitle,
            description: errorDescription,
            redirect: {
              link: this.homePath,
              label: await this.i18nRender('exception.retry_btn_text', 'Retry'),
              type: 'button',
            },
          }),
        );
        break;
      default:
        applicationRef!.reply(
          response,
          this.renderErrorPage({
            title: errorTitle,
            subtitle: errorSubtitle,
            description: errorDescription,
          }),
        );
        break;
    }
  }
}
