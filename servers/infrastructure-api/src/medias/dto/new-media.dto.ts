import { ApiProperty } from '@nestjs/swagger';
import { NewMediaValidator, MediaMetaDataValidator } from './new-media.validator';

export class ImageCropOptions {
  /**
   * Left position
   */
  left!: number;

  /**
   * Top position
   */
  top!: number;

  /**
   * Scale width
   */
  width!: number;

  /**
   * Scale height
   */
  height!: number;
}

export class FileUploadDto {
  /**
   * file
   */
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: any;

  /**
   * File name (with extension)
   */
  fileName?: string;

  /**
   * Image crop options
   */
  @ApiProperty({ type: ImageCropOptions, nullable: true, default: undefined })
  crop?: ImageCropOptions;
}

export class FilesUploadDto {
  /**
   * files
   */
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files!: any[];
}

export class ImageCropDto extends ImageCropOptions {
  /**
   * Create new media if set "true", default is "false"
   */
  replace?: boolean;
}

export class MediaMetaDataDto extends MediaMetaDataValidator {
  /**
   * File size
   */
  fileSize!: number;

  /**
   * Image width (Optional)
   */
  width?: number;

  /**
   * Image height (Optional)
   */
  height?: number;
}

export class NewMediaDto extends NewMediaValidator {
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
   * Meta data
   */
  metaData!: MediaMetaDataDto;
}
