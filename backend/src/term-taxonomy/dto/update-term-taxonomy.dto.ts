import { PartialType, PickType } from '@nestjs/swagger';
import { NewTermTaxonomyDto } from './new-term-taxonomy.dto';

export class UpdateTermTaxonomyDto extends PartialType(
  PickType(NewTermTaxonomyDto, ['name', 'slug', 'description', 'group', 'parentId'] as const),
) {}
