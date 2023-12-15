import { IsDefined, IsString, IsPositive, IsIn, IsOptional } from 'class-validator';
import { NewClientSecretInput } from '@ace-pomelo/identity-datasource';

export abstract class NewClientSecretValidator implements Omit<NewClientSecretInput, 'value'> {
  @IsDefined()
  @IsIn(['SharedSecret', 'X509Thumbprint', 'X509Name', 'X509CertificateBase64'])
  abstract type: string;

  @IsOptional()
  @IsPositive()
  abstract expiresAt?: number;

  @IsOptional()
  @IsString()
  abstract description?: string;
}
