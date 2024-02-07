import { Field, ID, Int, ObjectType, OmitType, IntersectionType } from '@nestjs/graphql';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'File data' })
class FileData {
  /**
   * File name
   */
  fileName!: string;

  /**
   * File path
   */
  path!: string;

  /**
   * Full file path include domain
   */
  fullPath!: string;

  /**
   * File size, unit: KB
   */
  fileSize!: number;

  /**
   * Image width
   */
  @Field((type) => Int)
  width?: number;

  /**
   * Image height
   */
  @Field((type) => Int)
  height?: number;
}

@ObjectType({ description: 'Image file data' })
class ScaleImageFileData extends OmitType(FileData, ['fileSize'] as const) {}

@ObjectType({ description: 'File model' })
class File {
  /**
   * Original file
   */
  @Field((type) => FileData)
  original!: FileData;

  /**
   * Thumbnail
   */
  @Field((type) => ScaleImageFileData)
  thumbnail?: ScaleImageFileData;

  /**
   * Scaled(2560*1440) image
   */
  @Field((type) => ScaleImageFileData, {})
  scaled?: ScaleImageFileData;

  /**
   * Large image
   */
  @Field((type) => ScaleImageFileData)
  large?: ScaleImageFileData;

  /**
   * Medium image
   */
  @Field((type) => ScaleImageFileData)
  medium?: ScaleImageFileData;

  /**
   * Medium-Large image
   */
  @Field((type) => ScaleImageFileData)
  mediumLarge?: ScaleImageFileData;
}

@ObjectType({ description: 'Media model' })
export class Media extends IntersectionType(OmitType(File, ['original'] as const), FileData) {
  /**
   * Media id
   */
  @Field((type) => ID)
  id!: number;

  /**
   * Original file name
   */
  originalFileName!: string;

  /**
   * File extension
   */
  extension!: string;

  /**
   * File mime type
   */
  mimeType!: string;

  /**
   * Creation time
   */
  createdAt!: Date;
}

@ObjectType({ description: 'Paged media model' })
export class PagedMedia extends PagedResponse(Media) {
  // other fields
}

@ObjectType({ description: 'Media meta' })
export class MediaMeta extends Meta {
  /**
   * Media Id
   */
  @Field((type) => ID)
  mediaId!: number;
}
