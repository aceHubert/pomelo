import { ApiResponseProperty, OmitType, IntersectionType } from '@nestjs/swagger';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';

class FileData {
  /**
   * File name
   */
  @ApiResponseProperty()
  fileName!: string;

  /**
   * File path
   */
  @ApiResponseProperty()
  path!: string;

  /**
   * Display path
   */
  @ApiResponseProperty()
  fullPath!: string;

  /**
   * File size, unit: KB
   */
  @ApiResponseProperty()
  fileSize!: number;

  /**
   * Image width
   */
  @ApiResponseProperty()
  width?: number;

  /**
   * Image height
   */
  @ApiResponseProperty()
  height?: number;
}

/**
 * Image file data
 */
class ScaleImageFileData extends OmitType(FileData, ['fileSize'] as const) {}

/**
 * File model
 */
class FileModel {
  /**
   * Original file
   */
  original!: FileData;

  /**
   * Thumbnail
   */
  thumbnail?: ScaleImageFileData;

  /**
   * Scaled(2560*1440) image
   */
  scaled?: ScaleImageFileData;

  /**
   * Large image
   */
  large?: ScaleImageFileData;

  /**
   * Medium image
   */
  medium?: ScaleImageFileData;

  /**
   * Medium-Large image
   */
  mediumLarge?: ScaleImageFileData;
}

export class MediaModelResp extends IntersectionType(OmitType(FileModel, ['original'] as const), FileData) {
  /**
   * Media id
   */
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

export class PagedMediaResp extends PagedResponse(MediaModelResp) {}

export class MediaMetaModelResp extends MetaModelResp {
  /**
   * Media id
   */
  mediaId!: number;
}
