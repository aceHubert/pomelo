import { IsNotEmpty, IsLocale, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InitArgs } from '@/sequelize-datasources/interfaces';

export class InitArgsDto implements Omit<InitArgs, 'siteUrl'> {
  /**
   * Home url
   */
  @IsNotEmpty({ message: 'field $property is required' })
  @IsUrl({ require_tld: false }, { message: 'field $property must be a URL address' })
  homeUrl!: string;

  /**
   * Site default using language
   */
  @ApiProperty({ default: 'zh-CN' })
  @IsNotEmpty({ message: 'field $property is required' })
  @IsLocale({ message: 'field $property must be a language locale' })
  locale!: string;
}
