import { InputType, PartialType } from '@nestjs/graphql';
import { NewApiResourceInput } from './new-api-resource.input';

@InputType({ description: 'Update identity resource input' })
export class UpdateApiResourceInput extends PartialType(NewApiResourceInput) {}
