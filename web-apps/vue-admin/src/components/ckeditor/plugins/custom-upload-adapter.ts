import { Plugin } from 'ckeditor5/src/core';
import { FileRepository, type FileLoader, type UploadAdapter, type UploadResponse } from 'ckeditor5/src/upload';

export class CustomUploadAdapter extends Plugin {
  static get requires() {
    return [FileRepository];
  }

  static get pluginName() {
    return 'CustomUploadAdapter';
  }

  init() {
    // config.get return object if it is function
    // so can't use get('customUpload.request')
    const request = (this.editor.config.get('customUpload') as Record<string, any>)?.request;
    if (!request) {
      return;
    }
    // Register Adapter
    this.editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
      new Adapter(loader, request, this.editor.t);
  }
}

/**
 * Upload adapter.
 *
 * @private
 * @implements module:upload/filerepository~UploadAdapter
 */
class Adapter implements UploadAdapter {
  loader: FileLoader;
  request: (
    file: File,
    options: {
      onProgress: (event: { loaded: number; total: number }) => void;
      onAbortPossible: (abortCallback: () => void) => void;
    },
  ) => Promise<UploadResponse>;
  t: (key: string) => string;
  onAbort?: () => void;

  /**
   * Creates a new adapter instance.
   *
   * @param {module:upload/filerepository~FileLoader} loader
   * @param {module:upload/adapters/upload-adapter~UploadRequest} request
   * @param {module:utils/locale~Locale#t} t
   */
  constructor(loader, request, t) {
    /**
     * FileLoader instance to use during the upload.
     *
     * @member {module:upload/filerepository~FileLoader} #loader
     */
    this.loader = loader;
    /**
     * The configuration of the adapter.
     *
     * @member {module:upload/adapters/upload-adapter~UploadRequest} #request
     */
    this.request = request;
    /**
     * Locale translation method.
     *
     * @member {module:utils/locale~Locale#t} #t
     */
    this.t = t;
  }

  /**
   * Starts the upload process.
   *
   * @see module:upload/filerepository~UploadAdapter#upload
   * @returns {Promise}
   */
  upload() {
    return this.loader.file.then((file) =>
      this.request(file!, {
        onProgress: (event) => {
          this.loader.uploadTotal = event.total;
          this.loader.uploaded = event.loaded;
        },
        onAbortPossible: (abortCallback) => {
          this.onAbort = abortCallback;
        },
      }),
    );
  }
  /**
   * Aborts the upload process.
   *
   * @see module:upload/filerepository~UploadAdapter#abort
   * @returns {Promise}
   */
  abort() {
    this.onAbort?.();
  }
}
