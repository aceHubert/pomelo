import { promisify } from '@pomelo/shared-web';

export interface Options {
  uploadAction: string;
  objectKey: string;
  // default: `{uploadAction}/{objectKey}`
  displayUrl?: string;
  // default: POST
  method?: 'POST' | 'PUT';
  headers?: Record<string, any>;
  // if method = 'POST'
  formParams?: Record<string, any>;
  // default: false
  withCredentials?: boolean;
}

export function ObsUploadAdapterPlugin(editor: any) {
  const options = editor.config.get('obsUpload')?.options;
  if (!options) {
    return;
  }

  editor.plugins.get('FileRepository').createUploadAdapter = function (loader) {
    return new Adapter(loader, options);
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
  options: Options | ((file: File) => Options | Promise<Options>);
  xhr: InstanceType<typeof XMLHttpRequest> | undefined;
  /**
   * Creates a new adapter instance.
   *
   * @param {module:upload/filerepository~FileLoader} loader
   * @param {module:upload/adapters/obs-upload-adapter~ObsUploadConfig} options
   */
  constructor(loader, options) {
    /**
     * FileLoader instance to use during the upload.
     *
     * @member {module:upload/filerepository~FileLoader} #loader
     */
    this.loader = loader;
    /**
     * The configuration of the adapter.
     *
     * @member {module:upload/adapters/obs-upload-adapter~ObsUploadConfig} #options
     */
    this.options = options;
  }

  /**
   * Starts the upload process.
   *
   * @see module:upload/filerepository~UploadAdapter#upload
   * @returns {Promise}
   */
  upload() {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          this._initRequest(file).then((actalOptions) => {
            this._initListeners(resolve, reject, file, actalOptions);
            this._sendRequest(file, actalOptions);
          });
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
    if (this.xhr) {
      this.xhr.abort();
    }
  }
  /**
   * Initializes the `XMLHttpRequest` object using the URL specified as
   * {@link module:upload/adapters/obs-upload-adapter~ObsUploadConfig#uploadUrl `obsUpload.uploadUrl`} in the editor's
   * configuration.
   *
   * @private
   */
  async _initRequest(file) {
    const xhr = (this.xhr = new XMLHttpRequest());
    let options = this.options;
    if (typeof options === 'function') {
      options = await promisify(options(file));
    }

    const displayUrl = options.displayUrl || `${options.uploadAction}/${options.objectKey}`;
    const method = options.method || 'POST';
    xhr.open(method, options.uploadAction, true);
    xhr.responseType = 'document';
    return {
      ...options,
      method,
      displayUrl,
    };
  }
  /**
   * Initializes XMLHttpRequest listeners
   *
   * @private
   * @param {Function} resolve Callback function to be called when the request is successful.
   * @param {Function} reject Callback function to be called when the request cannot be completed.
   * @param {File} file Native File object.
   */
  _initListeners(resolve, reject, file, options) {
    const xhr = this.xhr!;
    const loader = this.loader;
    const genericErrorText = `Couldn't upload file: ${file.name}.`;
    xhr.addEventListener('error', () => reject(genericErrorText));
    xhr.addEventListener('abort', () => reject());
    xhr.addEventListener('load', () => {
      if (xhr.status < 300) {
        const urls = { default: options.displayUrl };
        // Resolve with the normalized `urls` property and pass the rest of the response
        // to allow customizing the behavior of features relying on the upload adapters.
        resolve({
          urls,
        });
      } else {
        const response = xhr.responseXML;
        reject(response?.querySelector('Error Message')?.innerHTML || genericErrorText);
      }
    });
    // Upload progress when it is supported.
    /* istanbul ignore else */
    if (xhr.upload) {
      xhr.upload.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          loader.uploadTotal = evt.total;
          loader.uploaded = evt.loaded;
        }
      });
    }
  }
  /**
   * Prepares the data and sends the request.
   *
   * @private
   * @param {File} file File instance to be uploaded.
   */
  async _sendRequest(file: File, options: Options) {
    const xhr = this.xhr!;
    // Set headers if specified.
    const headers = options.headers || {};
    // Use the withCredentials flag if specified.
    const withCredentials = options.withCredentials || false;
    for (const headerName of Object.keys(headers)) {
      xhr.setRequestHeader(headerName, headers[headerName]);
    }
    xhr.withCredentials = withCredentials;
    if (options.method === 'PUT') {
      xhr.send(file);
    } else {
      // Prepare the form data.
      const data = new FormData();
      // Set FormData if specified.
      const formParams = options.formParams || {};
      for (const paramKey of Object.keys(formParams)) {
        data.append(paramKey, formParams[paramKey]);
      }
      data.append('file', file, file.name);
      // Send the request.
      xhr.send(data);
    }
  }
}
