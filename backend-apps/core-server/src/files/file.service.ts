import { promisify } from 'util';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import moment from 'moment';
import Jimp from 'jimp';
import { Inject, Injectable } from '@nestjs/common';
import { RequestUser } from '@pomelo/shared';
import { MediaDataSource, MediaMetaModel, OptionPresetKeys, MediaMetaPresetKeys } from '@pomelo/datasource';
import { normalizeRoutePath, foregoingSlash, stripTrailingSlash } from '@/common/utils/path.util';
import { FileOptions } from './interfaces/file-options.interface';
import { FileUploadOptions } from './interfaces/file-upload-options.interface';
import { ImageScaleData } from './interfaces/image-metadata.interface';
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
   * 是否是图片
   */
  private isImage(mimeType: string) {
    return mimeType.startsWith('image/');
  }

  /**
   * 是否支持缩放（图片）
   */
  private isImageScaleable(mimeType: string) {
    return ['image/jpeg', 'image/png'].includes(mimeType);
  }

  /**
   * 显示到前端的Url地址（siteUrl/staticPrefix/path）
   */
  async getURI(path: string) {
    const siteUrl = await this.mediaDataSource.getOption(OptionPresetKeys.SiteUrl);
    return (
      (siteUrl ? stripTrailingSlash(siteUrl) : '') + stripTrailingSlash(this.staticPrefix) + normalizeRoutePath(path)
    );
  }

  /**
   * 上传文件
   * 返回原始文件参数在 original 上，如果是图片，还会生成缩略图和不同尺寸的图片，key 分别是：thumbnail、scaled、{width}x{height}
   * @param options 文件参数
   * @param requestUser 请求用户
   */
  async uploadFile(
    options: FileUploadOptions,
    requestUser: RequestUser,
  ): Promise<Dictionary<{ fileName: string; path: string }>> {
    const md5 = await this.getFileMd5(options.file);
    let media = await this.mediaDataSource.getByName(md5, ['originalFileName', 'extension', 'mimeType', 'path']);
    let mediaMetas: MediaMetaModel[] | null = null;
    if (!media) {
      const extension = path.extname(options.originalName);
      const originalFileName = path.basename(options.originalName, extension);
      const dest = await this.getDest();
      const filePath = path.join(dest, `${md5}${extension}`);

      // 文件不在在
      if (!(await this.isExists(filePath))) {
        if (typeof options.file === 'string') {
          const content = await readFile(options.file);
          await writeFile(filePath, content, 'utf8');
        } else {
          await writeFile(filePath, options.file, 'utf8');
        }
      }

      const fileStat = await stat(filePath);

      const metaDatas: Dictionary<any> = {
        fileSize: fileStat.size,
      };

      if (this.isImage(options.mimeType)) {
        const image = await Jimp.create(filePath);
        metaDatas.width = image.getWidth();
        metaDatas.height = image.getHeight();

        if (this.isImageScaleable(options.mimeType)) {
          const imageScaleDatas: ImageScaleData[] = [];
          // thumbnail
          const thumbnail = await this.scaleToThumbnail(
            image,
            (imgOptions) => this.getImageDestWithSuffix(filePath, `${imgOptions.width}x${imgOptions.height}`),
            50,
          );
          imageScaleDatas.push({ ...thumbnail, name: 'thumbnail' });

          // scaled
          const scaled = await this.scaleImage(
            filePath,
            () => this.getImageDestWithSuffix(filePath, 'scaled'),
            2560,
            1440,
            80,
          );
          scaled && imageScaleDatas.push({ ...scaled, name: 'scaled' });

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
            { name: 'large', width: largeWidth, height: largeHeight, quality: 80 },
            { name: 'medium-large', width: mediumLargeWidth, height: mediumLargeHeight, quality: 70 },
            { name: 'medium', width: mediumWidth, height: mediumHeight, quality: 50 },
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
              scale && imageScaleDatas.push({ ...scale, name: item.name });
            }),
          );

          metaDatas.imageScales = imageScaleDatas;
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
        requestUser,
      );

      mediaMetas = await this.mediaDataSource.bulkCreateMeta(media.id, [
        {
          metaKey: MediaMetaPresetKeys.Matedata,
          metaValue: JSON.stringify(metaDatas),
        },
      ]);
    } else if (this.isImageScaleable(media.mimeType)) {
      mediaMetas = await this.mediaDataSource.getMetas(
        media.id,
        [MediaMetaPresetKeys.Matedata],
        ['metaKey', 'metaValue'],
      );
    }
    const fileName = `${media.originalFileName}${media.extension}`;
    return {
      original: {
        fileName,
        path: media.path,
      },
      ...(mediaMetas
        ? mediaMetas.reduce((prev, meta) => {
            if (meta.metaKey === MediaMetaPresetKeys.Matedata) {
              const metadatas = JSON.parse(meta.metaValue!) as Dictionary<any>;
              // resized 图片
              metadatas.imageScales &&
                (metadatas.imageScales as ImageScaleData[]).forEach((item) => {
                  prev[item.name] = {
                    fileName,
                    path: item.path,
                  };
                });
              // some else type properties
            }

            return prev;
          }, {} as Dictionary<any>)
        : null),
    };
  }

  /**
   * 生成略缩图
   * @param imagePath 源图片路径
   */
  async scaleToThumbnail(
    image: string | Jimp,
    dest: string | ((opts: { width: number; height: number }) => string),
    quality = 70,
  ): Promise<Omit<ImageScaleData, 'name'>> {
    const width = parseInt((await this.mediaDataSource.getOption(OptionPresetKeys.ThumbnailSizeWidth)) || '150');
    const height = parseInt((await this.mediaDataSource.getOption(OptionPresetKeys.ThumbnailSizeHeight)) || '150');
    const crop = await this.mediaDataSource.getOption<'0' | '1'>(OptionPresetKeys.ThumbnailCrop);
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
   * @param imagePath 源图片路径
   * @param width 宽度
   * @param height 高度
   * @param suffix 图片名称后缀，如果为空则是以 {width}x{height} 作为后缀
   */
  async scaleImage(
    image: string | Jimp,
    dest: string | ((args: { width: number; height: number }) => string),
    width: number,
    height: number,
    quality = 70,
  ): Promise<Omit<ImageScaleData, 'name'> | undefined> {
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
