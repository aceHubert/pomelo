import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import moment from 'moment';
import Jimp from 'jimp';
import { camelCase } from 'lodash';
import { Inject, Injectable } from '@nestjs/common';
import { RequestUser } from '@pomelo/shared';
import { MediaDataSource, MediaMetaDataModel, ImageScaleModel, OptionPresetKeys, MediaModel } from '@pomelo/datasource';
import { normalizeRoutePath, foregoingSlash, stripTrailingSlash } from '@/common/utils/path.util';
import { FileOptions } from './interfaces/file-options.interface';
import { FileUploadOptions } from './interfaces/file-upload-options.interface';
import { File, ImageScaleType, ImageScales } from './interfaces/file.interface';
import { FILE_OPTIONS } from './constants';

const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

@Injectable()
export class FileService {
  // private readonly logger = new Logger('FileManageService');

  constructor(
    @Inject(FILE_OPTIONS) private readonly options: FileOptions,
    private readonly mediaDataSource: MediaDataSource,
  ) {}

  /**
   * 获取 dest 目录
   */
  private get dest() {
    return this.options.dest ?? `${process.cwd()}/uploads`;
  }

  /**
   * 相对于静态服务器的目录前缀
   */
  private get staticPrefix() {
    return this.options.staticPrefix ?? 'uploads';
  }

  /**
   * 分组 dest 目录
   * 如果不存在会自动创建
   */
  private async getDest(): Promise<string> {
    const year = moment().get('year');
    const month = moment().get('month');
    const dest = path.join(
      this.dest,
      ...(this.options.groupBy === 'year' ? [String(year)] : [String(year), String(month + 1).padStart(2, '0')]),
    );
    try {
      await stat(dest);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // 目录不在在，创建目录
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
      await stat(path);
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return false;
      }
      throw err;
    }
  }

  /**
   * 获取文件md5
   */
  private async getFileMd5(file: string | Buffer): Promise<string> {
    const hash = crypto.createHash('md5');
    let fileBuffer = file as Buffer;
    if (typeof file === 'string') {
      fileBuffer = await readFile(file);
    }
    return hash.update(fileBuffer.toString('binary'), 'binary').digest('hex');
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
   * 是否支持缩放（图片）
   */
  private isImageScaleable(mimeType: string) {
    return ['image/jpeg', 'image/png'].includes(mimeType);
  }

  /**
   * 显示到前端的Url地址（base/staticPrefix/path）
   */
  private getPath(filepath: string, base = '') {
    return stripTrailingSlash(base) + normalizeRoutePath(path.join(this.staticPrefix, filepath));
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
   * @param options 文件参数
   * @param requestUser 请求用户
   */
  async uploadFile(options: FileUploadOptions, requestUser: RequestUser): Promise<MediaModel> {
    const md5 = await this.getFileMd5(options.file);
    let media = await this.mediaDataSource.getByName(md5, [
      'id',
      'fileName',
      'originalFileName',
      'extension',
      'mimeType',
      'path',
      'createdAt',
    ]);

    if (!media) {
      const extension = path.extname(options.originalName);
      const originalFileName = path.basename(options.originalName, extension);
      const dest = await this.getDest();
      const filePath = path.join(dest, `${md5}${extension}`);

      // 文件不存在
      if (!(await this.isExists(filePath))) {
        if (typeof options.file === 'string') {
          const content = await readFile(options.file);

          await writeFile(filePath, content, 'utf8');
        } else {
          await writeFile(filePath, options.file, 'utf8');
        }
      }

      const fileStat = await stat(filePath);

      const metaData: MediaMetaDataModel = {
        fileSize: fileStat.size,
      };

      // 是否支持 Jimp 操作
      if (Object.keys(Jimp.decoders).includes(options.mimeType)) {
        const image = await Jimp.create(filePath);
        metaData.width = image.getWidth();
        metaData.height = image.getHeight();

        if (this.isImageScaleable(options.mimeType)) {
          const imageScales: ImageScaleModel[] = [];
          // thumbnail
          const width = await this.mediaDataSource.getOption(OptionPresetKeys.ThumbnailSizeWidth);
          const height = await this.mediaDataSource.getOption(OptionPresetKeys.ThumbnailSizeHeight);
          const crop = await this.mediaDataSource.getOption<'0' | '1'>(OptionPresetKeys.ThumbnailCrop);
          const thumbnail = await this.scaleToThumbnail(
            image,
            (imgOptions) => this.getImageDestWithSuffix(filePath, `${imgOptions.width}x${imgOptions.height}`),
            width ? parseInt(width) : void 0,
            height ? parseInt(height) : void 0,
            50,
            crop === '1',
          );
          imageScales.push({ ...thumbnail, name: ImageScaleType.Thumbnail });

          // scaled
          const scaled = await this.scaleImage(
            filePath,
            () => this.getImageDestWithSuffix(filePath, ImageScaleType.Scaled),
            2560,
            1440,
            80,
          );
          scaled && imageScales.push({ ...scaled, name: ImageScaleType.Scaled });

          // other sizes
          const mediumWidth = parseInt((await this.mediaDataSource.getOption(OptionPresetKeys.MediumSizeWidth))!);
          const mediumHeight = parseInt((await this.mediaDataSource.getOption(OptionPresetKeys.MediumSizeHeight))!);
          const largeWidth = parseInt((await this.mediaDataSource.getOption(OptionPresetKeys.LargeSizeWidth))!);
          const largeHeight = parseInt((await this.mediaDataSource.getOption(OptionPresetKeys.LargeSizeHeight))!);
          const mediumLargeWidth = parseInt(
            (await this.mediaDataSource.getOption(OptionPresetKeys.MediumLargeSizeWidth))!,
          );
          const mediumLargeHeight = parseInt(
            (await this.mediaDataSource.getOption(OptionPresetKeys.MediumLargeSizeHeight))!,
          );
          const resizeArr = [
            { name: ImageScaleType.Large, width: largeWidth, height: largeHeight, quality: 80 },
            { name: ImageScaleType.MediumLarge, width: mediumLargeWidth, height: mediumLargeHeight, quality: 70 },
            { name: ImageScaleType.Medium, width: mediumWidth, height: mediumHeight, quality: 50 },
          ];

          await Promise.all(
            resizeArr.map(async (item) => {
              const scale = await this.scaleImage(
                filePath,
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
      }

      media = await this.mediaDataSource.create(
        {
          fileName: md5,
          originalFileName: originalFileName,
          extension,
          mimeType: options.mimeType,
          path: foregoingSlash(path.relative(this.dest, filePath)),
        },
        metaData,
        requestUser,
      );
    }

    return media;
  }

  /**
   * 转换成 FileModel
   * @param media Media Model
   * @param metaData Media metadata
   */
  async toFileModel(media: MediaModel, metaData?: MediaMetaDataModel): Promise<File> {
    const siteUrl = await this.mediaDataSource.getOption(OptionPresetKeys.SiteUrl);
    const fileName = `${media.fileName}${media.extension}`;
    const { imageScales = [], fileSize, width, height } = metaData ?? { fileSize: 0 };
    return {
      original: {
        fileName,
        path: this.getPath(media.path),
        fullPath: this.getPath(media.path, siteUrl),
        fileSize,
        width,
        height,
      },
      ...imageScales.reduce((prev, scale) => {
        prev[camelCase(scale.name) as keyof ImageScales] = {
          fileName,
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
    quality = 70,
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
    await image.quality(quality || 100).write(dest);
    return {
      width: imageWidth,
      height: imageHeight,
      path: foregoingSlash(path.relative(this.dest, dest)),
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
    quality = 70,
  ): Promise<Omit<ImageScaleModel, 'name'> | undefined> {
    if (typeof image === 'string') {
      image = await Jimp.create(image);
    } else {
      // 后面的操作会改变Jimp对象，这里使用clone的对象处理
      image = image.clone();
    }
    const imageWidth = image.getWidth();
    const imageHeight = image.getHeight();
    if (imageWidth > width || imageHeight > height) {
      if (width === 0 || height === 0) {
        image.resize(width || Jimp.AUTO, height || Jimp.AUTO);
      } else {
        image.scaleToFit(width, height);
      }
      if (typeof dest === 'function') {
        dest = dest({ width: image.getWidth(), height: image.getHeight() });
      }
      image.quality(quality).write(dest);
      return {
        width: imageWidth,
        height: imageHeight,
        path: foregoingSlash(path.relative(this.dest, dest)),
      };
    }
    return;
  }
}
