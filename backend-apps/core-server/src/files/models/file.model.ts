import { Field, ID, ObjectType, OmitType, IntersectionType } from '@nestjs/graphql';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'File data' })
class FileData {
  @Field({ description: 'File name' })
  fileName!: string;

  @Field({ description: 'File path' })
  path!: string;

  @Field({ description: 'Full file path include siteurl' })
  fullPath!: string;

  @Field({ description: 'File size, unit: KB' })
  fileSize!: number;

  @Field({ nullable: true, description: 'Image width' })
  width?: number;

  @Field({ nullable: true, description: 'Image height' })
  height?: number;
}

@ObjectType({ description: 'Image file data' })
class ScaleImageFileData extends OmitType(FileData, ['fileSize'] as const) {}

@ObjectType({ description: 'File model' })
class File {
  @Field((type) => FileData, { description: 'Original file' })
  original!: FileData;

  @Field((type) => ScaleImageFileData, { description: 'Thumbnail' })
  thumbnail?: ScaleImageFileData;

  @Field((type) => ScaleImageFileData, { description: 'Scaled(2560*1440) image' })
  scaled?: ScaleImageFileData;

  @Field((type) => ScaleImageFileData, { description: 'Large image' })
  large?: ScaleImageFileData;

  @Field((type) => ScaleImageFileData, { description: 'Medium image' })
  medium?: ScaleImageFileData;

  @Field((type) => ScaleImageFileData, { description: 'Medium-Large image' })
  mediumLarge?: ScaleImageFileData;
}

@ObjectType({ description: 'Media model' })
export class Media extends IntersectionType(OmitType(File, ['original'] as const), FileData) {
  @Field((type) => ID, { description: 'Media id' })
  id!: number;

  @Field({ description: 'Original file name' })
  originalFileName!: string;

  @Field({ description: 'File extension' })
  extension!: string;

  @Field({ description: 'File mime type' })
  mimeType!: string;

  @Field({ description: 'Creation time' })
  createdAt!: Date;
}

@ObjectType({ description: 'Paged media model' })
export class PagedMedia extends PagedResponse(Media) {
  // other fields
}

@ObjectType({ description: 'Media meta' })
export class MediaMeta extends Meta {
  @Field((type) => ID, { description: 'Media Id' })
  mediaId!: number;
}
