export interface FileUploadOptions {
  /** 原始文件名，包含后缀 */
  originalName: string;
  /** mime type */
  mimeType: string;
  /** 临时文件地址 或 文件流 */
  file: string | Buffer;
}
