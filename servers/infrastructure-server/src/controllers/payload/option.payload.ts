import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import { RequestUserIdPayload } from './common.payload';

export class ListOptionQueryPayload {
  @IsOptional()
  @IsNotEmpty()
  @IsString({ each: true })
  optionNames?: string[];
  /**
   * 是否自动加载
   */
  @IsOptional()
  @IsEnum(OptionAutoload)
  autoload?: OptionAutoload;
}

export class NewOptionPayload extends RequestUserIdPayload {
  @IsString()
  @IsNotEmpty()
  optionName!: string;

  @IsString()
  @IsNotEmpty()
  optionValue!: string;

  /**
   * 是否自动加载
   */
  @IsOptional()
  @IsEnum(OptionAutoload)
  autoload?: OptionAutoload;
}

export class UpdateOptionPayload extends IntersectionType(
  PickType(NewOptionPayload, ['optionValue'] as const),
  RequestUserIdPayload,
) {
  @IsPositive()
  id!: number;
}
