import { InputType, Field } from '@nestjs/graphql';
import { NewApiResourceValidator } from './new-api-resource.validator';

@InputType({ description: 'New client input' })
export class NewApiResourceInput extends NewApiResourceValidator {
  @Field({ description: 'Name' })
  name!: string;

  @Field({ nullable: true, description: 'Display name' })
  displayName?: string;

  @Field({ nullable: true, description: 'Description' })
  description?: string;

  @Field({ nullable: true, description: 'Non editable' })
  nonEditable?: boolean;

  @Field({ nullable: true, description: 'Enabled' })
  enabled?: boolean;
}
