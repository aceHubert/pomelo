import { Field, InputType, ID } from '@nestjs/graphql';
import { NewTemplateMetaInput as INewTemplateMetaInput } from '@ace-pomelo/infrastructure-datasource';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New template meta input' })
export class NewTemplateMetaInput extends NewMetaInput implements INewTemplateMetaInput {
  @Field(() => ID, { description: 'Template Id' })
  templateId!: number;
}
