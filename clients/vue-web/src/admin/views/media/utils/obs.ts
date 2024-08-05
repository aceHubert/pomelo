import { trailingSlash } from '@ace-util/core';

export type BeforeUploadFileType = File | Blob | boolean | string;

export type RequestMethod = 'POST' | 'PUT' | 'post' | 'put';

export type RequestHeader = Record<string, string>;

export interface RcFile extends File {
  uid: string;
}

export interface UploadProgressEvent extends Partial<ProgressEvent> {
  percent?: number;
}

export interface UploadRequestError extends Error {
  status?: number;
  method?: RequestMethod;
  url?: string;
}

export interface RequestOption<T = any> {
  onProgress?: (event: UploadProgressEvent) => void;
  onError?: (event: UploadRequestError | ProgressEvent, body?: T) => void;
  onSuccess?: (body: T, xhr?: XMLHttpRequest) => void;
  data?: Record<string, unknown>;
  filename?: string;
  file: Exclude<BeforeUploadFileType, File | boolean> | RcFile;
  withCredentials?: boolean;
  action: string;
  headers?: RequestHeader;
  method: RequestMethod;
}

function getError(option: RequestOption, xhr: XMLHttpRequest) {
  const msg = `cannot ${option.method} ${option.action} ${xhr.status}'`;
  const err = new Error(msg) as UploadRequestError;
  err.status = xhr.status;
  err.method = option.method;
  err.url = option.action;
  return err;
}

/**
 * antdv upload component upload to obs
 */
export function obsUpload(option: RequestOption) {
  // eslint-disable-next-line no-undef
  const xhr = new XMLHttpRequest();

  if (option.onProgress && xhr.upload) {
    xhr.upload.onprogress = function progress(e: UploadProgressEvent) {
      if (e.total! > 0) {
        e.percent = (e.loaded! / e.total!) * 100;
      }
      option.onProgress?.(e);
    };
  }

  xhr.onerror = function error(e) {
    option.onError?.(e);
  };

  xhr.ontimeout = (e) => {
    option.onError?.(e);
  };

  xhr.onload = function onload() {
    // allow success when 2xx status
    // see https://github.com/react-component/upload/issues/34
    if (xhr.status < 200 || xhr.status >= 300) {
      return option.onError?.(getError(option, xhr), xhr.response);
    }

    return option.onSuccess?.(xhr.response, xhr);
  };

  xhr.open(option.method, option.action, true);

  // Has to be after `.open()`. See https://github.com/enyo/dropzone/issues/179
  if (option.withCredentials && 'withCredentials' in xhr) {
    xhr.withCredentials = true;
  }

  const headers = option.headers || {};

  // when set headers['X-Requested-With'] = null , can close default XHR header
  // see https://github.com/react-component/upload/issues/33
  if (headers['X-Requested-With'] !== null) {
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  }

  Object.keys(headers).forEach((h) => {
    if (headers[h] !== null) {
      xhr.setRequestHeader(h, headers[h]);
    }
  });

  if (option.method.toLocaleLowerCase() === 'post') {
    // eslint-disable-next-line no-undef
    const formData = new FormData();

    if (option.data) {
      Object.keys(option.data).forEach((key) => {
        const value = option.data![key];
        // support key-value array data
        if (Array.isArray(value)) {
          value.forEach((item) => {
            // { list: [ 11, 22 ] }
            // formData.append('list[]', 11);
            formData.append(`${key}[]`, item);
          });
          return;
        }

        formData.append(key, value as string | Blob);
      });
    }

    // eslint-disable-next-line no-undef
    if (option.file instanceof Blob) {
      formData.append(option.filename || 'file', option.file, (option.file as any).name);
    } else {
      formData.append(option.filename || 'file', option.file);
    }

    xhr.send(formData);
  } else {
    xhr.send(option.file);
  }

  return {
    abort() {
      xhr.abort();
    },
  };
}

const defaultPrefix = '//cdn.lejian.com/';

export function obsDisplayUrl(objectKey: string, prefix = defaultPrefix) {
  return trailingSlash(prefix) + objectKey;
}
