import { InputType } from '@nestjs/graphql';
import { NewApiScopeInput } from './new-api-scope.input';

@InputType({ description: 'Update api scope input' })
export class UpdateApiScopeInput extends NewApiScopeInput {}
