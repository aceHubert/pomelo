import { computed, defineComponent, reactive } from '@vue/composition-api';
import CKEditor from '@ckeditor/ckeditor5-vue2';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import BalloonEditor from '@ckeditor/ckeditor5-build-balloon';
// import { obsUpload, obsDisplayUrl } from '../../../media/utils/obs';
import { Modal } from '@/components';
import { useI18n } from '@/composables';
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
      callback: (() => {}) as (attrs: { src: string; [key: string]: any }) => void,
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
            open: (options: { accept: string }, callback: (attrs: { src: string; [key: string]: any }) => void) => {
              mediaSelector.accept = options.accept;
              mediaSelector.callback = callback;
              mediaSelector.modalVisible = true;
            },
          },
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
              maxWidth: '100%',
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
              selectConfirm={false}
              accept={mediaSelector.accept}
              size="small"
              pageSize={9}
              showSizeChanger={false}
              objectPrefixKey="templates/html_editor_"
              onSelect={(path, media) => {
                // 使用略缩图，需要js处理
                media.medium
                  ? mediaSelector.callback({
                      src: media.medium.fullPath,
                      dataSrc: path,
                      width: media.width,
                      height: media.height,
                    })
                  : mediaSelector.callback(path);
                mediaSelector.modalVisible = false;
              }}
            />
          </Modal>
        </div>
      );
    };
  },
});
