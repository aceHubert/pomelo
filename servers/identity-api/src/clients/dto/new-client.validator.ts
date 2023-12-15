import { IsOptional, IsDefined, IsNotEmpty, IsIn, IsString, IsUUID, IsNumber, IsBoolean, IsUrl } from 'class-validator';
import { ClientAuthMethod, SigningAlgorithmWithNone, SubjectTypes, TokenFormat } from 'oidc-provider';
import { NewClientInput } from '@ace-pomelo/identity-datasource';

export abstract class NewClientValidator implements NewClientInput {
  @IsOptional()
  @IsIn(['web', 'native'])
  abstract applicationType?: 'web' | 'native';

  @IsDefined()
  @IsString()
  @IsUUID()
  abstract clientId: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract clientName: string;

  @IsOptional()
  @IsUrl()
  abstract clientUri?: string;

  @IsOptional()
  @IsNumber()
  abstract defaultMaxAge?: number;

  @IsOptional()
  @IsIn([
    // AsymmetricSigningAlgorithm
    'PS256',
    'PS384',
    'PS512',
    'ES256',
    'ES256K',
    'ES384',
    'ES512',
    'EdDSA',
    'RS256',
    'RS384',
    'RS512',
    // SymmetricSigningAlgorithm
    'HS256',
    'HS384',
    'HS512',
    // NoneAlgorithm
    'none',
  ])
  abstract idTokenSignedResponseAlg?: SigningAlgorithmWithNone;

  @IsOptional()
  @IsUrl()
  abstract initiateLoginUri?: string;

  @IsOptional()
  @IsUrl()
  abstract jwksUri?: string;

  @IsOptional()
  @IsUrl()
  abstract logoUri?: string;

  @IsOptional()
  @IsUrl()
  abstract policyUri?: string;

  @IsOptional()
  @IsBoolean()
  abstract requireAuthTime?: boolean;

  @IsOptional()
  @IsString()
  abstract sectorIdentifierUri?: string;

  @IsOptional()
  @IsIn(['public', 'pairwise'])
  abstract subjectType?: SubjectTypes;

  @IsOptional()
  @IsIn([
    'client_secret_basic',
    'client_secret_post',
    'client_secret_jwt',
    'private_key_jwt',
    'tls_client_auth',
    'self_signed_tls_client_auth',
    'none',
  ])
  abstract tokenEndpointAuthMethod?: ClientAuthMethod;

  @IsOptional()
  @IsNumber()
  abstract idTokenLifetime?: number;

  @IsOptional()
  @IsIn(['opaque', 'jwt'])
  abstract accessTokenTormat?: TokenFormat;

  @IsOptional()
  @IsNumber()
  abstract accessTokenLifetime?: number;

  @IsOptional()
  @IsIn(['absolute', 'sliding'])
  abstract refreshTokenExpiration?: 'absolute' | 'sliding';

  @IsOptional()
  @IsNumber()
  abstract refreshTokenAbsoluteLifetime?: number;

  @IsOptional()
  @IsNumber()
  abstract refreshTokenSlidingLifetime?: number;

  @IsOptional()
  @IsNumber()
  abstract authorizationCodeLifetime?: number;

  @IsOptional()
  @IsNumber()
  abstract deviceCodeLifetime?: number;

  @IsOptional()
  @IsNumber()
  abstract backchannelAuthenticationRequestLifetime?: number;

  @IsOptional()
  @IsBoolean()
  abstract requireConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  abstract requirePkce?: boolean;

  @IsOptional()
  @IsBoolean()
  abstract enabled?: boolean;
}
