import { IsString, IsDefined, IsOptional, IsEnum } from 'class-validator';
import { OptionAutoload } from '@ace-pomelo/infrastructure-datasource';

export abstract class NewOptionValidator {
  @IsDefined()
  @IsString()
  abstract optionName: string;

  @IsDefined()
  @IsString()
  abstract optionValue: string;

  @IsOptional()
  @IsEnum(OptionAutoload)
  abstract autoload?: OptionAutoload;
}
