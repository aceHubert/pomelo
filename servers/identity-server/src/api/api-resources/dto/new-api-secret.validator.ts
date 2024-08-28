import { IsDefined, IsString, IsPositive, IsIn, IsOptional } from 'class-validator';
import { NewApiSecretInput } from '@/datasource';

export abstract class NewApiSecretValidator implements Omit<NewApiSecretInput, 'value'> {
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
