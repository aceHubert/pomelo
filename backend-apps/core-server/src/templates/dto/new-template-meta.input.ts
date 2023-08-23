import { Field, InputType, ID } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { NewTemplateMetaInput as INewTemplateMetaInput } from '@/sequelize-datasources/interfaces';

@InputType({ description: 'New template meta input' })
export class NewTemplateMetaInput extends NewMetaInput implements INewTemplateMetaInput {
  @Field(() => ID, { description: 'Template Id' })
  templateId!: number;
}
