export interface FileSaveOptions {
  /** 原始文件名，包含后缀 */
  originalName: string;
  /** mime type */
  mimeType: string;
  /** 裁切 */
  crop?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}
