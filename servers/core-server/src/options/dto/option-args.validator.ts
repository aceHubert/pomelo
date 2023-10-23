import { IsOptional, IsEnum } from 'class-validator';
import { OptionAutoload } from '@pomelo/datasource';

export abstract class OptionArgsValidator {
  @IsOptional()
  @IsEnum(OptionAutoload)
  autoload?: OptionAutoload;
}
