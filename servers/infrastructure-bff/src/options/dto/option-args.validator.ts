import { IsOptional, IsEnum, IsArray, IsString } from 'class-validator';
import { OptionAutoload } from '@ace-pomelo/shared/server';

export abstract class OptionArgsValidator {
  @IsOptional()
  @IsEnum(OptionAutoload)
  autoload?: OptionAutoload;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionNames?: string[];
}
