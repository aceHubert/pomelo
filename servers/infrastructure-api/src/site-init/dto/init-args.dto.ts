import { ApiProperty } from '@nestjs/swagger';
import { SiteInitArgsValidator } from './init-args.validator';

export class SiteInitArgsDto extends SiteInitArgsValidator {
  /**
   * Site title
   */
  title!: string;

  /**
   * Admin initial password
   */
  password!: string;

  /**
   * Admin initial email
   */
  email!: string;

  /**
   * Home url
   */
  homeUrl!: string;

  /**
   * Site default using language
   */
  @ApiProperty({ default: 'zh-CN' })
  locale!: string;
}
