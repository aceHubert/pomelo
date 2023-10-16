import { computed, defineComponent, reactive } from '@vue/composition-api';
import CKEditor from '@ckeditor/ckeditor5-vue2';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import BalloonEditor from '@ckeditor/ckeditor5-build-balloon';
// import { obsUpload, obsDisplayUrl } from '../../../media/utils/obs';
import { Modal } from '@/components';
import { useI18n } from '@/hooks';
// import { useResApi } from '@/fetch/graphql';
import { MediaList } from '../../../media/components';
import './index.less';

export type Editor = {
  ui: any;
};

export type HtmlEditorProps = {
  type?: 'decoupled' | 'balloon';
  value?: string;
  width?: string | number;
  placeholder?: string;
  disabled?: boolean;
};

export default defineComponent({
  name: 'HtmlEditor',
  inheritAttrs: false,
  props: {
    type: {
      type: String,
      default: 'decoupled',
      validator: (value: string) => ['decoupled', 'balloon'].includes(value),
    },
    value: String,
    width: [String, Number],
    placeholder: String,
    disabled: Boolean,
  },
  setup(props: HtmlEditorProps, { attrs, slots, refs, listeners }) {
    const prefixCls = 'html-editor';
    const i18n = useI18n();
    // const resApi = useResApi();

    const mediaSelector = reactive({
      modalVisible: false,
      accept: '',
      callback: (_url: string) => {},
    });

    const contentWidth = computed(() => {
      return typeof props.width === 'number' ? `${props.width}px` : props.width;
    });

    return () => {
      const editProps = {
        value: props.value,
        config: {
          ...attrs,
          disabled: props.disabled,
          gallery: {
            open: (options: { accept: string }, callback: (url: string) => void) => {
              mediaSelector.accept = options.accept;
              mediaSelector.callback = callback;
              mediaSelector.modalVisible = true;
            },
          },
          // GRAPHQL 上传
          // customUpload: {
          //   request: (
          //     file: File,
          //     options: {
          //       onProgress: (event: { loaded: number; total: number }) => void;
          //       onAbortPossible: (callback: () => void) => void;
          //     },
          //   ) =>
          //     resApi
          //       .uploadFile({
          //         variables: {
          //           file,
          //         },
          //         context: {
          //           fetchOptions: {
          //             onProgress: options.onProgress,
          //             onAbortPossible: options.onAbortPossible,
          //           },
          //         },
          //       })
          //       .then(({ file }) => {
          //         const result = {
          //           default: file.fullPath,
          //         };

          //         if (file.thumbnail) {
          //           result['thumbnail'] = file.thumbnail.fullPath;
          //         }
          //         if (file.medium) {
          //           result['medium'] = file.medium.fullPath;
          //         }
          //         if (file.mediumLarge) {
          //           result['medium-large'] = file.mediumLarge.fullPath;
          //         }
          //         if (file.large) {
          //           result['large'] = file.large.fullPath;
          //         }

          //         return result;
          //       }),
          // },
          // OBS 上传
          // customUpload: {
          //   request: (
          //     file: File,
          //     options: {
          //       onProgress: (event: { loaded: number; total: number }) => void;
          //       onAbortPossible: (callback: () => void) => void;
          //     },
          //   ) =>
          //     new Promise((resolve, reject) => {
          //       const suffix = file.name.substring(file.name.lastIndexOf('.'));
          //       const fileName = Math.random().toString(16).substring(2) + suffix;
          //       const objectKey = `templates/docs_${fileName}`;

          //       resApi
          //         .getObsUploadSignedUrl({
          //           variables: {
          //             bucket: 'static-cdn',
          //             key: objectKey,
          //             headers: {
          //               'Content-Type': file.type,
          //             },
          //           },
          //         })
          //         .then(({ signedUrl: { url, headers } }) => {
          //           const { abort } = obsUpload({
          //             file,
          //             action: url,
          //             method: 'PUT',
          //             headers,
          //             onSuccess: () => resolve({ default: obsDisplayUrl(objectKey) }),
          //             onError: reject,
          //             onProgress: (opts) =>
          //               options.onProgress({
          //                 loaded: opts.loaded || 0,
          //                 total: opts.total || 0,
          //               }),
          //           });
          //           options.onAbortPossible(abort);
          //         })
          //         .catch(reject);
          //     }),
          // },
          placeholder: props.placeholder ?? i18n.tv('page_templates.content_placeholder', '添加内容'),
          language: { 'en-US': 'en', 'zh-CN': 'zh-cn' }[i18n.locale] || 'en-US',
          removePlugins: ['ImageInsert'],
        },
        editor: props.type === 'balloon' ? BalloonEditor : DecoupledEditor,
      };

      const { ready: onEditorReady, ...restListeners } = listeners;
      const editListeners = {
        ...restListeners,
        ready: (editor: Editor) => {
          if (props.type === 'decoupled') {
            (refs['toolbar'] as HTMLDivElement)?.appendChild(editor.ui.view.toolbar.element);
          }
          onEditorReady?.(editor);
        },
      };

      return (
        <div class={prefixCls}>
          <div class={`${prefixCls}__toolbar`} ref="toolbar"></div>
          <div
            class={`${prefixCls}__wrapper`}
            style={{
              width: contentWidth.value,
            }}
          >
            {slots.contentPrefix?.()}
            <div class={`${prefixCls}__content`}>
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
          <Modal
            visible={mediaSelector.modalVisible}
            title={i18n.tv('page_templates.media_modal.title', '选择媒体') as string}
            width={932}
            footer={null}
            onCancel={() => (mediaSelector.modalVisible = false)}
          >
            <MediaList
              selectable
              accept={mediaSelector.accept}
              size="small"
              pageSize={9}
              showSizeChanger={false}
              objectPrefixKey="templates/html_editor_"
              onSelect={(path) => {
                mediaSelector.callback(path);
                mediaSelector.modalVisible = false;
              }}
            />
          </Modal>
        </div>
      );
    };
  },
});
