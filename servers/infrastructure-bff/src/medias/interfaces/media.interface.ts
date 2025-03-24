type CamelCase<S extends string> = S extends `${infer P1}-${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

export enum ImageScaleType {
  Thumbnail = 'thumbnail',
  Scaled = 'scaled',
  Large = 'large',
  Medium = 'medium',
  MediumLarge = 'medium-large',
}

export interface FileData {
  fileName: string;
  path: string;
  fullPath: string;
  width?: number;
  height?: number;
}

export type ImageScales = {
  [key in ImageScaleType as CamelCase<string & key>]: Required<FileData>;
};

export type File = {
  original: FileData & {
    fileSize: number;
  };
} & Partial<ImageScales>;

export interface FileSaveOptions {
  /** 原始文件名，包含后缀 */
  originalName: string;
  /** mime type */
  mimeType: string;
  /** 文件 MD5, 如果不传则会通过文件计算 */
  md5?: string;
  /** 裁切 */
  crop?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}
