import { IsOptional, IsDefined, IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { NewApiResourceInput, Optional } from '@/datasource';

export abstract class NewApiResourceValidator implements Optional<NewApiResourceInput, 'nonEditable' | 'enabled'> {
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
  abstract nonEditable?: boolean;

  @IsOptional()
  @IsBoolean()
  abstract enabled?: boolean;
}
