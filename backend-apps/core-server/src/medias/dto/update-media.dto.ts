import { PartialType, PickType } from '@nestjs/swagger';
import { NewMediaDto } from './new-media.dto';

export class UpdateMediaDto extends PartialType(
  PickType(NewMediaDto, ['fileName', 'originalFileName', 'extension', 'mimeType', 'path', 'metaData'] as const),
) {}
