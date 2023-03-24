import { IsOptional, IsEnum } from 'class-validator';
import { OptionAutoload } from '@/orm-entities/interfaces/options.interface';

export abstract class OptionArgsValidator {
  @IsOptional()
  @IsEnum(OptionAutoload)
  autoload?: OptionAutoload;
}
