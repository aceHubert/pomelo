import { ObjectType, Field, Int, PickType } from '@nestjs/graphql';
import { ClientAuthMethod, SigningAlgorithmWithNone, SubjectTypes, TokenFormat } from 'oidc-provider';
import { ClientModel } from '@/datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Client model' })
export class Client implements Omit<ClientModel, 'id'> {
  /**
   * Application type
   */
  @Field(() => String)
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
  @Field(() => Int)
  defaultMaxAge?: number;

  /**
   * IdToken signed response alg
   */
  @Field(() => String)
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
  @Field(() => String)
  subjectType?: SubjectTypes;

  /**
   * Token endpoint auth method
   */
  @Field(() => String)
  tokenEndpointAuthMethod?: ClientAuthMethod;

  /**
   * IdToken lifetime in seconds
   */
  @Field(() => Int)
  idTokenLifetime?: number;

  /**
   * AccessToken format
   */
  @Field(() => String)
  accessTokenFormat?: TokenFormat;

  /**
   * AccessToken lifetime in seconds
   */
  @Field(() => Int)
  accessTokenLifetime?: number;

  /**
   * RefreshToken expiration type
   */
  @Field(() => String)
  refreshTokenExpiration?: 'absolute' | 'sliding';

  /**
   * RefreshToken lifetime in seconds in case of "absolute" expiration type
   */
  @Field(() => Int)
  refreshTokenAbsoluteLifetime?: number;

  /**
   * RefreshToken lifetime in seconds in case of "sliding" expiration type
   */
  @Field(() => Int)
  refreshTokenSlidingLifetime?: number;

  /**
   * AuthorizationCode lifetime in seconds
   */
  @Field(() => Int)
  authorizationCodeLifetime?: number;

  /**
   * DeviceCode lifetime in seconds
   */
  @Field(() => Int)
  deviceCodeLifetime?: number;

  /**
   * BackchannelAuthenticationRequest lifetime in seconds
   */
  @Field(() => Int)
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
