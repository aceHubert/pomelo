import { InputType, Field } from '@nestjs/graphql';
import { NewIdentityResourceValidator } from './new-identity-resource.validator';

@InputType({ description: 'New client input' })
export class NewIdentityResourceInput extends NewIdentityResourceValidator {
  @Field({ description: 'Name' })
  name!: string;

  @Field({ nullable: true, description: 'Display name' })
  displayName?: string;

  @Field({ nullable: true, description: 'Description' })
  description?: string;

  @Field({ nullable: true, description: 'Emphasize' })
  emphasize?: boolean;

  @Field({ nullable: true, description: 'Required' })
  required?: boolean;

  @Field({ nullable: true, description: 'Show in discovery document' })
  showInDiscoveryDocument?: boolean;

  @Field({ nullable: true, description: 'Non editable' })
  nonEditable?: boolean;

  @Field({ nullable: true, description: 'Enabled' })
  enabled?: boolean;
}
