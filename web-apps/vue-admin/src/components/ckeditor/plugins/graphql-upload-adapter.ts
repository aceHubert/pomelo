export function GraphQLUploadAdapterPlugin(editor: any) {
  const request = editor.config.get('graphqlUpload')?.request;
  if (!request) {
    return;
  }

  editor.plugins.get('FileRepository').createUploadAdapter = function (loader) {
    return new Adapter(loader, request, editor.t.bind(editor));
  };
}

/**
 * Upload adapter.
 *
 * @private
 * @implements module:upload/filerepository~UploadAdapter
 */
class Adapter {
  loader: any;
  request: (
    file: File,
    options: {
      onProgress: (event: { loaded: number; total: number }) => void;
      onAbortPossible: (abortCallback: () => void) => void;
    },
  ) => Promise<{
    default: string;
    [key: string]: string;
  }>;
  t: (key: string) => string;
  onAbort?: () => void;

  /**
   * Creates a new adapter instance.
   *
   * @param {module:upload/filerepository~FileLoader} loader
   * @param {module:upload/adapters/obs-upload-adapter~GrqphqlUploadRequest} request
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
     * @member {module:upload/adapters/graphql-upload-adapter~GrqphqlUploadRequest} #request
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
      this.request(file, {
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
