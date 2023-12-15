import { IsOptional, IsDefined, IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { NewIdentityResourceInput } from '@ace-pomelo/identity-datasource';

export abstract class NewIdentityResourceValidator
  implements
    Optional<
      NewIdentityResourceInput,
      'emphasize' | 'required' | 'showInDiscoveryDocument' | 'nonEditable' | 'enabled'
    >
{
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  abstract name: string;

  @IsOptional()
  @IsString()
  abstract displayName?: string;

  @IsOptional()
  @IsString()
  abstract description?: string;

  @IsOptional()
  @IsBoolean()
  abstract emphasize?: boolean;

  @IsOptional()
  @IsBoolean()
  abstract required?: boolean;

  @IsOptional()
  @IsBoolean()
  abstract showInDiscoveryDocument?: boolean;

  @IsOptional()
  @IsBoolean()
  abstract nonEditable?: boolean;

  @IsOptional()
  @IsBoolean()
  abstract enabled?: boolean;
}
