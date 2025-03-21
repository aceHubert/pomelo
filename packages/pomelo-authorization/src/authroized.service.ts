import { jwtVerify, createRemoteJWKSet, SignJWT, KeyLike, SignOptions } from 'jose';
import { BaseClient, Issuer } from 'openid-client';
import { Injectable, Inject, Logger, UnauthorizedException } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { AuthorizationOptions, XOR } from './interfaces/authorization-options.interface';
import { Params, ChannelType } from './interfaces/multitenant.interface';
import { getSigningKey, getVerifyingKey } from './keys.helper';
import { AUTHORIZATION_OPTIONS } from './constants';

@Injectable()
export class AuthorizationService {
  private logger = new Logger(AuthorizationService.name, { timestamp: true });
  private readonly isMultitenant: boolean = false;
  private idpInfos: {
    [tokenName: string]: {
      trustIssuer: Issuer;
      client: BaseClient;
      getKey: ReturnType<typeof createRemoteJWKSet> | undefined;
    };
  } = {};

  constructor(@Inject(AUTHORIZATION_OPTIONS) private readonly options: AuthorizationOptions) {
    this.isMultitenant = !!options.issuerOrigin;
  }

  async createIdpInfo(tenantId?: string, channelType?: ChannelType) {
    let issuer, clientMetadata;

    if (this.options.issuer) {
      issuer = this.options.issuer;

      if (!this.options.clientMetadata) {
        throw new Error('The option "clientMetadata" is required!');
      }

      clientMetadata = this.options.clientMetadata;
    } else if (this.options.issuerOrigin) {
      if (!tenantId || !channelType) {
        throw new Error('The params "tenantId" and "channelType" are required!');
      }

      issuer = `${this.options.issuerOrigin}/${tenantId}`;

      switch (channelType) {
        case ChannelType.b2e:
          clientMetadata = (this.options as any)[ChannelType.b2e].clientMetadata;
          break;
        case ChannelType.b2c:
          clientMetadata = (this.options as any)[ChannelType.b2c].clientMetadata;
          break;
      }
    }
    if (issuer) {
      const { Issuer, custom } = loadPackage('openid-client', 'AuthorizationService', () =>
        require('openid-client'),
      ) as typeof import('openid-client');
      this.options.httpOptions && custom.setHttpOptionsDefaults(this.options.httpOptions);

      const trustIssuer = await Issuer.discover(issuer);
      const client = new trustIssuer.Client(clientMetadata);

      !client.issuer['introspection_endpoint'] &&
        this.options.introspectionEndpoint &&
        (client.issuer['introspection_endpoint'] = this.options.introspectionEndpoint);

      !client.issuer['introspection_endpoint_auth_method'] &&
        this.options.introspectionEndpointAuthMethod &&
        (client.issuer['introspection_endpoint_auth_method'] = this.options.introspectionEndpointAuthMethod);

      const getKey = trustIssuer.metadata.jwks_uri
        ? await createRemoteJWKSet(new URL(trustIssuer.metadata.jwks_uri))
        : void 0;
      const idpKey = this.getIdpInfosKey(tenantId, channelType);

      return (this.idpInfos[idpKey] = {
        trustIssuer,
        client,
        getKey,
      });
    } else {
      if (this.isMultitenant) {
        const errorMsg = {
          error: 'No issuer found!',
          debug: {
            issuer,
            tenantId,
            channelType,
          },
        };
        this.logger.error(errorMsg);
        return;
      }
      this.logger.error('No issuer found!');
      return;
    }
  }

  /**
   * create access token by public key
   * @param payload token payload
   * @param signingKey private key
   * @param options token options
   * @param options.publicKey public key
   * @param options.protectedHeader protected header, default { alg: 'RS256' }
   * @param options.expiresIn token expires in, default 24h
   * @param options.issuer token issuer, default ''
   * @param options.audience token audience, default ''
   * @returns access token
   */
  async createToken(
    payload: { sub: string; [key: string]: any },
    options: XOR<
      {
        claimsFactory?: (signJWT: SignJWT) => void;
      },
      {
        issuer?: string;
        audience?: string | string[];
        expiresIn?: string | number;
      }
    > &
      SignOptions = {},
  ) {
    const {
      claimsFactory,
      expiresIn = this.options.jwtExpiresIn!,
      issuer = '',
      audience = '',
      ...signOptions
    } = options;

    const signingKey = await this.getSigningKey();
    if (!signingKey) {
      throw new Error('No signing key found!');
    }

    const jwt = new SignJWT(payload)
      .setProtectedHeader(this.options.jwtHeaderParameters!)
      .setIssuedAt()
      .setSubject(payload.sub);

    if (claimsFactory) {
      claimsFactory(jwt);
    } else {
      jwt.setIssuer(issuer).setAudience(audience).setExpirationTime(expiresIn);
    }

    return jwt.sign(signingKey, signOptions);
  }

  /**
   * verify access token
   * @param accessToken access token
   * @param tenantId tenant id
   * @param channelType channel type
   */
  async verifyToken(accessToken: string, tenantId?: string, channelType?: ChannelType) {
    let idpInfo, publicKey;

    if ((publicKey = await this.getVerifyingKey())) {
      // usePublicKey
      if (typeof publicKey === 'function') {
        return (await jwtVerify(accessToken, publicKey)).payload;
      } else {
        return (await jwtVerify(accessToken, publicKey)).payload;
      }
    } else if (this.options.useJWKS && (idpInfo = await this.getIdpInfo(tenantId, channelType))?.getKey) {
      // useJwks
      return (await jwtVerify(accessToken, idpInfo.getKey)).payload;
    } else if ((idpInfo = await this.getIdpInfo(tenantId, channelType))?.client) {
      // verify from inrospection_endpoint
      const { active, ...payload } = await idpInfo.client.introspect(accessToken, 'access_token');
      this.logger.debug(`Token introspection: ${active}`);
      if (!active) throw new UnauthorizedException('Token is not active');
      return payload;
    }
    return;
  }

  getMultitenantParamsFromRequest(req: any): Params {
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

  private SigningKeyCache: KeyLike | undefined;
  private VerifyingKeyCache: KeyLike | undefined;
  private async getSigningKey() {
    if (this.options.signingKey) {
      return (
        this.SigningKeyCache ||
        (this.SigningKeyCache =
          typeof this.options.signingKey === 'string'
            ? await getSigningKey(
                this.options.signingKey,
                this.options.jwtHeaderParameters!.alg,
                this.options.pemImportOptions,
              )
            : this.options.signingKey)
      );
    }
    return;
  }
  private async getVerifyingKey() {
    if (this.options.verifyingKey) {
      if (typeof this.options.verifyingKey === 'function') {
        return this.options.verifyingKey;
      } else {
        return (
          this.VerifyingKeyCache ||
          (this.VerifyingKeyCache =
            typeof this.options.verifyingKey === 'string'
              ? await getVerifyingKey(
                  this.options.verifyingKey,
                  this.options.jwtHeaderParameters!.alg,
                  this.options.pemImportOptions,
                )
              : this.options.verifyingKey)
        );
      }
    }
    return;
  }

  private getIdpInfosKey(tenantId?: string, channelType?: ChannelType): string {
    return `${tenantId ?? 'common'}.${channelType ?? 'none'}`;
  }

  private async getIdpInfo(tenantId?: string, channelType?: ChannelType) {
    const idpKey = this.getIdpInfosKey(tenantId, channelType);
    let idpInfo;
    if (!(idpInfo = this.idpInfos[idpKey])) {
      idpInfo = await this.createIdpInfo(tenantId, channelType);
    }
    return idpInfo;
  }
}
