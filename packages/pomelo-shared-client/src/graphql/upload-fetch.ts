const parseHeaders = (rawHeaders: any) => {
  const headers = new Headers();
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  const preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
  preProcessedHeaders.split(/\r?\n/).forEach((line: any) => {
    const parts = line.split(':');
    const key = parts.shift().trim();
    if (key) {
      const value = parts.join(':').trim();
      headers.append(key, value);
    }
  });
  return headers;
};

export const uploadFetch = (url: string | URL, options: any) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      const opts: any = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || ''),
      };
      opts.url = 'responseURL' in xhr ? xhr.responseURL : opts.headers.get('X-Request-URL');
      const body = 'response' in xhr ? xhr.response : (xhr as any).responseText;
      resolve(new Response(body, opts));
    };

    xhr.onerror = (ev) => {
      reject(new TypeError('Network request failed', { cause: ev }));
    };

    xhr.ontimeout = (ev) => {
      reject(new TypeError('Network request failed', { cause: ev }));
    };

    xhr.open(options.method, url, true);

    // Has to be after `.open()`. See https://github.com/enyo/dropzone/issues/179
    if (options.withCredentials && 'withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    const headers = options.headers || {};

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

    if (xhr.upload) {
      xhr.upload.onprogress = options.onProgress;
    }

    options.onAbortPossible?.(() => {
      xhr.abort();
    });

    xhr.send(options.body);
  });

/**
 * custom fetch， support onUploadProgress
 * https://github.com/jaydenseric/apollo-upload-client/issues/88
 */
export const createUploadFetch = (preferredFetch?: WindowOrWorkerGlobalScope['fetch']) => (uri: any, options: any) => {
  if (options.onProgress) {
    return uploadFetch(uri, options);
  }
  return (preferredFetch ?? fetch)(uri, options);
};
