import { ObjectType, Field, Int, PickType } from '@nestjs/graphql';
import { ClientAuthMethod, SigningAlgorithmWithNone, SubjectTypes, TokenFormat } from 'oidc-provider';
import { ClientModel } from '@ace-pomelo/identity-datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Client model' })
export class Client implements Omit<ClientModel, 'id'> {
  @Field((type) => String, { description: 'Application type' })
  applicationType?: 'web' | 'native';

  @Field({ description: 'Client id' })
  clientId!: string;

  @Field({ description: 'Client name' })
  clientName!: string;

  @Field({ description: 'Client uri' })
  clientUri?: string;

  @Field((type) => Int, { description: 'Default max age' })
  defaultMaxAge?: number;

  @Field((type) => String, { description: 'IdToken signed response alg, default: "RS256"' })
  idTokenSignedResponseAlg?: SigningAlgorithmWithNone;

  @Field({ description: 'Initiate login uri' })
  initiateLoginUri?: string;

  @Field({ description: 'Jwks uri' })
  jwksUri?: string;

  @Field({ description: 'Logo uri' })
  logoUri?: string;

  @Field({ description: 'Policy uri' })
  policyUri?: string;

  @Field({ description: 'Require authTime' })
  requireAuthTime?: boolean;

  @Field({ description: 'Sector Identifier uri' })
  sectorIdentifierUri?: string;

  @Field((type) => String, { description: 'Subject type' })
  subjectType?: SubjectTypes;

  @Field((type) => String, { description: 'Token endpoint auth method, default: "client_secret_basic"' })
  tokenEndpointAuthMethod?: ClientAuthMethod;

  @Field((type) => Int, { description: 'IdToken lifetime in seconds, default: 600' })
  idTokenLifetime?: number;

  @Field((type) => String, { description: 'AccessToken format, default: "opaque"' })
  accessTokenTormat?: TokenFormat;

  @Field((type) => Int, { description: 'AccessToken lifetime in seconds, default: 3600' })
  accessTokenLifetime?: number;

  @Field((type) => String, { description: 'RefreshToken expiration type, default: "absolute"' })
  refreshTokenExpiration?: 'absolute' | 'sliding';

  @Field((type) => Int, {
    description: 'RefreshToken lifetime in seconds in case of "absolute" expiration type, default: 2592000',
  })
  refreshTokenAbsoluteLifetime?: number;

  @Field((type) => Int, {
    description: 'RefreshToken lifetime in seconds in case of "sliding" expiration type, default: 1209600',
  })
  refreshTokenSlidingLifetime?: number;

  @Field((type) => Int, { description: 'AuthorizationCode lifetime in seconds, default: 300' })
  authorizationCodeLifetime?: number;

  @Field((type) => Int, { description: 'DeviceCode lifetime in seconds, default: 300' })
  deviceCodeLifetime?: number;

  @Field((type) => Int, { description: 'BackchannelAuthenticationRequest lifetime in seconds, default: 300' })
  backchannelAuthenticationRequestLifetime?: number;

  @Field({ description: 'Require consent, default: false' })
  requireConsent?: boolean;

  @Field({ description: 'Require Proof Key for Code Exchange (PKCE), default: false' })
  requirePkce?: boolean;

  @Field({ description: 'Enabled' })
  enabled!: boolean;

  @Field({ description: 'Latest update time' })
  updatedAt!: Date;

  @Field({ description: 'Creation time' })
  createdAt!: Date;
}

@ObjectType({ description: 'Paged client model' })
export class PagedClient extends PagedResponse(
  PickType(Client, ['applicationType', 'clientId', 'clientName', 'enabled', 'updatedAt', 'createdAt'] as const),
) {}
