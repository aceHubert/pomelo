import { Field, InputType, Int } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { NewMediaValidator, MediaMetaDataValidator } from './new-media.validator';

@InputType({ description: 'Crop image Option' })
export abstract class ImageCropOptions {
  @Field((type) => Int, { description: 'Left position' })
  left!: number;

  @Field((type) => Int, { description: 'Top position' })
  top!: number;

  @Field((type) => Int, { description: 'Scale width' })
  width!: number;

  @Field((type) => Int, { description: 'Scale height' })
  height!: number;
}

@InputType()
export class FileUploadOptionsInput {
  @Field({ nullable: true, description: 'File name (with extension)' })
  fileName?: string;

  @Field((type) => ImageCropOptions, { description: 'Image crop options' })
  crop?: ImageCropOptions;
}

@InputType()
export class ImageCropOptionsInput extends ImageCropOptions {
  @Field({ defaultValue: false, description: 'Create new media if set "true", default is "false"' })
  replace?: boolean;
}

@InputType()
export class NewMediaInput extends NewMediaValidator {
  @Field({ description: 'File name (without extension)' })
  fileName!: string;

  @Field({ description: 'Original file name (without extension)' })
  originalFileName!: string;

  @Field({ description: 'Extension' })
  extension!: string;

  @Field({ description: 'Mime type' })
  mimeType!: string;

  @Field({ description: 'Path' })
  path!: string;

  @Field((type) => [NewMetaInput!], { nullable: true, description: 'New metas' })
  metas?: NewMetaInput[];
}

@InputType()
export class MediaMetaDataInput extends MediaMetaDataValidator {
  @Field({ description: 'File size' })
  fileSize!: number;

  @Field({ nullable: true, description: 'Image width (Optional)' })
  width?: number;

  @Field({ nullable: true, description: 'Image height (Optional)' })
  height?: number;
}
