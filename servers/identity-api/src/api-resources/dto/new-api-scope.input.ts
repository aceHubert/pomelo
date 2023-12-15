import { InputType, Field } from '@nestjs/graphql';
import { NewApiScopeValidator } from './new-api-scope.validator';

@InputType({ description: 'New api scope input' })
export class NewApiScopeInput extends NewApiScopeValidator {
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
}
