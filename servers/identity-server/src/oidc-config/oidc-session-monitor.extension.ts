import * as url from 'url';
import { sha256, random } from '@ace-pomelo/shared/server';
import { renderCheckSessionTemplate } from './templates';

import type { KoaContextWithOIDC } from 'oidc-provider';
import type { OidcModuleFactoryArgs } from 'nest-oidc-provider';

type OidcProvider = InstanceType<OidcModuleFactoryArgs['module']['Provider']>;

export interface OidcSessionMonitorExtensionOptions {
  globalPrefix: string;
  oidcPath: string;
  assetsBaseURL: string;
  checkSessionRoute: string;
}

/**
 * 项目自实现 OpenID Connect Session Management。
 * oidc-provider v8/v9 不内建 check_session_iframe，因此这里通过 middleware 暴露 checksession endpoint，
 * 并在 discovery 中动态补充 check_session_iframe。
 */
export class OidcSessionMonitorExtension {
  install(
    provider: OidcProvider,
    { globalPrefix, assetsBaseURL, oidcPath, checkSessionRoute }: OidcSessionMonitorExtensionOptions,
  ) {
    const sessionName = (provider as any).cookieName('session');

    provider.use(async (ctx: KoaContextWithOIDC, next: () => Promise<void>) => {
      if (ctx.method === 'GET' && ctx.path === checkSessionRoute) {
        ctx.type = 'html';
        ctx.status = 200;
        ctx.body = renderCheckSessionTemplate({ assetsBaseURL, sessionName });
        return;
      }

      await next();

      if (ctx.oidc?.route === 'discovery') {
        (ctx.body as Record<string, any>).check_session_iframe = this.buildCheckSessionIframeUrl(
          ctx,
          globalPrefix,
          oidcPath,
          checkSessionRoute,
        );
      }
    });

    provider.on('authorization.success', async (ctx: KoaContextWithOIDC, response: Record<string, any>) => {
      if (!response) return;

      const sessionState = this.generateSessionStateValue(ctx);
      if (sessionState) {
        response.session_state = sessionState;
      }
    });
  }

  private buildCheckSessionIframeUrl(
    ctx: KoaContextWithOIDC,
    globalPrefix: string,
    oidcPath: string,
    checkSessionRoute: string,
  ) {
    return `${ctx.origin}${globalPrefix}${oidcPath}${checkSessionRoute}`;
  }

  private generateSessionStateValue(ctx: KoaContextWithOIDC) {
    if (!ctx) return;
    if (!ctx.oidc.requestParamScopes.has('openid')) return;

    if (!ctx.oidc.session) return;

    if (!ctx.oidc.client) return;
    if (!ctx.oidc.params?.redirect_uri) return;

    const sessionId = ctx.oidc.session.jti;
    const clientId = ctx.oidc.client.clientId;
    const { origin } = new url.URL(ctx.oidc.params.redirect_uri as string);
    const salt = random(16).toString();
    const hash = sha256(`${clientId}${origin}${sessionId}${salt}`).toBase64Url();

    return `${hash}.${salt}`;
  }
}
