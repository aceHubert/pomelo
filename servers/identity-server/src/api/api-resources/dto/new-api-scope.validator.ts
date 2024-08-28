import { IsDefined, IsOptional, IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { NewApiScopeInput, Optional } from '@/datasource';

export abstract class NewApiScopeValidator
  implements Optional<NewApiScopeInput, 'emphasize' | 'required' | 'showInDiscoveryDocument'>
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
}
