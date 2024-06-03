import * as url from 'url';
import wildcard from 'wildcard';
import psl from 'psl';
import { get, omitBy, isNil } from 'lodash';
import {
  Provider,
  FindAccount,
  KoaContextWithOIDC,
  CookiesSetOptions,
  ClientMetadata,
  ClientAuthMethod,
  SigningAlgorithmWithNone,
  errors,
} from 'oidc-provider';
import { OidcConfiguration, OidcModuleOptionsFactory } from 'nest-oidc-provider';
import { default as sanitizeHtml } from 'sanitize-html';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientDataSource, IdentityResourceDataSource } from '@ace-pomelo/identity-datasource';
import { sha256, random, normalizeRoutePath } from '@ace-pomelo/shared-server';
import { renderPrimaryStyle } from '../common/utils/render-primary-style-tag.util';
import { AccountProviderService } from '../account-provider/account-provider.service';
import { getI18nFromContext } from './i18n.helper';
import { OidcConfigAdapter } from './oidc-config.adapter';
import { OidcConfigStorage } from './oidc-config.storage';
import { OidcConfigOptions } from './interfaces/oidc-config-options.interface';
import { OIDC_CONFIG_OPTIONS } from './constants';

@Injectable()
export class OidcConfigService implements OidcModuleOptionsFactory {
  private logger = new Logger(OidcConfigService.name, { timestamp: true });

  constructor(
    @Inject(OIDC_CONFIG_OPTIONS) private readonly options: OidcConfigOptions,
    private readonly accountProviderService: AccountProviderService,
    private readonly identityResourceDataSource: IdentityResourceDataSource,
    private readonly clientDataSource: ClientDataSource,
  ) {}

  private get globalPrefix() {
    return normalizeRoutePath(new url.URL(this.options.issuer).pathname);
  }

  async createModuleOptions() {
    return {
      issuer: this.options.issuer,
      path: normalizeRoutePath(this.options.path!),
      oidc: await this.getConfiguration(),
      proxy: true,
      factory: (issuer: string, config?: OidcConfiguration) => {
        const provider = new Provider(issuer, config);
        // allow http,localhost in development mode
        if (this.options.debug) {
          // Allowing HTTP and/or localhost for implicit response type web clients
          // https://github.com/panva/node-oidc-provider/blob/v7.x/recipes/implicit_http_localhost.md
          // @ts-expect-error no types
          const { invalidate: orig } = provider.Client.Schema.prototype;
          // @ts-expect-error no types
          provider.Client.Schema.prototype.invalidate = function invalidate(message: string, code: string) {
            if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
              return;
            }

            orig.call(this, message);
          };
        }

        // Wildcard redirect_uri support
        // https://github.com/panva/node-oidc-provider/blob/main/recipes/redirect_uri_wildcards.md
        const { redirectUriAllowed } = provider.Client.prototype;

        const hasWildcardHost = (redirectUri: string) => {
          const { hostname } = new URL(redirectUri);
          return hostname.includes('*');
        };

        const wildcardMatches = (redirectUri: string, wildcardUri: string) => !!wildcard(wildcardUri, redirectUri);

        provider.Client.prototype.redirectUriAllowed = function wildcardRedirectUriAllowed(redirectUri) {
          const match = redirectUriAllowed.call(this, redirectUri);
          if (match) return match;

          const wildcardUris = this.redirectUris?.filter(hasWildcardHost) || [];
          return wildcardUris.some(wildcardMatches.bind(undefined, redirectUri));
        };

        // Skip redirecting invalid request error to client
        // https://github.com/panva/node-oidc-provider/blob/main/recipes/skip_redirect.md
        Object.defineProperty(errors.InvalidRequest.prototype, 'allow_redirect', { value: false });

        // Update client secret comparison and multiple client secrets support
        // use SHA256 of input to compare with stored value
        const constantEquals = require('oidc-provider/lib/helpers/constant_equals');
        provider.Client.prototype.compareClientSecret = function compareClientSecret(actual: string) {
          actual = sha256(actual, { enabledHmac: true }).toString();
          // TODO: multiple client secrets support

          return constantEquals(this.clientSecret, actual, 1000);
        };

        // checksession session_state
        provider.on('authorization.success', async (ctx: KoaContextWithOIDC, response: Record<string, any>) => {
          if (!response) return;

          const sessionState = this.generateSessionStateValue(ctx);
          if (sessionState) {
            response.session_state = sessionState;
          }
        });

        // server error
        provider.on('server_error', (ctx: KoaContextWithOIDC, error: Error) => {
          this.logger.error(error);
        });

        return provider;
      },
    };
  }

  createAdapterFactory() {
    return (modelName: string) =>
      new OidcConfigAdapter(modelName, new OidcConfigStorage(this.options.storage, this.findClient));
  }

  async getConfiguration(): Promise<OidcConfiguration> {
    const scopes: OidcConfiguration['scopes'] = [],
      claims: OidcConfiguration['claims'] = {};

    // identity resources
    await this.identityResourceDataSource.getList(['name', 'enabled', 'claims']).then((resources) => {
      resources.forEach((resource) => {
        scopes.push(resource.name);
        claims[resource.name] = resource.claims?.map((claim) => claim.type) ?? [];
      }, {} as NonNullable<OidcConfiguration['claims']>);
    });

    // api resources
    // TODO: api resources

    // required scopes
    if (!scopes.includes('openid')) {
      scopes.unshift('openid');
    }

    // no configured need scopes
    if (!scopes.includes('offline_access')) {
      scopes.push('offline_access');
    }

    return {
      // static clients metadata
      clients: [
        {
          client_id: '00000000-0000-0000-0000-000000000001',
          // UtQs360CkP
          client_secret: '10414436a1a7d7ff59e1087209ca32b508224462441c484dfe8f8994f55fcca1',
          client_name: 'Pomelo Identity Server',
          scope: 'openid profile offline_access',
          grant_types: ['client_credentials'],
          response_types: [],
          redirect_uris: [],
          token_endpoint_auth_method: 'client_secret_basic',
          require_auth_time: true,
          access_token_format: 'jwt',
        },
        {
          client_id: '00000000-0000-0000-0000-000000000002',
          // b9fqUuo2Gd
          client_secret: 'b1dc4e94b22ffd8e4f4016c506ac0f2c0795eaa628548a5250a78dbb3ef4d7f1',
          client_name: 'Pomelo Infratructure Server',
          scope: 'openid profile offline_access',
          grant_types: ['authorization_code', 'client_credentials'],
          response_types: ['code'],
          redirect_uris: ['http://localhost:5002/login/callback'],
          post_logout_redirect_uris: ['http://localhost:5002'],
          token_endpoint_auth_method: 'client_secret_basic',
          require_auth_time: true,
          access_token_format: 'jwt',
        },
      ],
      scopes,
      claims,
      responseTypes: [
        'code',
        'id_token',
        'code id_token',
        'id_token token',
        'code token',
        'code id_token token',
        'none',
      ],
      pkce: {
        methods: ['S256'],
        required: (ctx, client) => client.metadata()['require_pkce'] === true,
      },
      routes: {
        authorization: '/connect/authorize',
        backchannel_authentication: '/connect/backchannel',
        code_verification: '/connect/device',
        device_authorization: '/connect/deviceauthorize',
        pushed_authorization_request: '/connect/request',
        token: '/connect/token',
        userinfo: '/connnect/userinfo',
        registration: '/connect/clients',
        end_session: '/connect/endsession',
        introspection: '/connect/introspect',
        revocation: '/connect/revocation',
      },
      interactions: {
        url: (ctx, interaction) => {
          this.logger.debug(
            `interaction: ${interaction.prompt.name}, reason: ${interaction.prompt.reasons.join(', ')}`,
          );

          const params = new url.URLSearchParams({});
          params.set(
            'returnUrl',
            `${this.globalPrefix}${
              // @ts-expect-error type error
              normalizeRoutePath(ctx.oidc.provider.pathFor('authorization'))
            }?${new url.URLSearchParams(interaction.params as Record<string, any>).toString()}`,
          );

          return `${this.globalPrefix}/login?${params.toString()}`;
        },
      },
      discovery: {
        check_session_iframe: url.resolve(this.options.issuer, `${this.globalPrefix}/connect/checksession`),
      },
      ttl: {
        DeviceCode: (ctx, token, client) => {
          return client.metadata()['device_code_ttl'] || 5 * 60; // 5 minutes in seconds
        },
        AuthorizationCode: (ctx, token, client) => {
          return client.metadata()['authorization_code_ttl'] || 5 * 60; // 5 minutes in seconds
        },
        IdToken: (ctx, token, client) => {
          return client.metadata()['id_token_ttl'] || 60 * 60; // 1 hour in seconds
        },
        ClientCredentials: (ctx, token) => {
          return token.resourceServer?.accessTokenTTL || 5 * 60; // 5 minutes in seconds
        },
        AccessToken: (ctx, token) => {
          return token.resourceServer?.accessTokenTTL || 60 * 60; // 1 hour in seconds
        },
        RefreshToken: (ctx, token, client) => {
          const metadata = client.metadata();
          if (metadata.refresh_token_expiration === 'sliding') {
            return metadata.refresh_token_sliding_ttl || 15 * 24 * 60 * 60; // 15 days in seconds
          } else {
            if (
              ctx &&
              ctx.oidc.entities.RotatedRefreshToken &&
              client.applicationType === 'web' &&
              client.tokenEndpointAuthMethod === 'none' &&
              !token.isSenderConstrained()
            ) {
              // Non-Sender Constrained SPA RefreshTokens do not have infinite expiration through rotation
              return ctx.oidc.entities.RotatedRefreshToken.remainingTTL;
            }

            return metadata.refresh_token_absolute_ttl || 30 * 24 * 60 * 60; // 30 days in seconds
          }
        },
        BackchannelAuthenticationRequest: (ctx, request, client) => {
          const metadata = client.metadata();
          if (ctx && ctx.oidc && ctx.oidc.params?.requested_expiry) {
            return Math.min(
              metadata.backchannel_authentication_request_ttl || 5 * 60,
              +ctx.oidc.params.requested_expiry,
            ); // 5 minutes in seconds or requested_expiry, whichever is shorter
          }

          return metadata.backchannel_authentication_request_ttl || 5 * 60; // 5 minutes in seconds
        },
        Session: 15 * 24 * 60 * 60, // 15 day in seconds
        Grant: 15 * 24 * 60 * 60, // 15 day in seconds
        Interaction: 60 * 60, // 1 hour in seconds
      },
      cookies: {
        keys: ['gQMQym96H64-QInq7mvVX0nZEw0qUmcTA3bCpfnuR1h3YXNhgGJ0XLd17obmV8Gm'],
        // set session cookie options to allow passing the session to the browser for check_session
        long: {
          httpOnly: false,
          sameSite: 'none',
          //  https://github.com/pillarjs/cookies/blob/98a7556ef73bf376b26d51a416ae2b4645f34cd7/index.js#L119
          // secure:  true,
          // deprecated
          // https://github.com/pillarjs/cookies/blob/98a7556ef73bf376b26d51a416ae2b4645f34cd7/index.js#L127
          secureProxy: true,
        } as CookiesSetOptions,
      },
      jwks: {
        keys: this.options.debug
          ? [
              {
                p: 'xtPNYqTMy_AhvR7emZXo-ddOXQ3PekXLzefL7QC0X27Gsia2KZ3Zu1R6FE7fAT3cGGw4pfzS625H1jOH9zJJKiqzOigu63ison0vHsxFlAX2iu776DVqs6d7aOhYYklbY5xCUWP-wHAODRr1y6M5CCoUyzbS0SnQ0JGbbLQyGQ8',
                kty: 'RSA',
                q: 'qPsoMPzpx_bs49HFAHc4TNalOP_HM6eEwLAHMjrLc2gJIUeiAGlT8BdcPZtowSX82-hbZV8Ob81zpzJubTgivWs31w9rVX-j2hmKEH03ZgQSfY5ediMckssQjmRECpT2vN8VvNz23spePIN9P30flWaJuFg_vwgSx7Y3WsdmxUs',
                d: 'eb1_2nVLoKqZLJLarDVMmy2xVgW7WfwDLTQqmjxk5M93xeKoNob2RU9exRs9H38i6hZ9is5X60omRC-jk-_vqif9ZHbB-RNO9QpBS0YtfxS7le540FssJX4dVH-irgHtls81ukMx2vEy0TFQl-cTNQm7MSjS0a-nOqaSK8xU5SAnb3Z0ais4B1bMAs8pWxWM-dnUbEVN4fdCnHsFTRBpEYscdyTCzTs6ppgeTtkuonhSmO3TtrDRotPhqBDwCVbH8XxBsomwvl9KY1U4BIq9Y-EWq27oQDjEdmo9smh_0fh0OMJIZ51XKMwrxctrF7o7sg6NS7oeDpCMufmCLegBoQ',
                e: 'AQAB',
                use: 'sig',
                kid: '93J_YBZFn9dR-xu18kOV7A2EEeU4-w824Nnw1D6fFVo',
                qi: 'QTOHT0K-o_Jk8pnTcFRV_waouTrMYF3VjzCz_zIEid1SV8aYNVx_GTHlIhT5vwLLd-dzT3mrum38AwU9dcMOM_pI3FSYKTL3kHue7NgrSHnW4V84TVbW6Kgux6ogDpzjNaNjhYwUCk366-dZYVrRU6p21L2pcqSguhlDRODeYy4',
                dp: 'XXKaq2wtXQSFtu9VS_YrQ5GwIQgmpZ88RJBXRhL4s4nLFVwgbbrk5Ki1n-nZ4imC0m-6yDjloQV5-fDKTKJzxL_A8OqF8uIKsWwIw37ajNGoqG_eMas5dSqYVBwvvjIgI9cDTGGlECkaUYqET6ttWKr-juw7dVcj74Mf-51Nln0',
                alg: 'RS256',
                dq: 'GPTW7706jbTTMaZWcQYqg3aj-jIUanWQLqEQvwNd7tJrnsWkkGj945Sfo92i7_u7R4MelG8gg7SVIxlYo7rJrq36FkIJuRvbyCdDc8H6f4-UZ4SyQMJYwvlIna8DOYjck_JilH0R3L-IgWluAwVot7joGBi4eW8ozuQDct3GONc',
                n: 'gz4PqkAZ9yHmBccYwdgmVvXHFPNOH23Hgl9N6kQ_4PUaq5YkbCMXD58g7sKHEbz4QbuCagjWgKHHh-QjdJx3GSFZkCvShQZmpphvIOC9fLDpCRrG9c8jAVtov74z3t6p09q5zI-zDBtpwjuAbR25-oeQZtWrjZqRPc80mRMr-EdK4lJFPagIk718oWIPqvTojQhdYXsHtESMp6X8mdFgPRMPX2RM3thEtlWdxxLS6bAlJocYAtw8sW4Xm5sQEaWeYZ4Rg-vtywDZlJluMPDXEIfhswrg_Jitod-zGW4uHe0WR32oOAXA8VUpqB1X4eBLSBjVqu44gZcrTvU5_O_iZQ',
              },
            ]
          : [
              {
                p: '04eRUaRpAvXZikctZQ7t8_OwEYVteHphMpl9v0JBWQ8GfrKYsCSW6TyH9cPIbFi3Mx1flGO2nO7VfFCkmcxGO4MErjRGcEJmhpAGMZX9pWiLZMJ2XwD-gbZ1B1mqtUG8XifHxB5LOGqn7Dxu5e2hZzIZWYJkHPFFWEBOGBe2xvM',
                kty: 'RSA',
                q: 'u48bIaB2u7EzwtSqDYjT0rQp-VL0ivbD5y_gK7wukCfJRLHQYvWWtSFE4jYbzcb_DsXOgkH2SobZg7zI6S4nW7jMls5rqRmo5FbJlWcpCXkeOv4rbKxDx9hbgZ-SASIobqB6QcvHCoTSufdcr0yaF0DPZ47oGbDP423RjCGPDBU',
                d: 'EK0Vm10PbIqoiObD69Mw4MVNscO_nNlNWj9ZQF0UvBWZBwnf_s_Wdd6WVIlozRAaRcVcSsZm-Yh4RNyNH7fl0Pvau9gSCgtGh9HdP_ynRkOZ9gk2CV5lPBse_0D7gw2HZ8PMQftBbTg6GL5kpYj0ULGrL_kO1b6cDIfXmhgJWisLpQLRQY5AFBX0Ry19iGA4uu1MujinQ-2DZP87eoTie0oKt0drCUwdFjXshgrRSGi-vSpjlHTTCg99taHLODI3iwSmK7Y2uATQcpbH1GMaXRQ2jK-OZOeqH0qh_tTvVlBFeYI_IBlZdfJZh64un3Qev9gsknFyqSYzgSSN9umO4Q',
                e: 'AQAB',
                use: 'sig',
                kid: 'POAtnw37qoO9ibJfAAfpH9cslsNC5dyJo7raChSYqrQ',
                qi: 'VASQdA9bxQ0AbnHA9oBrVrMUNBYw5eCBspQivx8qnOb4yCyN4TlGHHNsZrTs7DkzeWZdnhLxHQgqFtzaMzFjHnvYjC-s8sUyhLPyfzfziG8BTr9-xEc4EFfb2Q2ieByt-PolgCh-KQEaGCS07Dr9hVySkB_Wo0uegfwJLAV4B0Y',
                dp: 'n9yPxazENBmLG4bpVruut7RONx-oeOm8NVps_zNaYa0KUow0-sHcT06Qzfr1qHRvl7C2QFYPd5DERNxJWXZZCbbdva4CIer8wutr0uOxOuXEmxSgEvKUZYF39mMcsTmJ23qi7aObY3qvh8iwYxJw7aWeJNh3QqxQpP6MRob9emM',
                alg: 'RS256',
                dq: 'YGfAVFp8bSE6L8zL08Uey9DbOlJPbBZGv9A184T4khRBOdQD_rmpS1TcaUHSrMS6WUeHTCDHjasepr4kruaQSG8GigV0BSkxTJznZKnvx_S_eycl_ufUtyYYctooW_jIu4Q1ExjBKED5Z6kjtN803PrtIJet6XaehJHwAY1GT7k',
                n: 'mvpGS-UXuhX3IFsTHbw2vd1ij86t-s5GHl-sWa1qxPxD1bR1D9JOVBznSHLoRpp55Y8ak-snWUg7unnBbPE-ncFnz-SfzfOIdjZ90QWi4gvqR0Q__BhYFhWacPhniK13aDrPRmhh4wTEWurZqajxZNh_138DS9m6_tWatzz3g0mlvi_MuujOkJ5gUTJffkOhmNLqKAGmYqcJUvkpWe5HBi-sNQFV7Gg5PdGW7BKrNkrrH3tdnIrDHhIF5sjgtYHD22guzpSQp9didTtRfHV8Nfno-C1zjYiIP9lwfJxWYY5k4O7Xra60wJICMSvLKJ3hCwwN-iNOGxJaS4e4-A617w',
              },
            ],
      },
      features: {
        devInteractions: { enabled: false },
        claimsParameter: { enabled: true },
        clientCredentials: { enabled: true },
        userinfo: { enabled: true },
        jwtUserinfo: { enabled: true },
        revocation: { enabled: true }, // defaults to false
        deviceFlow: { enabled: true }, // defaults to false
        introspection: {
          enabled: true,
          allowedPolicy: (ctx, client, token) => {
            if (client.introspectionEndpointAuthMethod === 'none' && token.clientId !== client.clientId) {
              return false;
            }

            return true;
          },
        },
        rpInitiatedLogout: {
          logoutSource: async (ctx, form) => {
            const i18n = getI18nFromContext(ctx);
            const primaryColor = get(ctx.oidc.client?.metadata()['extra_properties'], 'primaryColor');
            // @param ctx - koa request context
            // @param form - form source (id="op.logoutForm") to be embedded in the page and submitted by
            //   the End-User
            ctx.body = `<!DOCTYPE html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
              <link rel="icon" type="image/x-icon" href="${this.globalPrefix}/favicon.ico" />
              <link rel="shortcut icon" type="image/x-icon" href="${this.globalPrefix}/favicon.ico" />
              <title>${i18n.tv('oidc.config.logout.confirm_page_title', `Logout Request`)}</title>
              ${
                process.env.NODE_ENV === 'production'
                  ? `<link rel="stylesheet" href="${this.globalPrefix}/style/index.min.css" />
                    <link rel="stylesheet" href="${this.globalPrefix}/style/container.min.css" />`
                  : `<link rel="stylesheet" href="${this.globalPrefix}/style/index.css" />
                    <link rel="stylesheet" href="${this.globalPrefix}/style/container.css" />`
              }
              ${primaryColor ? renderPrimaryStyle(primaryColor) : ''}
            </head>
            <body>
              <main class="container">
                <div class="wrapper">
                  <h1 class="title">${i18n.tv(
                    'oidc.config.logout.confirm_title',
                    `Do you want to sign-out from ${ctx.host}?`,
                    {
                      args: { ctx },
                    },
                  )}</h1>
                  ${form}
                  <div id="actions"">
                    <button autofocus type="submit" class="action-button" form="op.logoutForm" value="yes" name="logout">${i18n.tv(
                      'oidc.config.logout.confirm_btn_text',
                      'Yes, sign me out',
                    )}</button>
                    <button type="submit" class="action-button secondary" form="op.logoutForm">${i18n.tv(
                      'oidc.config.logout.cancel_btn_text',
                      'No, stay signed in',
                    )}</button>
                  </div>
                </div>
              </main>
            </body>
            </html>`;
          },
          postLogoutSuccessSource: (ctx) => {
            const i18n = getI18nFromContext(ctx);
            const { clientId, clientName } = ctx.oidc.client || {}; // client is defined if the user chose to stay logged in with the OP
            const display = clientName || clientId;
            ctx.body = `<!DOCTYPE html>
              <head>
              <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
                <link rel="icon" type="image/x-icon" href="${this.globalPrefix}/favicon.ico" />
                <link rel="shortcut icon" type="image/x-icon" href="${this.globalPrefix}/favicon.ico" />
                <title>${i18n.tv('oidc.config.logout.success_page_title', `Sign-out Success`)}</title>
                ${
                  process.env.NODE_ENV === 'production'
                    ? `<link rel="stylesheet" href="${this.globalPrefix}/style/index.min.css" />
                      <link rel="stylesheet" href="${this.globalPrefix}/style/container.min.css" />`
                    : `<link rel="stylesheet" href="${this.globalPrefix}/style/index.css" />
                      <link rel="stylesheet" href="${this.globalPrefix}/style/container.css" />`
                }
              </head>
              <body>
                <main class="container">
                  <div class="wrapper">
                    <h1 class="title">${i18n.tv('oidc.config.logout.success_title', 'Sign-out Success')}</h1>
                    <p class="description">${
                      display
                        ? i18n.tv(
                            'oidc.config.logout.success_description_with_client',
                            `Your sign-out with ${display} was successful.`,
                            {
                              args: { client: display },
                            },
                          )
                        : i18n.tv('oidc.config.logout.success_description', `Your sign-out was successful.`)
                    }</p>
                  </div>
                </main>
              </body>
              </html>`;
          },
        },
        resourceIndicators: {
          enabled: true,
          defaultResource: (ctx) => {
            this.logger.debug('default resource', ctx.origin, ctx.protocol);

            return ctx.origin;
          },
          getResourceServerInfo: (ctx, resourceIndicator, client) => {
            this.logger.debug('resource indicator', resourceIndicator);

            const metadata = client.metadata();
            return {
              scope: metadata.scope ?? '',
              audience: resourceIndicator,
              accessTokenFormat: metadata.access_token_format,
              accessTokenTTL: metadata.access_token_ttl,
              jwt: {
                sign: {
                  alg: 'RS256',
                },
              },
            };
          },
          useGrantedResource: (ctx, resourceIndicator) => {
            this.logger.debug('use granted resource', resourceIndicator);

            return true;
          },
        },
      },
      findAccount: this.findAccount.bind(this),
      extraTokenClaims: async (ctx, token) => {
        if (ctx.oidc.account?.accountId) {
          const account = await this.findAccount(ctx, ctx.oidc.account.accountId);
          if (account) {
            return await account.claims('extra_token_claims', [...token.scopes].join(' '), {}, []);
          }
        }
        return;
      },
      clientBasedCORS(ctx, origin, client) {
        if (client.metadata()['allowed_cors_origins']?.includes(origin)) {
          return true;
        }
        return false;
      },
      // If a client has the grant allowed and scope includes offline_access or the client is a public web client doing code flow
      // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#issuerefreshtoken
      // issueRefreshToken: (ctx, client, code) => {
      //   if (!client.grantTypeAllowed('refresh_token')) {
      //     return false;
      //   }
      //   return (
      //     code.scopes.has('offline_access') ||
      //     (client.applicationType === 'web' && client.tokenEndpointAuthMethod === 'none')
      //   );
      // },
      // Configures if and how the OP rotates refresh tokens after they are used
      // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#rotaterefreshtoken
      // rotateRefreshToken: (ctx) => {
      //   const { RefreshToken: refreshToken, Client: client } = ctx.oidc.entities;
      //   // cap the maximum amount of time a refresh token can be
      //   // rotated for up to 1 year, afterwards its TTL is final
      //   if (refreshToken.totalLifetime() >= 365.25 * 24 * 60 * 60) {
      //     return false;
      //   }
      //   // rotate non sender-constrained public client refresh tokens
      //   if (client.clientAuthMethod === 'none' && !refreshToken.isSenderConstrained()) {
      //     return true;
      //   }
      //   // rotate if the token is nearing expiration (it's beyond 70% of its lifetime)
      //   return refreshToken.ttlPercentagePassed() >= 70;
      // },
      // Skipping consent screen
      // https://github.com/panva/node-oidc-provider/blob/v7.x/recipes/skip_consent.md
      loadExistingGrant: async (ctx) => {
        if (!ctx.oidc.session || !ctx.oidc.client) return;

        const grantId =
          (ctx.oidc.result && ctx.oidc.result.consent && ctx.oidc.result.consent.grantId) ||
          ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId);

        if (grantId) {
          // keep grant expiry aligned with session expiry
          // to prevent consent prompt being requested when grant expires
          const grant = await ctx.oidc.provider.Grant.find(grantId);

          if (grant) {
            // this aligns the Grant ttl with that of the current session
            // if the same Grant is used for multiple sessions, or is set
            // to never expire, you probably do not want this in your code
            if (ctx.oidc.account && grant.exp && grant.exp < ctx.oidc.session.exp) {
              grant.exp = ctx.oidc.session.exp;

              await grant.save();
            }

            return grant;
          }
        } else if (ctx.oidc.client.metadata()['require_consent'] !== true && !ctx.oidc.prompts.has('consent')) {
          const grant = new ctx.oidc.provider.Grant({
            clientId: ctx.oidc.client.clientId,
            accountId: ctx.oidc.session.accountId,
          });

          grant.addOIDCScope(ctx.oidc.client.scope!);
          grant.addResourceScope(ctx.origin, ctx.oidc.client.scope!);

          await grant.save();

          return grant;
        }
        return;
      },
      renderError: async (ctx, out, err) => {
        this.logger.error('oidc renderError', err);

        const i18n = getI18nFromContext(ctx);
        let pageTitle = i18n.tv('error.page_title', 'An error occurred'),
          title = i18n.tv('error.title', 'An error occurred!');
        if (ctx.status === 404) {
          pageTitle = i18n.tv('404.page_title', 'Page not found');
          title = i18n.tv('404.title', 'Page not found!');
        }

        ctx.type = 'html';
        ctx.body = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
            <link rel="icon" type="image/x-icon" href="${this.globalPrefix}/favicon.ico" />
            <link rel="shortcut icon" type="image/x-icon" href="${this.globalPrefix}/favicon.ico" />
            <title>${pageTitle}</title>
            ${
              process.env.NODE_ENV === 'production'
                ? `<link rel="stylesheet" href="${this.globalPrefix}/style/index.min.css" />
                  <link rel="stylesheet" href="${this.globalPrefix}/style/container.min.css" />`
                : `<link rel="stylesheet" href="${this.globalPrefix}/style/index.css" />
                  <link rel="stylesheet" href="${this.globalPrefix}/style/container.css" />`
            }
          </head>
          <body>
            <main class="container">
              <div class="wrapper">
                <h1 class="title">${title}</h1>
                <p class="description">
                  ${
                    ctx.status === 404
                      ? (err as any).error_description ?? err.message
                      : Object.entries(out)
                          .map(([key, value]) => `<pre><strong>${key}</strong>: ${sanitizeHtml(value)}</pre>`)
                          .join('')
                  }
                </p>
              </div>
            </main>
          </body>
        </html>
        `;
      },
      extraClientMetadata: {
        properties: [
          'redirect_uris',
          'client_secrets',
          'id_token_ttl',
          'access_token_format',
          'access_token_ttl',
          'refresh_token_expiration',
          'refresh_token_absolute_ttl',
          'refresh_token_sliding_ttl',
          'authorization_code_ttl',
          'device_code_ttl',
          'backchannel_authentication_request_ttl',
          'require_consent',
          'require_pkce',
          'allowed_cors_origins',
          'extra_properties',
        ],
        validator: (ctx, key, value) => {
          if (value) {
            switch (key) {
              case 'redirect_uris':
                for (const redirectUri of value as string[]) {
                  if (redirectUri.includes('*')) {
                    const { hostname, href } = new URL(redirectUri);

                    if (href.split('*').length !== 2) {
                      throw new errors.InvalidClientMetadata(
                        'redirect_uris with a wildcard may only contain a single one',
                      );
                    }

                    if (!hostname.includes('*')) {
                      throw new errors.InvalidClientMetadata('redirect_uris may only have a wildcard in the hostname');
                    }

                    const test = hostname.replace('*', 'test');

                    // checks that the wildcard is for a full subdomain e.g. *.panva.cz, not *suffix.panva.cz
                    if (!wildcard(hostname, test)) {
                      throw new errors.InvalidClientMetadata(
                        'redirect_uris with a wildcard must only match the whole subdomain',
                      );
                    }

                    if (!psl.get(hostname.split('*.')[1])) {
                      throw new errors.InvalidClientMetadata(
                        'redirect_uris with a wildcard must not match an eTLD+1 of a known public suffix domain',
                      );
                    }
                  }
                }
                break;
              case 'client_secrets':
                if (!Array.isArray(value)) {
                  throw new errors.InvalidClientMetadata(`invalid ${key} value, must be an array of strings!`);
                }
                break;
              case 'access_token_format':
                if (!['opaque', 'jwt'].includes(value as string)) {
                  throw new errors.InvalidClientMetadata(`invalid ${key} value, must be one of [opaque, jwt]!`);
                }
                break;
              case 'refresh_token_expiration':
                if (!['absolute', 'sliding'].includes(value as string)) {
                  throw new errors.InvalidClientMetadata(`invalid ${key} value, must be one of [absolute, sliding]!`);
                }
                break;
              case 'id_token_ttl':
              case 'access_token_ttl':
              case 'refresh_token_absolute_ttl':
              case 'refresh_token_sliding_ttl':
              case 'authorization_code_ttl':
              case 'device_code_ttl':
              case 'backchannel_authentication_request_ttl':
                if (typeof value !== 'number' || value <= 0) {
                  throw new errors.InvalidClientMetadata(`invalid ${key} value, must be a positive number!`);
                }
                break;
              case 'require_consent':
              case 'require_pkce':
                if (typeof value !== 'boolean') {
                  throw new errors.InvalidClientMetadata(`invalid ${key} value, must be a boolean!`);
                }
                break;
              case 'allowed_cors_origins':
                if (!Array.isArray(value) || !value.every(this.isOrigin)) {
                  throw new errors.InvalidClientMetadata(`invalid ${key} value, must be an array of valid origins!`);
                }
              case 'extra_properties':
                if (typeof value !== 'object') {
                  throw new errors.InvalidClientMetadata(`invalid ${key} value, must be an object!`);
                }
                break;
              default:
                break;
            }
          }
        },
      },
    };
  }

  private findAccount: FindAccount = async (ctx, id) => {
    const account = await this.accountProviderService.getAccount(id);

    if (!account) return;

    return {
      accountId: account.sub,
      claims: async (use, scope) => {
        this.logger.debug('claims', use, scope);

        if (use === 'extra_token_claims') {
          return {
            sub: account.sub,
            // TODO: add rams
            ram: [],
          };
        } else if (use === 'userinfo' || use === 'id_token') {
          const claims = await this.accountProviderService.getClaims(id);

          return {
            ...claims,
            ...account,
          };
        } else {
          return {
            sub: account.sub,
          };
        }
      },
    };
  };

  private findClient = (clientId: string): Promise<ClientMetadata | undefined> => {
    return this.clientDataSource
      .get(clientId, [
        'applicationType',
        'clientId',
        'clientName',
        'clientUri',
        'defaultMaxAge',
        'idTokenSignedResponseAlg',
        'initiateLoginUri',
        'jwksUri',
        'logoUri',
        'policyUri',
        'requireAuthTime',
        'sectorIdentifierUri',
        'subjectType',
        'tokenEndpointAuthMethod',
        'idTokenLifetime',
        'accessTokenFormat',
        'accessTokenLifetime',
        'refreshTokenExpiration',
        'refreshTokenAbsoluteLifetime',
        'refreshTokenSlidingLifetime',
        'authorizationCodeLifetime',
        'deviceCodeLifetime',
        'backchannelAuthenticationRequestLifetime',
        'requireConsent',
        'requirePkce',
        'enabled',
        'corsOrigins',
        'grantTypes',
        'scopes',
        'redirectUris',
        'postLogoutRedirectUris',
        'secrets',
        'properties',
      ])
      .then((client) => {
        if (!client) return;
        if (!client.enabled) throw new errors.InvalidClient('client is disabled!');

        // TODO: multiple client secrets support
        const secret = client.secrets?.find((secret) => secret.type === 'SharedSecret');

        return omitBy(
          {
            application_type: client.applicationType,
            client_id: client.clientId,
            client_secret: secret?.value,
            client_secret_expires_at: secret?.expiresAt,
            client_name: client.clientName,
            client_uri: client.clientUri,
            default_max_age: client.defaultMaxAge,
            id_token_signed_response_alg: client.idTokenSignedResponseAlg as SigningAlgorithmWithNone,
            initiate_login_uri: client.initiateLoginUri,
            jwks_uri: client.jwksUri,
            logo_uri: client.logoUri,
            policy_uri: client.policyUri,
            require_auth_time: client.requireAuthTime,
            sector_identifier_uri: client.sectorIdentifierUri,
            subject_type: client.subjectType,
            token_endpoint_auth_method: client.tokenEndpointAuthMethod as ClientAuthMethod,
            id_token_lifetime: client.idTokenLifetime,
            access_token_format: client.accessTokenFormat,
            access_token_lifetime: client.accessTokenLifetime,
            refresh_token_expiration: client.refreshTokenExpiration,
            refresh_token_absolute_lifetime: client.refreshTokenAbsoluteLifetime,
            refresh_token_sliding_lifetime: client.refreshTokenSlidingLifetime,
            authorization_code_lifetime: client.authorizationCodeLifetime,
            device_code_lifetime: client.deviceCodeLifetime,
            backchannel_authentication_request_lifetime: client.backchannelAuthenticationRequestLifetime,
            require_consent: client.requireConsent,
            require_pkce: client.requirePkce,
            allowed_cors_origins: client.corsOrigins?.map(({ origin }) => origin),
            scope: client.scopes?.map(({ scope }) => scope).join(' '),
            grant_types: client.grantTypes?.map(({ grantType }) => grantType),
            response_types: client.grantTypes?.some(({ grantType }) =>
              ['authorization_code', 'implicit'].includes(grantType),
            )
              ? undefined
              : [],
            redirect_uris: client.redirectUris?.map(({ redirectUri }) => redirectUri),
            post_logout_redirect_uris: client.postLogoutRedirectUris?.map(
              ({ postLogoutRedirectUri }) => postLogoutRedirectUri,
            ),
            client_secrets: client.secrets?.map(({ type, value, expiresAt }) => ({ type, value, expiresAt })),
            extra_properties: client.properties?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {}),
          },
          isNil,
        ) as ClientMetadata;
      });
  };

  private isOrigin(value: any) {
    if (typeof value !== 'string') {
      return false;
    }
    try {
      const { origin } = new URL(value);
      // Origin: <scheme> "://" <hostname> [ ":" <port> ]
      return value === origin;
    } catch (err) {
      return false;
    }
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
