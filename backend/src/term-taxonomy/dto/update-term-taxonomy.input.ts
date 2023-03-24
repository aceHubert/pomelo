import { InputType, PartialType, PickType } from '@nestjs/graphql';
import { NewTermTaxonomyInput } from './new-term-taxonomy.input';

@InputType({ description: 'Update term taxonomy input' })
export class UpdateTermTaxonomyInput extends PartialType(
  PickType(NewTermTaxonomyInput, ['name', 'slug', 'description', 'group', 'parentId'] as const),
) {}
