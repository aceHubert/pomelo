import { IsOptional, IsEnum } from 'class-validator';
import { OptionAutoload } from '@ace-pomelo/datasource';

export abstract class OptionArgsValidator {
  @IsOptional()
  @IsEnum(OptionAutoload)
  autoload?: OptionAutoload;
}
