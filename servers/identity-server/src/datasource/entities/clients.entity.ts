import { Optional } from '../types';

export interface ClientsAttributes {
  id: number;
  applicationType?: string;
  clientId: string;
  clientName: string;
  clientUri?: string;
  defaultMaxAge?: number;
  idTokenSignedResponseAlg?: string;
  initiateLoginUri?: string;
  jwksUri?: string;
  logoUri?: string;
  policyUri?: string;
  requireAuthTime?: boolean;
  sectorIdentifierUri?: string;
  subjectType?: string;
  tokenEndpointAuthMethod?: string;
  idTokenLifetime?: number;
  accessTokenFormat?: string;
  accessTokenLifetime?: number;
  refreshTokenExpiration?: string;
  refreshTokenAbsoluteLifetime?: number;
  refreshTokenSlidingLifetime?: number;
  authorizationCodeLifetime?: number;
  deviceCodeLifetime?: number;
  backchannelAuthenticationRequestLifetime?: number;
  requireConsent?: boolean;
  requirePkce?: boolean;
  enabled: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface ClientsCreationAttributes extends Optional<ClientsAttributes, 'id'> {}
