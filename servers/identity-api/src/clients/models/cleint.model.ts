import { ObjectType, Field, Int, PickType } from '@nestjs/graphql';
import { ClientAuthMethod, SigningAlgorithmWithNone, SubjectTypes, TokenFormat } from 'oidc-provider';
import { ClientModel } from '@ace-pomelo/identity-datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Client model' })
export class Client implements Omit<ClientModel, 'id'> {
  /**
   * Application type
   */
  @Field((type) => String)
  applicationType?: 'web' | 'native';

  /**
   * Client id
   */
  clientId!: string;

  /**
   * Client name
   */
  clientName!: string;

  /**
   * Client uri
   */
  clientUri?: string;

  /**
   * Default max age
   */
  @Field((type) => Int)
  defaultMaxAge?: number;

  /**
   * IdToken signed response alg
   */
  @Field((type) => String)
  idTokenSignedResponseAlg?: SigningAlgorithmWithNone;

  /**
   * Initiate login uri
   */
  initiateLoginUri?: string;

  /**
   * Jwks uri
   */
  jwksUri?: string;

  /**
   * Logo uri
   */
  logoUri?: string;

  /**
   * Policy uri
   */
  policyUri?: string;

  /**
   * Require authTime
   */
  requireAuthTime?: boolean;

  /**
   * Sector Identifier uri
   */
  sectorIdentifierUri?: string;

  /**
   * Subject type
   */
  @Field((type) => String)
  subjectType?: SubjectTypes;

  /**
   * Token endpoint auth method
   */
  @Field((type) => String)
  tokenEndpointAuthMethod?: ClientAuthMethod;

  /**
   * IdToken lifetime in seconds
   */
  @Field((type) => Int)
  idTokenLifetime?: number;

  /**
   * AccessToken format
   */
  @Field((type) => String)
  accessTokenTormat?: TokenFormat;

  /**
   * AccessToken lifetime in seconds
   */
  @Field((type) => Int)
  accessTokenLifetime?: number;

  /**
   * RefreshToken expiration type
   */
  @Field((type) => String)
  refreshTokenExpiration?: 'absolute' | 'sliding';

  /**
   * RefreshToken lifetime in seconds in case of "absolute" expiration type
   */
  @Field((type) => Int)
  refreshTokenAbsoluteLifetime?: number;

  /**
   * RefreshToken lifetime in seconds in case of "sliding" expiration type
   */
  @Field((type) => Int)
  refreshTokenSlidingLifetime?: number;

  /**
   * AuthorizationCode lifetime in seconds
   */
  @Field((type) => Int)
  authorizationCodeLifetime?: number;

  /**
   * DeviceCode lifetime in seconds
   */
  @Field((type) => Int)
  deviceCodeLifetime?: number;

  /**
   * BackchannelAuthenticationRequest lifetime in seconds
   */
  @Field((type) => Int)
  backchannelAuthenticationRequestLifetime?: number;

  /**
   * Require consent
   */
  requireConsent?: boolean;

  /**
   * Require Proof Key for Code Exchange (PKCE)
   */
  requirePkce?: boolean;

  /**
   * Enabled
   */
  enabled!: boolean;

  /**
   * Latest update time
   */
  updatedAt!: Date;

  /**
   * Creation time
   */
  createdAt!: Date;
}

@ObjectType({ description: 'Paged client model' })
export class PagedClient extends PagedResponse(
  PickType(Client, ['applicationType', 'clientId', 'clientName', 'enabled', 'updatedAt', 'createdAt'] as const),
) {}
