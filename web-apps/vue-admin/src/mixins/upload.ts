import { ref, reactive, computed } from '@vue/composition-api';
import { useResApi } from '@/fetch/graphql';

// Types
import type { FileUploadOptions } from '@/fetch/graphql';

export const useUpload = () => {
  const resApi = useResApi();

  const uploadProcessData = ref<[number, number][]>([]);
  const uploadProgress = computed(() => {
    if (uploadProcessData.value.length === 0) {
      return 0;
    }
    const sum = uploadProcessData.value.reduce((a, b) => a + b[0], 0);
    const total = uploadProcessData.value.reduce((a, b) => a + b[1], 0);
    return Math.floor((sum / total) * 100);
  });
  const uploading = computed(() => uploadProcessData.value.length > 0);
  const getCustomUploadRequest =
    (_objectKeyPrefix = 'medias/item_') =>
    async (options: {
      file: File;
      fileOptions?: FileUploadOptions;
      method: 'PUT' | 'POST' | 'put' | 'post';
      withCredentials: boolean;
      onSuccess?: (res: any) => void;
      onError?: (err: unknown) => void;
      onProgress?: (event: any) => void;
    }) => {
      const { file, fileOptions, withCredentials, onSuccess, onError, onProgress } = options;
      // 支持多文件上传
      const progress: [number, number] = [0, options.file.size];
      uploadProcessData.value.push(progress);
      return resApi
        .uploadFile({
          variables: {
            file,
            options: fileOptions,
          },
          context: {
            fetchOptions: {
              withCredentials,
              onProgress: (ev: ProgressEvent) => {
                progress[0] = ev.loaded;
                onProgress?.(ev);
              },
            },
          },
        })
        .then(({ file }) => onSuccess?.(file))
        .catch(onError)
        .finally(() => {
          uploadProcessData.value.splice(uploadProcessData.value.indexOf(progress), 1);
        });
      // upload to obs
      // const suffix = file.name.substring(file.name.lastIndexOf('.'));
      // const fileName = Math.random().toString(16).substring(2) + suffix;
      // const objectKey = `${objectKeyPrefix}${fileName}`;
      // resApi
      //   .getObsUploadSignedUrl({
      //     variables: {
      //       bucket: 'static-cdn',
      //       key: objectKey,
      //       headers: {
      //         'Content-Type': file.type,
      //       },
      //     },
      //   })
      //   .then(({ signedUrl: { url, headers } }) => {
      //     obsUpload({
      //       file,
      //       action: url,
      //       method,
      //       headers,
      //       withCredentials,
      //       onSuccess: () => onSuccess({ url: obsDisplayUrl(objectKey) }),
      //       onError,
      //       onProgress,
      //     });
      //   })
      //   .catch(onError);
    };

  return reactive({
    uploading,
    uploadProgress,
    getCustomUploadRequest,
  });
};
