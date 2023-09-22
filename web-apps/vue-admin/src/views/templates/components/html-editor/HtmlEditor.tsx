import { defineComponent } from '@vue/composition-api';
import CKEditor from '@ckeditor/ckeditor5-vue2';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { obsUpload, obsDisplayUrl } from '@/components';
import { GraphQLUploadAdapterPlugin } from '@/components/ckeditor/plugins/graphql-upload-adapter';
// import { ObsUploadAdapterPlugin } from '@/components/ckeditor/plugins/obs-upload-adapter';
import { useI18n } from '@/hooks';
import { useResApi } from '@/fetch/graphql';
import './index.less';

export type Editor = {
  ui: any;
};

export type HtmlEditorProps = {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default defineComponent({
  name: 'DocumentEditor',
  inheritAttrs: false,
  props: {
    value: String,
    placeholder: String,
    disabled: Boolean,
  },
  setup(props: HtmlEditorProps, { attrs, slots, refs, listeners }) {
    const prefixCls = 'html-editor';
    const i18n = useI18n();
    const resApi = useResApi();

    const editProps = {
      ...attrs,
      value: props.value,
      config: {
        ...(attrs.config as any),
        disabled: props.disabled,
        graphqlUpload: {
          request: (
            file: File,
            options: {
              onProgress: (event: { loaded: number; total: number }) => void;
              onAbortPossible: (callback: () => void) => void;
            },
          ) =>
            resApi
              .uploadFile({
                variables: {
                  file,
                },
                context: {
                  fetchOptions: {
                    onProgress: options.onProgress,
                    onAbortPossible: options.onAbortPossible,
                  },
                },
              })
              .then(({ file }) => {
                const result = {
                  default: file.fullPath,
                };

                if (file.thumbnail) {
                  result['thumbnail'] = file.thumbnail.fullPath;
                }
                if (file.medium) {
                  result['medium'] = file.medium.fullPath;
                }
                if (file.mediumLarge) {
                  result['medium-large'] = file.mediumLarge.fullPath;
                }
                if (file.large) {
                  result['large'] = file.large.fullPath;
                }

                return result;
              }),
        },
        obsUpload: {
          request: (
            file: File,
            options: {
              onProgress: (event: { loaded: number; total: number }) => void;
              onAbortPossible: (callback: () => void) => void;
            },
          ) =>
            new Promise((resolve, reject) => {
              const suffix = file.name.substring(file.name.lastIndexOf('.'));
              const fileName = Math.random().toString(16).substring(2) + suffix;
              const objectKey = `templates/docs_${fileName}`;

              resApi
                .getObsUploadSignedUrl({
                  variables: {
                    bucket: 'static-cdn',
                    key: objectKey,
                    headers: {
                      'Content-Type': file.type,
                    },
                  },
                })
                .then(({ signedUrl: { url, headers } }) => {
                  const { abort } = obsUpload({
                    file,
                    action: url,
                    method: 'PUT',
                    headers,
                    onSuccess: () => resolve({ default: obsDisplayUrl(objectKey) }),
                    onError: reject,
                    onProgress: (opts) =>
                      options.onProgress({
                        loaded: opts.loaded || 0,
                        total: opts.total || 0,
                      }),
                  });
                  options.onAbortPossible(abort);
                })
                .catch(reject);
            }),
        },
        extraPlugins: [GraphQLUploadAdapterPlugin],
        // extraPlugins: [ObsUploadAdapterPlugin],
        placeholder: props.placeholder ?? i18n.tv('page_templates.content_placeholder', '请编辑内容'),
        language: { 'en-US': 'en', 'zh-CN': 'zh-cn' }[i18n.locale] || 'en-US',
      },
      editor: DecoupledEditor,
    };

    const { ready: onEditorReady, ...restListeners } = listeners;
    const editListeners = {
      ...restListeners,
      ready: (editor: Editor) => {
        (refs['toolbar'] as HTMLDivElement)?.appendChild(editor.ui.view.toolbar.element);
        onEditorReady?.(editor);
      },
    };

    return () => (
      <div class={prefixCls}>
        <div class={`${prefixCls}__toolbar`} ref="toolbar"></div>
        <div class={`${prefixCls}__document`}>
          <div class={`${prefixCls}-document__wrapper`}>
            {slots.contentPrefix?.()}
            <div class={`${prefixCls}-document__content`}>
              <CKEditor.component
                {...{
                  props: editProps,
                  on: editListeners,
                  scopedSlots: slots,
                }}
              />
            </div>
            {slots.contentSuffix?.()}
          </div>
        </div>
      </div>
    );
  },
});
