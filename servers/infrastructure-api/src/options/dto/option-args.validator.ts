import { IsOptional, IsEnum } from 'class-validator';
import { OptionAutoload } from '@ace-pomelo/shared/server';

export abstract class OptionArgsValidator {
  @IsOptional()
  @IsEnum(OptionAutoload)
  autoload?: OptionAutoload;
}
