import { InputType, Field } from '@nestjs/graphql';
import { SiteInitArgsValidator } from './init-args.validator';

@InputType({ description: 'Site initial arguments input' })
export class SiteInitArgsInput extends SiteInitArgsValidator {
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
  @Field({ defaultValue: 'en-US' })
  locale!: string;
}
