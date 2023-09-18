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
