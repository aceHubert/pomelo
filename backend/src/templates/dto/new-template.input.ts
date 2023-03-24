import { Field, InputType, PickType } from '@nestjs/graphql';
import { IsDefined, IsString, IsJSON } from 'class-validator';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { TemplateStatus } from '@/orm-entities/interfaces';
import { NewTemplateValidator } from './new-template.validator';

@InputType({ description: 'New template input' })
export class NewTemplateInput extends NewTemplateValidator {
  @Field({ description: 'Title' })
  title!: string;

  @Field({ nullable: true, description: 'Identity name (generate by title if not provider)' })
  name?: string;

  @Field({ nullable: true, description: 'Short description' })
  excerpt?: string;

  @Field({ description: 'Content' })
  content!: string;

  @Field((type) => TemplateStatus, { nullable: true, description: 'Status' })
  status?: TemplateStatus;

  @Field({ description: 'Type' })
  type!: string;

  @Field((type) => [NewMetaInput!], { nullable: true, description: 'New metas' })
  metas?: NewMetaInput[];
}

@InputType({ description: 'New form input' })
export class NewFormTemplateInput extends PickType(NewTemplateInput, ['title', 'name', 'status', 'metas'] as const) {
  @IsDefined()
  @IsString()
  @IsJSON({ message: 'field $property must be a JSON string' })
  @Field({ description: 'Schema JSON' })
  schema!: string;
}

@InputType({ description: 'New page input' })
export class NewPageTemplateInput extends PickType(NewTemplateInput, ['title', 'name', 'status', 'metas'] as const) {
  @IsDefined()
  @IsString()
  @IsJSON({ message: 'field $property must be a JSON string' })
  @Field({ description: 'Schema JSON' })
  schema!: string;
}

@InputType({ description: 'New post input' })
export class NewPostTemplateInput extends PickType(NewTemplateInput, [
  'title',
  'name',
  'excerpt',
  'content',
  'status',
  'metas',
] as const) {
  // something else
}
