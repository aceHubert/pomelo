import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import moment from 'moment';
import Jimp from 'jimp';
import { camelCase } from 'lodash-es';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  md5,
  normalizeRoutePath,
  foregoingSlash,
  stripTrailingSlash,
  isAbsoluteUrl,
  OptionPresetKeys,
  INFRASTRUCTURE_SERVICE,
  OptionPattern,
} from '@ace-pomelo/shared/server';
import { MediaOptions } from './interfaces/media-options.interface';
import {
  File,
  ImageScaleType,
  ImageScales,
  FileSaveOptions,
  ImageScaleModel,
  MediaMetaDataModel,
  MediaModel,
} from './interfaces/media.interface';
import { MEDIA_OPTIONS } from './constants';

const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

@Injectable()
export class MediaService {
  private logger = new Logger('MediaService', { timestamp: true });
  private quality: Record<ImageScaleType, number>;

  constructor(
    @Inject(MEDIA_OPTIONS) private readonly options: Required<MediaOptions>,
    @Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy,
  ) {
    this.quality =
      typeof options.quality === 'number'
        ? Object.values(ImageScaleType).reduce((prev, curr) => {
            prev[curr] = options.quality as number;
            return prev;
          }, {} as Record<ImageScaleType, number>)
        : Object.assign(
            {
              [ImageScaleType.Thumbnail]: 70,
              [ImageScaleType.Scaled]: 80,
              [ImageScaleType.Medium]: 70,
              [ImageScaleType.MediumLarge]: 70,
              [ImageScaleType.Large]: 80,
            },
            options.quality,
          );
  }

  /**
   * 分组 dest 目录
   * 如果不存在会自动创建
   */
  private async getDest(): Promise<string> {
    const year = moment().get('year');
    const month = moment().get('month');
    const dest = path.join(
      this.options.dest,
      this.options.staticPrefix,
      ...(this.options.groupBy === 'year' ? [String(year)] : [String(year), String(month + 1).padStart(2, '0')]),
    );
    try {
      const stats = await stat(dest);
      if (!stats.isDirectory()) {
        this.logger.debug(`Directory not exists, creating directory: ${dest}`);
        await mkdir(dest, { recursive: true });
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.logger.debug(`Directory not exists, creating directory: ${dest}`);
        await mkdir(dest, { recursive: true });
      } else {
        throw err;
      }
    }
    return dest;
  }

  /**
   * 文件是否在在
   */
  private async isExists(path: string): Promise<boolean> {
    try {
      const stats = await stat(path);
      return stats.isFile();
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.logger.debug(`File not exists: ${path}`);
        return false;
      }
      throw err;
    }
  }

  /**
   * 获取带后缀的图片路径
   * @param imagePath 源图片路径
   * @param suffix 后缀
   */
  private getImageDestWithSuffix(imagePath: string, suffix: string) {
    const dir = path.dirname(imagePath);
    const extension = path.extname(imagePath);
    const filename = path.basename(imagePath, extension);
    return path.join(dir, `${filename}-${suffix}${extension}`);
  }

  /**
   * 显示到前端的Url地址（base/path）
   */
  private getPath(filepath: string, base = '') {
    if (isAbsoluteUrl(filepath)) return filepath;

    return stripTrailingSlash(base) + normalizeRoutePath(filepath);
  }

  /**
   * 是否支持缩放（图片）
   */
  isScaleable(mimeType: string) {
    return ['image/jpeg', 'image/png'].includes(mimeType);
  }

  /**
   * 是否支持裁切（图片）
   */
  isCropable(mimeType: string) {
    return Object.keys(Jimp.decoders).includes(mimeType);
  }

  /**
   * 获取文件md5
   */
  async getFileMd5(file: string | Buffer): Promise<string> {
    let fileBuffer = file as Buffer;
    if (typeof file === 'string') {
      fileBuffer = await readFile(file);
    }
    return md5(fileBuffer.toString('binary'), 'binary').toString();
  }

  /**
   * stream 转 buffer
   */
  async stream2Buffer(stream: fs.ReadStream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const _buf = Array<any>();

      stream.on('data', (chunk) => _buf.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(_buf)));
      stream.on('error', (err) => reject(`error converting stream - ${err}`));
    });
  }

  /**
   * 上传文件
   * 返回原始文件参数在 original 上，如果是图片，还会生成缩略图和不同尺寸的图片，key 分别是：thumbnail、scaled、{width}x{height}
   * @param file 临时文件地址 或 文件流
   * @param options 上传文件参数
   * @param requestUser 请求用户
   */
  async saveFile(
    file: string | Buffer,
    options: FileSaveOptions,
  ): Promise<{
    /** md5, 如果是裁切的图片，md5 会变更 */
    md5: string;
    originalFileName: string;
    extension: string;
    path: string;
    metaData: MediaMetaDataModel;
  }> {
    const extension = path.extname(options.originalName);
    const originalFileName = path.basename(options.originalName, extension);
    const dest = await this.getDest();

    if (typeof file === 'string') {
      file = await readFile(file);
    }

    let md5 = options.md5 ?? (await this.getFileMd5(file));
    let filePath = path.join(dest, `${md5}${extension}`);

    const metaData: MediaMetaDataModel = {
      fileSize: Buffer.byteLength(file),
    };

    // 是否支持 Jimp 操作
    if (this.isCropable(options.mimeType)) {
      let image = await Jimp.create(file);

      // 裁切
      if (options.crop) {
        const { left, top, width, height } = options.crop;
        image = await image.crop(left, top, width, height);

        // 裁切之后 hash 变更，重新计算
        const cropedImage = await image.getBufferAsync(options.mimeType);
        md5 = await this.getFileMd5(cropedImage);
        filePath = path.join(dest, `${md5}${extension}`);
        metaData.fileSize = Buffer.byteLength(cropedImage);

        // 保存图片
        await image.writeAsync(filePath);
      } else if (!(await this.isExists(filePath))) {
        // 保存图片
        await image.writeAsync(filePath);
      }

      metaData.width = image.getWidth();
      metaData.height = image.getHeight();

      if (this.isScaleable(options.mimeType)) {
        const imageScales: ImageScaleModel[] = [];
        // thumbnail
        const {
          [OptionPresetKeys.ThumbnailSizeWidth]: width = '150',
          [OptionPresetKeys.ThumbnailSizeHeight]: height = '150',
          [OptionPresetKeys.ThumbnailCrop]: crop = '1',
        } = await this.basicService
          .send<Array<{ optionName: string; optionValue: string | undefined }>>(OptionPattern.GetList, {
            query: {
              optionNames: [
                OptionPresetKeys.ThumbnailSizeWidth,
                OptionPresetKeys.ThumbnailSizeHeight,
                OptionPresetKeys.ThumbnailCrop,
              ],
            },
            fields: ['optionName', 'optionValue'],
          })
          .lastValue()
          .then((res) =>
            res.reduce((prev, curr) => {
              prev[curr.optionName] = curr.optionValue;
              return prev;
            }, {} as Record<string, string | undefined>),
          );
        const thumbnail = await this.scaleToThumbnail(
          image,
          (imgOptions) => this.getImageDestWithSuffix(filePath, `${imgOptions.width}x${imgOptions.height}`),
          parseInt(width),
          parseInt(height),
          this.quality[ImageScaleType.Thumbnail],
          crop === '1',
        );
        imageScales.push({ ...thumbnail, name: ImageScaleType.Thumbnail });

        // scaled
        const scaled = await this.scaleImage(
          image,
          () => this.getImageDestWithSuffix(filePath, ImageScaleType.Scaled),
          2560,
          1440,
          this.quality[ImageScaleType.Scaled],
        );
        scaled && imageScales.push({ ...scaled, name: ImageScaleType.Scaled });

        // other sizes
        const {
          [OptionPresetKeys.MediumSizeWidth]: mediumWidth = '300',
          [OptionPresetKeys.MediumSizeHeight]: mediumHeight = '300',
          [OptionPresetKeys.LargeSizeWidth]: largeWidth = '1200',
          [OptionPresetKeys.LargeSizeHeight]: largeHeight = '1200',
          [OptionPresetKeys.MediumLargeSizeWidth]: mediumLargeWidth = '768',
          [OptionPresetKeys.MediumLargeSizeHeight]: mediumLargeHeight = '0',
        } = await this.basicService
          .send<Array<{ optionName: string; optionValue: string | undefined }>>(OptionPattern.GetList, {
            query: {
              optionNames: [
                OptionPresetKeys.MediumSizeWidth,
                OptionPresetKeys.MediumSizeHeight,
                OptionPresetKeys.LargeSizeWidth,
                OptionPresetKeys.LargeSizeHeight,
                OptionPresetKeys.MediumLargeSizeWidth,
                OptionPresetKeys.MediumLargeSizeHeight,
              ],
            },
            fields: ['optionName', 'optionValue'],
          })
          .lastValue()
          .then((res) =>
            res.reduce((prev, curr) => {
              prev[curr.optionName] = curr.optionValue;
              return prev;
            }, {} as Record<string, string | undefined>),
          );

        const resizeArr = [
          {
            name: ImageScaleType.Large,
            width: parseInt(largeWidth),
            height: parseInt(largeHeight),
            quality: this.quality[ImageScaleType.Large],
          },
          {
            name: ImageScaleType.MediumLarge,
            width: parseInt(mediumLargeWidth),
            height: parseInt(mediumLargeHeight),
            quality: this.quality[ImageScaleType.MediumLarge],
          },
          {
            name: ImageScaleType.Medium,
            width: parseInt(mediumWidth),
            height: parseInt(mediumHeight),
            quality: this.quality[ImageScaleType.Medium],
          },
        ];

        await Promise.all(
          resizeArr.map(async (item) => {
            const scale = await this.scaleImage(
              image,
              (imgOptions) => this.getImageDestWithSuffix(filePath, `${imgOptions.width}x${imgOptions.height}`),
              item.width,
              item.height,
              item.quality,
            );
            scale && imageScales.push({ ...scale, name: item.name });
          }),
        );

        metaData.imageScales = imageScales;
      }
    } else if (!(await this.isExists(filePath))) {
      await writeFile(filePath, file, 'utf8');
    }

    return {
      md5,
      originalFileName,
      extension,
      path: foregoingSlash(path.relative(this.options.dest, filePath)),
      metaData,
    };
  }

  /**
   * 转换成 FileModel
   * @param media Media Model
   * @param metaData Media metadata
   */
  async toFileModel(media: MediaModel, metaData?: MediaMetaDataModel): Promise<File> {
    const siteUrl = await this.basicService
      .send<string>(OptionPattern.GetValue, {
        optionName: OptionPresetKeys.SiteUrl,
      })
      .lastValue();
    const { imageScales = [], fileSize, width, height } = metaData ?? { fileSize: 0 };
    return {
      original: {
        fileName: media.fileName,
        path: this.getPath(media.path),
        fullPath: this.getPath(media.path, siteUrl),
        fileSize,
        width,
        height,
      },
      ...imageScales.reduce((prev, scale) => {
        prev[camelCase(scale.name) as keyof ImageScales] = {
          fileName: media.fileName,
          path: this.getPath(scale.path),
          fullPath: this.getPath(scale.path, siteUrl),
          width: scale.width,
          height: scale.height,
        };
        return prev;
      }, {} as Partial<ImageScales>),
    };
  }

  /**
   * 生成略缩图
   * @param image 源图片路径或Jimp对象
   * @param width 宽度
   * @param height 高度
   * @param quality 质量，0-100 之间
   * @param crop 是否裁剪
   */
  async scaleToThumbnail(
    image: string | Jimp,
    dest: string | ((opts: { width: number; height: number }) => string),
    width = 150,
    height = 150,
    quality = 100,
    crop = true,
  ): Promise<Omit<ImageScaleModel, 'name'>> {
    if (typeof image === 'string') {
      image = await Jimp.create(image);
    } else {
      // 后面的操作会改变Jimp对象，这里使用clone的对象处理
      image = image.clone();
    }

    if (crop) {
      image.cover(width, height);
    } else {
      image.scaleToFit(width, height);
    }
    const imageWidth = image.getWidth();
    const imageHeight = image.getHeight();
    if (typeof dest === 'function') {
      dest = dest({ width: imageWidth, height: imageHeight });
    }
    await image.quality(quality).write(dest);
    return {
      width: imageWidth,
      height: imageHeight,
      path: foregoingSlash(path.relative(this.options.dest, dest)),
    };
  }

  /**
   * 缩放图片
   * @param image 源图片路径或Jimp对象
   * @param width 宽度
   * @param height 高度
   * @param quality 质量，0-100 之间
   */
  async scaleImage(
    image: string | Jimp,
    dest: string | ((args: { width: number; height: number }) => string),
    width: number,
    height: number,
    quality = 100,
  ): Promise<Omit<ImageScaleModel, 'name'> | undefined> {
    if (typeof image === 'string') {
      image = await Jimp.create(image);
    } else {
      // 后面的操作会改变Jimp对象，这里使用clone的对象处理
      image = image.clone();
    }
    let imageWidth = image.getWidth();
    let imageHeight = image.getHeight();
    if (imageWidth > width || imageHeight > height) {
      if (width === 0 || height === 0) {
        image.resize(width || Jimp.AUTO, height || Jimp.AUTO);
      } else {
        image.scaleToFit(width, height);
      }
      imageWidth = image.getWidth();
      imageHeight = image.getHeight();
      if (typeof dest === 'function') {
        dest = dest({ width: imageWidth, height: imageHeight });
      }
      image.quality(quality).write(dest);
      return {
        width: imageWidth,
        height: imageHeight,
        path: foregoingSlash(path.relative(this.options.dest, dest)),
      };
    }
    return;
  }
}
