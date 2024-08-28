import { InputType, PartialType } from '@nestjs/graphql';
import { NewIdentityResourceInput } from './new-identity-resource.input';

@InputType({ description: 'Update identity resource input' })
export class UpdateIdentityResourceInput extends PartialType(NewIdentityResourceInput) {}
