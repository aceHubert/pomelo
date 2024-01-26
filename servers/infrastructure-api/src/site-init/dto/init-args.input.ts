import { InputType, Field } from '@nestjs/graphql';
import { SiteInitArgsValidator } from './init-args.validator';

@InputType({ description: 'Site initial arguments input' })
export class SiteInitArgsInput extends SiteInitArgsValidator {
  @Field({ description: 'Site title' })
  title!: string;

  @Field({ description: 'Admin initial password' })
  password!: string;

  @Field({ description: 'Admin initial email' })
  email!: string;

  @Field({ description: 'Home url' })
  homeUrl!: string;

  @Field({ defaultValue: 'zh-CN', description: 'Site default using language' })
  locale!: string;
}
