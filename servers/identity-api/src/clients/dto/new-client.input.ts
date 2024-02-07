import { InputType, Field, Int } from '@nestjs/graphql';
import { ClientAuthMethod, SigningAlgorithmWithNone, SubjectTypes, TokenFormat } from 'oidc-provider';
import { NewClientValidator } from './new-client.validator';

@InputType({ description: 'New client input' })
export class NewClientInput extends NewClientValidator {
  /**
   * Application type,
   * allows options: "web", "native"
   */
  @Field((type) => String)
  applicationType?: 'web' | 'native';

  /**
   * Client id (UUID)
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
  defaultMaxAge?: number;

  /**
   * IdToken signed response alg,
   * allowed options: "PS256", "PS384", "PS512", "ES256", "ES256K", "ES384", "ES512", "EdDSA", "RS256", "RS384", "RS512", "HS256", "HS384", "HS512", "none"
   */
  @Field((type) => String, { defaultValue: 'RS256' })
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
   * Subject type,
   * allowed options: "pairwise", "public"
   */
  @Field((type) => String)
  subjectType?: SubjectTypes;

  /**
   * Token endpoint auth method,
   * allowed options: 'client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt', 'tls_client_auth',        'self_signed_tls_client_auth', 'none'
   */
  @Field((type) => String, { defaultValue: 'client_secret_basic' })
  tokenEndpointAuthMethod?: ClientAuthMethod;

  /**
   * IdToken lifetime in seconds
   */
  @Field((type) => Int, { defaultValue: 600 })
  idTokenLifetime?: number;

  /**
   * AccessToken format,
   * allowed options: "jwt", "opaque"
   */
  @Field((type) => String, { defaultValue: 'jwt' })
  accessTokenTormat?: TokenFormat;

  /**
   * AccessToken lifetime in seconds
   */
  @Field((type) => Int, { defaultValue: 3600 })
  accessTokenLifetime?: number;

  /**
   * RefreshToken expiration type,
   * allowed options: "absolute", "sliding"
   */
  @Field((type) => String, { defaultValue: 'absolute' })
  refreshTokenExpiration?: 'absolute' | 'sliding';

  /**
   * RefreshToken lifetime in seconds in case of "absolute" expiration type
   */
  @Field((type) => Int, { defaultValue: 2592000 })
  refreshTokenAbsoluteLifetime?: number;

  /**
   * RefreshToken lifetime in seconds in case of "sliding" expiration type
   */
  @Field((type) => Int, { defaultValue: 1296000 })
  refreshTokenSlidingLifetime?: number;

  /**
   * Authorization code lifetime in seconds
   */
  @Field((type) => Int, { defaultValue: 300 })
  authorizationCodeLifetime?: number;

  /**
   * Device code lifetime in seconds
   */
  @Field((type) => Int, { defaultValue: 300 })
  deviceCodeLifetime?: number;

  /**
   * Backchannel authentication request lifetime in seconds
   */
  @Field((type) => Int, { defaultValue: 1800 })
  backchannelAuthenticationRequestLifetime?: number;

  /**
   * Backchannel user code lifetime in seconds
   */
  @Field((type) => Int, { defaultValue: 1800 })
  requireConsent?: boolean;

  /**
   * Backchannel user code lifetime in seconds
   */
  @Field((type) => Int, { defaultValue: 1800 })
  requirePkce?: boolean;

  /**
   * Enabled
   */
  @Field({ defaultValue: true })
  enabled?: boolean;
}
