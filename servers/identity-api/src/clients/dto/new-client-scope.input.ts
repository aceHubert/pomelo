import { InputType, Field } from '@nestjs/graphql';
import { NewClientScopeValidator } from './new-client-scope.validator';

@InputType({ description: 'New client scope input' })
export class NewClientScopeInput extends NewClientScopeValidator {
  @Field({ description: 'Scope' })
  scope!: string;
}
