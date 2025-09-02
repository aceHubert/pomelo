import { Field, InputType, Int } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';
import { NewMediaValidator, MediaMetaDataValidator } from './new-media.validator';

@InputType({ description: 'Crop image Option' })
export abstract class ImageCropOptions {
  /**
   * Left position
   */
  @Field(() => Int)
  left!: number;

  /**
   * Top position
   */
  @Field(() => Int)
  top!: number;

  /**
   * Scale width
   */
  @Field(() => Int)
  width!: number;

  /**
   * Scale height
   */
  @Field(() => Int)
  height!: number;
}

@InputType()
export class FileUploadOptionsInput {
  /**
   * File name (with extension)
   */
  fileName?: string;

  /**
   * Image crop options
   */
  @Field(() => ImageCropOptions)
  crop?: ImageCropOptions;
}

@InputType()
export class ImageCropOptionsInput extends ImageCropOptions {
  /**
   * Create new media if set "true"
   */
  @Field({ defaultValue: false })
  replace?: boolean;
}

@InputType()
export class NewMediaInput extends NewMediaValidator {
  /**
   * File name (without extension)
   */
  fileName!: string;

  /**
   * Original file name (without extension)
   */
  originalFileName!: string;

  /**
   * Extension
   */
  extension!: string;

  /**
   * Mime type
   */
  mimeType!: string;

  /**
   * Path
   */
  path!: string;

  /**
   * New metas
   */
  metas?: NewMetaInput[];
}

@InputType()
export class MediaMetaDataInput extends MediaMetaDataValidator {
  /**
   * File size
   */
  fileSize!: number;

  /**
   * Image width
   */
  width?: number;

  /**
   * Image height
   */
  height?: number;
}
