import { Field, ID, Int, ObjectType, OmitType, IntersectionType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { DateTimeISOResolver } from 'graphql-scalars';
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
  @Field(() => Int)
  width?: number;

  /**
   * Image height
   */
  @Field(() => Int)
  height?: number;
}

@ObjectType({ description: 'Image file data' })
class ScaleImageFileData extends OmitType(FileData, ['fileSize'] as const) {}

@ObjectType({ description: 'File model' })
class File {
  /**
   * Original file
   */
  @Field(() => FileData)
  original!: FileData;

  /**
   * Thumbnail
   */
  @Field(() => ScaleImageFileData)
  thumbnail?: ScaleImageFileData;

  /**
   * Scaled(2560*1440) image
   */
  @Field(() => ScaleImageFileData, {})
  scaled?: ScaleImageFileData;

  /**
   * Large image
   */
  @Field(() => ScaleImageFileData)
  large?: ScaleImageFileData;

  /**
   * Medium image
   */
  @Field(() => ScaleImageFileData)
  medium?: ScaleImageFileData;

  /**
   * Medium-Large image
   */
  @Field(() => ScaleImageFileData)
  mediumLarge?: ScaleImageFileData;
}

@ObjectType({ description: 'Media model' })
export class Media extends IntersectionType(OmitType(File, ['original'] as const), FileData) {
  /**
   * Media id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
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
  @Field(() => DateTimeISOResolver)
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
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  mediaId!: number;
}
