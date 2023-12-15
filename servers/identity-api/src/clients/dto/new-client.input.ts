import { InputType, Field } from '@nestjs/graphql';
import { ClientAuthMethod, SigningAlgorithmWithNone, SubjectTypes, TokenFormat } from 'oidc-provider';
import { NewClientValidator } from './new-client.validator';

@InputType({ description: 'New client input' })
export class NewClientInput extends NewClientValidator {
  @Field((type) => String, { nullable: true, description: 'Application type, allows options: "web", "native"' })
  applicationType?: 'web' | 'native';

  @Field({ description: 'Client id (UUID)' })
  clientId!: string;

  @Field({ description: 'Client name' })
  clientName!: string;

  @Field({ nullable: true, description: 'Client uri' })
  clientUri?: string;

  @Field({ nullable: true, description: 'Default max age' })
  defaultMaxAge?: number;

  @Field((type) => String, { nullable: true, description: 'IdToken signed response alg, default: "RS256"' })
  idTokenSignedResponseAlg?: SigningAlgorithmWithNone;

  @Field({ nullable: true, description: 'Initiate login uri' })
  initiateLoginUri?: string;

  @Field({ nullable: true, description: 'Jwks uri' })
  jwksUri?: string;

  @Field({ nullable: true, description: 'Logo uri' })
  logoUri?: string;

  @Field({ nullable: true, description: 'Policy uri' })
  policyUri?: string;

  @Field({ nullable: true, description: 'Require authTime' })
  requireAuthTime?: boolean;

  @Field({ nullable: true, description: 'Sector Identifier uri' })
  sectorIdentifierUri?: string;

  @Field((type) => String, { nullable: true, description: 'Subject type' })
  subjectType?: SubjectTypes;

  @Field((type) => String, {
    nullable: true,
    description: 'Token endpoint auth method, default: "client_secret_basic"',
  })
  tokenEndpointAuthMethod?: ClientAuthMethod;

  @Field({ nullable: true, description: 'IdToken lifetime in seconds, default: 600' })
  idTokenLifetime?: number;

  @Field((type) => String, { nullable: true, description: 'AccessToken format, default: "opaque"' })
  accessTokenTormat?: TokenFormat;

  @Field({ nullable: true, description: 'AccessToken lifetime in seconds, default: 3600' })
  accessTokenLifetime?: number;

  @Field((type) => String, { nullable: true, description: 'RefreshToken expiration type, default: "absolute"' })
  refreshTokenExpiration?: 'absolute' | 'sliding';

  @Field({
    nullable: true,
    description: 'RefreshToken lifetime in seconds in case of "absolute" expiration type, default: 2592000',
  })
  refreshTokenAbsoluteLifetime?: number;

  @Field({
    nullable: true,
    description: 'RefreshToken lifetime in seconds in case of "sliding" expiration type, default: 1296000',
  })
  refreshTokenSlidingLifetime?: number;

  @Field({ nullable: true, description: 'Authorization code lifetime in seconds, default: 300' })
  authorizationCodeLifetime?: number;

  @Field({ nullable: true, description: 'Device code lifetime in seconds, default: 300' })
  deviceCodeLifetime?: number;

  @Field({ nullable: true, description: 'Backchannel authentication request lifetime in seconds, default: 1800' })
  backchannelAuthenticationRequestLifetime?: number;

  @Field({ nullable: true, description: 'Backchannel user code lifetime in seconds, default: 1800' })
  requireConsent?: boolean;

  @Field({ nullable: true, description: 'Backchannel user code lifetime in seconds, default: 1800' })
  requirePkce?: boolean;

  @Field({ nullable: true, description: 'Enabled, default: true' })
  enabled?: boolean;
}
