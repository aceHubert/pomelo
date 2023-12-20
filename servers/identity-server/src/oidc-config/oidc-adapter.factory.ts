import { omitBy, isNil } from 'lodash';
import { Logger } from '@nestjs/common';
import { AdapterPayload, ClientMetadata, SigningAlgorithmWithNone, ClientAuthMethod, errors } from 'oidc-provider';
import { ClientDataSource } from '@ace-pomelo/identity-datasource';

export abstract class OidcAdapterServiceFactory {
  protected clientDataSource?: ClientDataSource;
  protected readonly logger: Logger;
  protected readonly grantable = new Set([
    'AccessToken',
    'AuthorizationCode',
    'RefreshToken',
    'DeviceCode',
    'BackchannelAuthenticationRequest',
  ]);

  constructor() {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

  private ensureClientDataSource() {
    if (!this.clientDataSource) {
      this.logger.warn('Please inject ClientDataSource SubClass constructor');
      throw new Error('ClientDataSource not initialized');
    }
  }

  protected key(model: string, id: string) {
    return `${model}:${id}`;
  }

  protected grantKeyFor(id: string) {
    return `grant:${id}`;
  }

  protected sessionUidKeyFor(id: string) {
    return `sessionUid:${id}`;
  }

  protected userCodeKeyFor(userCode: string) {
    return `userCode:${userCode}`;
  }

  /**
   * Get client from ClientDataSource
   * Inject ClientDataSource in SubClass constructor when use this property
   * @param clientId client id (find by client_id)
   */
  protected async getClient(clientId: string): Promise<ClientMetadata | undefined> {
    this.ensureClientDataSource();

    const client = await this.clientDataSource!.get(clientId, [
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
      'accessTokenTormat',
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
    ]);

    if (!client) return;
    if (!client.enabled) throw new errors.InvalidClient('client has disabled');

    return omitBy(
      {
        application_type: client.applicationType,
        client_id: client.clientId,
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
        access_token_format: client.accessTokenTormat,
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
        redirect_uris: client.redirectUris?.map(({ redirectUri }) => redirectUri),
        post_logout_redirect_uris: client.postLogoutRedirectUris?.map(
          ({ postLogoutRedirectUri }) => postLogoutRedirectUri,
        ),
        client_secrets: client.secrets?.map(({ type, value, expiresAt }) => ({ type, value, expiresAt })),
        extra_properties: client.properties?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {}),
      },
      isNil,
    ) as ClientMetadata;
  }

  abstract upsert(model: string, id: string, payload: AdapterPayload, expiresIn: number): Promise<void> | void;
  abstract consume(model: string, id: string): Promise<void | undefined> | void | undefined;
  abstract find(
    model: string,
    id: string,
  ): Promise<AdapterPayload | void | undefined> | AdapterPayload | void | undefined;
  abstract findByUid(
    model: string,
    uid: string,
  ): Promise<AdapterPayload | void | undefined> | AdapterPayload | void | undefined;
  abstract findByUserCode(
    model: string,
    userCode: string,
  ): Promise<AdapterPayload | void | undefined> | AdapterPayload | void | undefined;
  abstract revokeByGrantId(grantId: string): Promise<void | undefined> | void | undefined;
  abstract destroy(model: string, id: string): Promise<void | undefined> | void | undefined;
}
