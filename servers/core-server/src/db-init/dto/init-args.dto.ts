import { IsNotEmpty, IsLocale, IsUrl, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InitArgs } from '@ace-pomelo/datasource';

export class InitArgsDto implements Omit<InitArgs, 'siteUrl'> {
  /**
   * Site title
   */
  @IsNotEmpty({ message: 'field $property is required' })
  title!: string;

  /**
   * Admin initial password
   */
  @IsNotEmpty({ message: 'field $property is required' })
  @MinLength(6, { message: 'field $property must be at least 6 characters long' })
  password!: string;

  /**
   * Admin initial email
   */
  @IsNotEmpty({ message: 'field $property is required' })
  @IsEmail({}, { message: 'field $property must be a email address' })
  email!: string;

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
