import { IsString, IsDefined, IsOptional, IsEnum } from 'class-validator';
import { OptionAutoload } from '@/orm-entities/interfaces/options.interface';

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
