import { IsOptional, IsEnum } from 'class-validator';
import { OptionAutoload } from '@ace-pomelo/infrastructure-datasource';

export abstract class OptionArgsValidator {
  @IsOptional()
  @IsEnum(OptionAutoload)
  autoload?: OptionAutoload;
}
