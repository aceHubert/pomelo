import passport from 'passport';
import { v4 as uuid } from 'uuid';
import { HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { Client, Issuer, TokenSet, custom } from 'openid-client';
import { User as OidcUser, UserProfile } from './helpers/user';
import { Params, ChannelType, OidcModuleOptions } from './interfaces';
import { renderPopupPage, renderMsgPage } from './templates';
import { OidcStrategy } from './oidc.strategy';
import { OIDC_MODULE_OPTIONS, SESSION_STATE_COOKIE } from './oidc.constants';

@Injectable()
export class OidcService {
  readonly isMultitenant: boolean = false;
  readonly channelType: ChannelType | undefined;
  readonly setUserinfoHeader: string = 'x-userinfo';

  logger = new Logger(OidcService.name, { timestamp: true });
  strategy: any;
  idpInfos: {
    [tokenName: string]: {
      trustIssuer: Issuer<Client>;
      keyStore: ReturnType<typeof createRemoteJWKSet> | undefined;
      client: Client;
      strategy: OidcStrategy;
    };
  } = {};

  constructor(@Inject(OIDC_MODULE_OPTIONS) private options: OidcModuleOptions) {
    this.isMultitenant = !!options.issuerOrigin;
    this.channelType = options.channelType;
    options.setUserinfoHeader && (this.setUserinfoHeader = options.setUserinfoHeader);
    if (options.httpOptions) {
      custom.setHttpOptionsDefaults(options.httpOptions);
    }
  }

  // async onModuleInit() {
  //   if (!this.isMultitenant) {
  //     this.strategy = await this.createStrategy();
  //   }
  // }

  async createStrategy(tenantId?: string, channelType?: ChannelType) {
    let strategy;

    let issuer, redirectUri, clientMetadata;
    try {
      if (this.options.issuer) {
        issuer = this.options.issuer;
        redirectUri = `${this.options.origin}/login/callback`;
        clientMetadata = this.options.clientMetadata;
      } else {
        if (!tenantId || !channelType) {
          throw new Error('The params "tenantId" and "channelType" are required!');
        }

        if (!this.options.issuerOrigin) {
          throw new Error('The option "issuerOrigin" is required!');
        }
        issuer = `${this.options.issuerOrigin}/${tenantId}`;
        redirectUri = `${this.options.origin}/login/callback`;

        switch (channelType) {
          case ChannelType.b2e:
            clientMetadata = (this.options as any)[ChannelType.b2e].clientMetadata;
            break;
          case ChannelType.b2c:
            clientMetadata = (this.options as any)[ChannelType.b2c].clientMetadata;
            break;
        }
      }
      const trustIssuer = await Issuer.discover(issuer);
      const client = new trustIssuer.Client(clientMetadata);

      const keyStore = trustIssuer.metadata.jwks_uri
        ? await createRemoteJWKSet(new URL(trustIssuer.metadata.jwks_uri))
        : void 0;
      const idpKey = this.getIdpInfosKey(tenantId, channelType);

      this.idpInfos[idpKey] = {
        trustIssuer,
        client,
        keyStore,
        // @ts-expect-error client is required in OidcStrategy, will set it later
        strategy,
      };

      this.options.authParams.redirect_uri = this.options.authParams.redirect_uri ?? redirectUri;
      this.options.authParams.nonce = this.options.authParams.nonce === 'true' ? uuid() : this.options.authParams.nonce;

      strategy = new OidcStrategy({
        client,
        params: this.options.authParams,
        usePKCE: this.options.usePKCE,
        loadUserInfo: this.options.loadUserInfo,
        filterProtocolClaims: this.options.filterProtocolClaims,
        mergeClaimsStrategy: this.options.mergeClaimsStrategy,
        tenantId,
        channelType,
      });
      this.idpInfos[idpKey].strategy = strategy;

      return strategy;
    } catch (err: any) {
      if (this.isMultitenant) {
        const errorMsg = {
          error: err.message,
          debug: {
            issuer,
            tenantId,
            channelType,
            redirectUri,
          },
        };
        this.logger.error(errorMsg);
        throw err;
      }
      this.logger.error(`Accessing the issuer/keyStore faild, ${err.stack}`);
      throw err;
    }
  }

  // #region for backend openid-connect login
  async login(req: Request, res: Response, next: NextFunction, params: Params) {
    try {
      const { tenantId, channelType } = this.getMultitenantParams(params, req.session);
      const prefix = this.getPrefix(params, req.session);

      req.session['tenantId'] = tenantId;
      req.session['channelType'] = channelType;

      const isEmbeded = req.headers && req.headers['sec-fetch-dest'] === 'iframe' ? true : false;
      let redirectUrl = req.query['redirect_url'] ?? '/';

      if (isEmbeded) {
        const ssoUrl = `${req.protocol}://${req.headers.host}${req.url}${
          req.url.includes('?') ? '&' : '?'
        }loginpopup=true`;
        const searchParams = new URLSearchParams(JSON.parse(JSON.stringify(req.query)));
        redirectUrl = `${prefix}${redirectUrl}?${searchParams.toString()}`;
        redirectUrl = !redirectUrl.startsWith('/') ? `/${redirectUrl}` : redirectUrl;
        const templatePopupPage = renderPopupPage({
          ssoUrl,
          redirectUrl,
        });
        res.send(templatePopupPage);
      } else {
        const loginpopup = req.query.loginpopup === 'true';
        const strategy =
          this.strategy ||
          this.idpInfos[this.getIdpInfosKey(tenantId, channelType)]?.strategy ||
          (await this.createStrategy(tenantId, channelType));

        // cache strategy in non-multitenant mode
        if (this.isMultitenant && !this.strategy) {
          this.strategy = strategy;
        }

        redirectUrl = Buffer.from(
          JSON.stringify({ redirect_url: `${prefix}${redirectUrl}`, loginpopup: loginpopup }),
          'utf-8',
        ).toString('base64');
        passport.authenticate(
          Object.create(strategy),
          {
            ...req.options,
            failureRedirect: `${prefix}/login`,
            state: redirectUrl,
          },
          (err: any, user: any, info: any) => {
            if (err || !user) {
              return next(err || info);
            }
            req.logIn(user, (err: any) => {
              if (err) {
                return next(err);
              }
              user.refresh_expires_in && this.updateSessionDuration(user.refresh_expires_in, req);
              const state = req.query['state'] as string;
              const buff = Buffer.from(state, 'base64').toString('utf-8');
              const stateObj = JSON.parse(buff);
              let url: string = stateObj['redirect_url'];
              url = !url.startsWith('/') ? `/${url}` : url;
              const loginpopup = stateObj['loginpopup'];
              if (loginpopup) {
                return res.send(`
                    <script type="text/javascript">
                        window.close();
                    </script >
                `);
              } else {
                return res.redirect(url);
              }
            });
          },
        )(req, res, next);
      }
    } catch (err) {
      this.logger.error(err);
      res.status(HttpStatus.NOT_FOUND).send();
    }
  }

  async logout(req: Request, res: Response, params: Params) {
    const id_token = req.user?.id_token;
    const { tenantId, channelType } = this.getMultitenantParams(params, req.session);

    req.logout(() => {
      req.session.destroy(async () => {
        const idpKey = this.getIdpInfosKey(tenantId, channelType);
        const end_session_endpoint = this.idpInfos[idpKey].trustIssuer.metadata.end_session_endpoint;
        if (end_session_endpoint) {
          res.redirect(
            `${end_session_endpoint}?client_id=${this.options.clientMetadata?.client_id}&post_logout_redirect_uri=${
              this.options.authParams.post_logout_redirect_uri ?? this.options.origin
            }${id_token ? '&id_token_hint=' + id_token : ''}`,
          );
        } else {
          // Save logged out state for 15 min
          res.cookie(SESSION_STATE_COOKIE, 'logged out', {
            maxAge: 15 * 1000 * 60,
          });
          const prefix =
            tenantId || channelType ? `/${tenantId}${this.options.channelType ? '' : '/' + channelType}` : '';
          const suffix =
            req.query.tenantId || req.query.channelType
              ? `?tenantId=${req.query.tenantId}&channelType=${req.query.channelType}`
              : '';
          res.redirect(`${prefix}/loggedout${suffix}`);
        }
      });
    });
  }

  async refreshToken(req: Request, res: Response, params: Params) {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    if (req.user.expired) {
      if (!req.user.refresh_token) {
        res.status(401).send('refresh_token is missing!');
      } else {
        return await this.requestTokenRefresh(req.user.refresh_token, this.getMultitenantParams(params, req.session))
          .then((data) => {
            this.updateUserToken(data, req);
            data.refresh_expires_in && this.updateSessionDuration(data.refresh_expires_in as number, req);
            res.sendStatus(200);
          })
          .catch((err) => {
            res.status(401).send(err);
          });
      }
    } else {
      return res.sendStatus(200);
    }
  }

  loggedOut(req: Request, res: Response, params: Params) {
    const prefix = this.getPrefix(req.query, params, req.session);

    let postLogoutRedirectUri = this.options.authParams.post_logout_redirect_uri || '/login';
    if (!postLogoutRedirectUri.startsWith('/')) {
      postLogoutRedirectUri = `/${postLogoutRedirectUri}`;
    }

    const loggedOutPage = renderMsgPage({
      title: "You've been signed out",
      subtitle: `You will be redirected in a moment`,
      description: 'Be patient, the page will refresh itself, if not click on the following button.',
      icon: 'exit' as const,
      redirect: {
        type: 'auto',
        link: `/${prefix}${postLogoutRedirectUri}`,
      },
    });
    res.send(loggedOutPage);
  }

  /**
   * send refresh token request
   * @param refreshToken refresh token
   */
  requestTokenRefresh(refreshToken: string, params: Params): Promise<TokenSet> {
    const idpKey = this.getIdpInfosKey(params.tenantId, params.channelType);
    return this.idpInfos[idpKey].client.refresh(refreshToken);
  }

  /**
   * update session duration
   * @param expiresIn refresh token expires in seconds
   */
  updateSessionDuration(expiresIn: number, req: Request) {
    if (req.session) {
      req.session.cookie.maxAge = expiresIn * 1000;
    }
  }

  /**
   * update user token
   * @param tokenset tokenset
   */
  updateUserToken(tokenset: TokenSet, req: Request) {
    if (req.user) {
      req.user = new OidcUser({
        id_token: tokenset.id_token,
        session_state: tokenset.session_state,
        access_token: tokenset.access_token!,
        refresh_token: tokenset.refresh_token,
        token_type: tokenset.token_type || 'Bearer',
        scope: tokenset.scope,
        profile: tokenset.profile,
        expires_at: tokenset.expires_at,
      });
    }
  }

  // #endregion

  /**
   * verify access token
   * @param accessToken access token
   * @param tenantId tenant id
   * @param channelType channel type
   */
  async verifyToken(accessToken: string, tenantId?: string, channelType?: ChannelType) {
    const idpKey = this.getIdpInfosKey(tenantId, channelType);
    let idpInfo;
    if (!(idpInfo = this.idpInfos[idpKey])) {
      await this.createStrategy(tenantId, channelType);
      idpInfo = this.idpInfos[idpKey]!;
    }

    // jwt token
    if (accessToken.split('.').length === 3) {
      if (this.options.publicKey) {
        // usePublicKey
        return (await jwtVerify(accessToken, this.options.publicKey)).payload;
      } else if (idpInfo.keyStore) {
        // useJwks
        return (await jwtVerify(accessToken, idpInfo.keyStore)).payload;
      }
    }

    // opaque token, verify from inrospection_endpoint
    const { active, ...payload } = await idpInfo.client.introspect(accessToken, 'access_token');
    this.logger.debug(`Token introspection: ${active}`);
    if (!active) throw new UnauthorizedException('Token is not active');

    return payload;
  }

  getPrefixFromRequest(req: Request) {
    const { tenantId, channelType } = this.getMultitenantParamsFromRequest(req);

    const prefix = [tenantId, channelType].filter(Boolean).join('/');
    return prefix ? `/${prefix}` : '';
  }

  getMultitenantParamsFromRequest(req: Request): Params {
    const routeParams = req.params && req.params[0] && req.params[0].split('/');
    const fixedChannelType = this.options.channelType;
    let tenantId, channelType;
    if (routeParams && routeParams[1] && (routeParams[1] === ChannelType.b2c || routeParams[1] === ChannelType.b2e)) {
      tenantId = routeParams[0];
      channelType = routeParams[1];
    } else if (routeParams && (fixedChannelType === ChannelType.b2c || fixedChannelType === ChannelType.b2e)) {
      tenantId = routeParams[0];
      channelType = fixedChannelType;
    }
    return { tenantId, channelType };
  }

  private getPrefix(...args: Array<Params>) {
    const { tenantId, channelType } = this.getMultitenantParams(...args);

    const prefix = [tenantId, channelType].filter(Boolean).join('/');
    return prefix ? `/${prefix}` : '';
  }

  private getMultitenantParams(...args: Array<Params>): Params {
    const tenantId = args.find((arg) => arg?.tenantId)?.tenantId;
    const channelType = this.options.channelType ? undefined : args.find((arg) => arg?.channelType)?.channelType;
    return { tenantId, channelType };
  }

  private getIdpInfosKey(tenantId?: string, channelType?: ChannelType): string {
    return `${tenantId ?? 'common'}.${channelType ?? 'none'}`;
  }

  // private assertIssuerConfiguration(issuer: Issuer, endpoint: string) {
  //   if (!issuer[endpoint]) {
  //     throw new TypeError(`${endpoint} must be configured on the issuer`);
  //   }
  // }
}

declare module 'openid-client' {
  export interface TokenSet {
    profile: UserProfile;
  }
}

declare global {
  namespace Express {
    class User extends OidcUser {}
  }
}
