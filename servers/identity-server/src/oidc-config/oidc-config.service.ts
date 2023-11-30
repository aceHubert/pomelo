import * as url from 'url';
import * as crypto from 'crypto';
import { Provider, AdapterFactory, FindAccount, KoaContextWithOIDC, errors } from 'oidc-provider';
import { OidcConfiguration, OidcModuleOptions, OidcModuleOptionsFactory } from 'nest-oidc-provider';
import { default as sanitizeHtml } from 'sanitize-html';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDataSource, UserMetaPresetKeys } from '@ace-pomelo/infrastructure-datasource';
import { OidcRedisAdapterService } from '../oidc-adapter/oidc-redis-adapter.service';
import { OidcConfigAdapter } from './oidc-adapter';

@Injectable()
export class OidcConfigService implements OidcModuleOptionsFactory {
  private logger = new Logger(OidcConfigService.name, { timestamp: true });

  constructor(
    private readonly configService: ConfigService,
    private readonly adapterService: OidcRedisAdapterService,
    private readonly userDataSource: UserDataSource,
  ) {}

  createModuleOptions(): OidcModuleOptions | Promise<OidcModuleOptions> {
    return {
      issuer: this.configService.getOrThrow('OIDC_ISSUER'),
      path: this.configService.get('OIDC_PATH', '/oidc'),
      oidc: this.getConfiguration(),
      factory: (issuer: string, config?: OidcConfiguration) => {
        const provider = new Provider(issuer, config);

        if (this.configService.get('debug', false)) {
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

        // Skip redirecting invalid request error to client
        // https://github.com/panva/node-oidc-provider/blob/main/recipes/skip_redirect.md
        Object.defineProperty(errors.InvalidRequest.prototype, 'allow_redirect', { value: false });

        // Update client secret comparison
        // use SHA256 of input to compare with stored value
        provider.Client.prototype.compareClientSecret = function compareClientSecret(actual: string) {
          const constantEquals = require('oidc-provider/lib/helpers/constant_equals');
          return constantEquals(this.clientSecret, crypto.createHash('sha256').update(actual).digest('hex'), 1000);
        };

        provider.registerGrantType('password', (ctx, next) => {
          // TODO: Password Grant Type
          next();
        });

        // checksession session_state
        provider.on('authorization.success', async (ctx: KoaContextWithOIDC, response: Record<string, any>) => {
          if (!response) return;

          const origin = new url.URL((ctx.oidc.params?.redirect_uri as string) ?? '').origin;
          const clientId = ctx.oidc.client?.clientId;
          const sessionId = ctx.oidc.session?.jti;
          if (clientId && origin && sessionId) {
            response.session_state = this.getSessionState(clientId, origin, sessionId);
          }
        });

        return provider;
      },
    };
  }

  createAdapterFactory(): AdapterFactory | Promise<AdapterFactory> {
    return (modelName: string) => new OidcConfigAdapter(modelName, this.adapterService);
  }

  getConfiguration(): OidcConfiguration {
    const issuer = this.configService.getOrThrow('OIDC_ISSUER');
    const resource = this.configService.get<string>('OIDC_RESOURCE');
    return {
      clients: [
        {
          client_id: '35613c26-6a86-ba04-8ee0-6ced9688c75a',
          client_secret: 'F691E0F0F69D8AAB9FF35CFD38AEAEF37DC24A75452C2D54D7D5C202AF4EB253',
          client_name: 'Pomelo Admin',
          scope: 'openid offline_access profile capabilities phone email',
          grant_types: ['authorization_code', 'implicit', 'refresh_token'],
          response_types: ['code', 'id_token', 'code id_token', 'id_token token'],
          redirect_uris: [
            'https://localhost:5011/signin.html',
            'https://localhost:5011/signin-silent.html',
            'http://localhost:6033/signin.html',
            'http://localhost:6033/signin-silent.html',
          ],
          post_logout_redirect_uris: ['https://localhost:5011', 'http://localhost:6033'],
          token_endpoint_auth_method: 'none',
          require_auth_time: true,
          access_token_format: 'jwt',
          extra_properties: {
            'loginPage.template': 'login-form-20',
            'loginPage.formLableDisplay': false,
            'loginPage.formValidateTooltip': true,
          },
        },
        {
          client_id: '3d136433-977f-40c7-8702-a0444a6b2a9f',
          client_secret: '98E7152F6311F81F7505AA53C52AE426941B0807FD5DA01F5537709947AE0A09',
          client_name: 'Pomelo Client',
          scope: 'openid offline_access profile capabilities phone email',
          grant_types: ['authorization_code', 'implicit', 'refresh_token'],
          response_types: ['code', 'id_token', 'code id_token', 'id_token token'],
          redirect_uris: ['https://localhost:5013/signin.html', 'https://localhost:5013/signin-silent.html'],
          post_logout_redirect_uris: ['https://localhost:5013'],
          token_endpoint_auth_method: 'none',
          require_auth_time: true,
          access_token_format: 'jwt',
        },
        {
          client_id: '041567b1-3d71-4ea8-9ac2-8f3d28dab170',
          client_secret: '98D54EE45DB53A378DADFE481E1B76CA59F2B1970564B5282294AD84B0139AF9',
          client_name: 'Pomelo Identity Server',
          scope: 'openid offline_access profile',
          grant_types: ['client_credentials'],
          response_types: [],
          redirect_uris: [],
          token_endpoint_auth_method: 'client_secret_basic',
          require_auth_time: true,
          access_token_format: 'jwt',
        },
        {
          client_id: '75a9c633-cfde-4954-b35c-9344ed9b781a',
          client_secret: 'A2FF9E058C9A182ACC11C372E4CEE929E71CFE4B7E126F9B50C9ABCDF9DE5AF8',
          client_name: 'Pomelo Core Server',
          scope: 'openid offline_access profile',
          grant_types: ['authorization_code', 'client_credentials'],
          response_types: ['code'],
          redirect_uris: ['http://localhost:3000/login/callback', 'http://localhost:5002/login/callback'],
          post_logout_redirect_uris: ['http://localhost:3000', 'http://localhost:5002'],
          token_endpoint_auth_method: 'client_secret_basic',
          require_auth_time: true,
          access_token_format: 'jwt',
        },
      ],
      interactions: {
        url(_, interaction) {
          return `/login/${interaction.uid}`;
        },
      },
      scopes: ['openid', 'offline_access', 'profile', 'email', 'phone'],
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
      claims: {
        profile: ['display_name', 'nice_name', 'nick_name', 'avatar', 'gender', 'locale', 'url', 'updated_at'],
        capabilities: ['role', 'ram'],
        email: ['email', 'email_verified'],
        phone: ['phone_number', 'phone_number_verified'],
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
      discovery: {
        check_session_iframe: url.resolve(issuer, '/connect/checksession'),
      },
      ttl: {
        DeviceCode: (ctx, token, client) => {
          return client.metadata()['device_code_ttl'] || 5 * 60; // 5 minutes in seconds
        },
        AuthorizationCode: (ctx, token, client) => {
          return client.metadata()['authorization_code_ttl'] || 5 * 60; // 5 minutes in seconds
        },
        IdToken: (ctx, token, client) => {
          return client.metadata()['id_token_ttl'] || 5 * 60; // 5 minutes in seconds
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
          // @ts-expect-error no types
          secureProxy: true,
          sameSite: 'none',
        },
      },
      jwks: {
        keys: [
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
            dq: 'GPTW7706jbTTMaZWcQYqg3aj-jIUanWQLqEQvwNd7tJrnsWkkGj945Sfo92i7_u7R4MelG8gg7SVIxlYo7rJrq36FkIJuRvbyCdDc8H6f4-UZ4SyQMJYwvlIna8DOYjck_JilH0R3L-IgWluAwVot7joGBi4eW8ozuQDct3GONc',
            n: 'gz4PqkAZ9yHmBccYwdgmVvXHFPNOH23Hgl9N6kQ_4PUaq5YkbCMXD58g7sKHEbz4QbuCagjWgKHHh-QjdJx3GSFZkCvShQZmpphvIOC9fLDpCRrG9c8jAVtov74z3t6p09q5zI-zDBtpwjuAbR25-oeQZtWrjZqRPc80mRMr-EdK4lJFPagIk718oWIPqvTojQhdYXsHtESMp6X8mdFgPRMPX2RM3thEtlWdxxLS6bAlJocYAtw8sW4Xm5sQEaWeYZ4Rg-vtywDZlJluMPDXEIfhswrg_Jitod-zGW4uHe0WR32oOAXA8VUpqB1X4eBLSBjVqu44gZcrTvU5_O_iZQ',
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
        registration: {
          enabled: true,
        },
        registrationManagement: {
          enabled: true,
          rotateRegistrationAccessToken: true,
        },
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
            // @param ctx - koa request context
            // @param form - form source (id="op.logoutForm") to be embedded in the page and submitted by
            //   the End-User
            ctx.body = `<!DOCTYPE html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
              <link rel="icon" type="image/x-icon" href="favicon.ico" />
              <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
              <title>Logout Request</title>
              <link rel="stylesheet" href="/style/index.css" />
              <link rel="stylesheet" href="/style/container.css" />
            </head>
            <body>
              <main class="container">
                <div class="wrapper">
                  <h1 class="title">Do you want to sign-out from ${ctx.host}?</h1>
                  ${form}
                  <div id="actions"">
                    <button autofocus type="submit" class="action-button" form="op.logoutForm" value="yes" name="logout">Yes, sign me out</button>
                    <button type="submit" class="action-button secondary" form="op.logoutForm">No, stay signed in</button>
                  </div>
                </div>
              </main>
            </body>
            </html>`;
          },
          postLogoutSuccessSource: (ctx) => {
            // @param ctx - koa request context
            const { clientId, clientName } = ctx.oidc.client || {}; // client is defined if the user chose to stay logged in with the OP
            const display = clientName || clientId;
            ctx.body = `<!DOCTYPE html>
              <head>
              <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
                <link rel="icon" type="image/x-icon" href="favicon.ico" />
                <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
                <title>Sign-out Success</title>
                <link rel="stylesheet" href="/style/index.css" />
                <link rel="stylesheet" href="/style/container.css" />
              </head>
              <body>
                <main class="container">
                  <div class="wrapper">
                    <h1 class="title">Sign-out Success</h1>
                    <p class="description">Your sign-out ${display ? `with ${display}` : ''} was successful.</p>
                  </div>
                </main>
              </body>
              </html>`;
          },
        },
        resourceIndicators: {
          enabled: true,
          defaultResource: (ctx) => {
            console.log('default resource', resource, ctx.origin);

            return resource ?? ctx.origin;
          },
          getResourceServerInfo: (ctx, resourceIndicator, client) => {
            console.log('resource indicator', resourceIndicator);

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
            console.log('use granted resource', resourceIndicator);
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
      // issueRefreshToken: (ctx, client, code) => {
      //   if (!client.grantTypeAllowed('refresh_token')) {
      //     return false;
      //   }
      //   return (
      //     code.scopes.has('offline_access') ||
      //     (client.applicationType === 'web' && client.tokenEndpointAuthMethod === 'none')
      //   );
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
          grant.addResourceScope(resource ?? ctx.origin, ctx.oidc.client.scope!);

          await grant.save();

          return grant;
        }
        return;
      },
      renderError: async (ctx, out) => {
        this.logger.error('oidc renderError', out);
        ctx.type = 'html';
        ctx.body = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0" />
            <link rel="icon" type="image/x-icon" href="favicon.ico" />
            <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
            <title>An error occurred</title>
            <link rel="stylesheet" href="/style/index.css" />
            <link rel="stylesheet" href="/style/container.css" />
          </head>
          <body>
            <main class="container">
              <div class="wrapper">
                <h1 class="title">An error occurred!</h1>
                <p class="description">
                  ${Object.entries(out)
                    .map(([key, value]) => `<pre><strong>${key}</strong>: ${sanitizeHtml(value)}</pre>`)
                    .join('')}
                </p>
              </div>
            </main>
          </body>
        </html>
        `;
      },
      extraClientMetadata: {
        properties: [
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
    const user = await this.userDataSource.get(
      Number(id),
      ['niceName', 'displayName', 'email', 'mobile', 'url', 'updatedAt'],
      { sub: id },
    );

    if (!user) {
      return undefined;
    }

    return {
      accountId: id,
      claims: async (use, scope) => {
        console.log('claims', use, scope);

        if (use === 'extra_token_claims') {
          return {
            sub: id,
            // TODO: add rams
            ram: [],
          };
        } else if (
          use === 'userinfo' ||
          (use === 'id_token' && ctx.oidc.client?.metadata().access_token_format === 'jwt') // jwt token can not read from userinfo endpoint
        ) {
          const userMetas = await this.userDataSource.getMetas(Number(id), Object.values(UserMetaPresetKeys), [
            'metaKey',
            'metaValue',
          ]);

          return {
            sub: id,
            display_name: user.displayName,
            nice_name: user.niceName,
            email: userMetas.find((meta) => meta.metaKey === UserMetaPresetKeys.VerifingEmail)?.metaValue ?? user.email,
            email_verified: user.email,
            phone_number:
              userMetas.find((meta) => meta.metaKey === UserMetaPresetKeys.VerifingEmail)?.metaValue ?? user.mobile,
            phone_number_verified: user.mobile,
            url: user.url,
            updated_at: user.updatedAt,
            ...userMetas.reduce((acc, meta) => {
              if (
                meta.metaKey === UserMetaPresetKeys.VerifingEmail ||
                meta.metaKey === UserMetaPresetKeys.VerifingEmail
              ) {
                // ignore
              } else if (meta.metaKey === UserMetaPresetKeys.Capabilities) {
                acc['role'] = meta.metaValue;
              } else {
                acc[meta.metaKey] = meta.metaValue;
              }
              return acc;
            }, {} as Record<string, any>),
          };
        } else {
          return {
            sub: id,
          };
        }
      },
    };
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

  private getSessionState(clientId: string, origin: string, sessionId: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    let stateEncode = crypto.createHash('sha256').update(`${clientId}${origin}${sessionId}${salt}`).digest('base64');

    stateEncode = stateEncode.replace(/=/g, ''); // Remove any trailing '='s
    stateEncode = stateEncode.replace(/\+/g, '-'); // '+' => '-'
    stateEncode = stateEncode.replace(/\//g, '_'); // '/' => '_'

    return `${stateEncode}.${salt}`;
  }
}
