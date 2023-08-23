import { IsOptional, IsDefined, IsString, IsEnum, MaxLength } from 'class-validator';
import { TemplateStatus } from '@/orm-entities/interfaces/template.interface';

export abstract class NewTemplateValidator {
  @IsDefined()
  @MaxLength(50)
  abstract title: string;

  @IsOptional()
  @MaxLength(50)
  abstract name?: string;

  @IsOptional()
  @MaxLength(250)
  abstract excerpt?: string;

  @IsDefined()
  @IsString()
  abstract content: string;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @IsDefined()
  @IsString()
  abstract type: string;
}
