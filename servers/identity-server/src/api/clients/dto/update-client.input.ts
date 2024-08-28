import { InputType, OmitType, PartialType } from '@nestjs/graphql';
import { NewClientInput } from './new-client.input';

@InputType({ description: 'Update client input' })
export class UpdateClientInput extends PartialType(OmitType(NewClientInput, ['clientId'] as const)) {}
