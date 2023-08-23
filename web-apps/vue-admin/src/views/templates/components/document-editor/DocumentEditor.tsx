import { defineComponent } from '@vue/composition-api';
import CKEditor from '@ckeditor/ckeditor5-vue2';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { formatDate } from '@pomelo/shared-web';
import { ObsUploadAdapterPlugin } from '@/components/ckeditor/plugins/obs-upload-adapter';
import { useI18n } from '@/hooks';
import './index.less';

export type Editor = {
  ui: any;
};

export type DocumentEditorProps = {
  value?: string;
  title?: string;
  locale?: string;
};

export default defineComponent({
  name: 'DocumentEditor',
  inheritAttrs: false,
  props: {
    value: String,
    title: String,
    locale: String,
  },
  setup(props, { attrs, slots, refs, listeners }) {
    const prefixCls = 'document-editor';
    const i18n = useI18n();

    return () => {
      const editProps = {
        ...attrs,
        value: props.value,
        config: {
          ...(attrs.config as any),
          extraPlugins: [ObsUploadAdapterPlugin],
          placeholder: i18n.tv('page_templates.content_placeholder', '请编辑内容'),
          language: { 'en-US': 'en', 'zh-CN': 'zh-cn' }[props.locale!] || 'en-US',
        },
        editor: DecoupledEditor,
      };

      const { ready: onEditorReady, 'update:title': onUpdateTitle, ...restListeners } = listeners;
      const editListeners = {
        ...restListeners,
        ready: (editor: Editor) => {
          (refs['toolbar'] as HTMLDivElement)?.appendChild(editor.ui.view.toolbar.element);
          onEditorReady?.(editor);
        },
      };

      return (
        <div class={prefixCls}>
          <div class={`${prefixCls}__toolbar`} ref="toolbar"></div>
          <div class={`${prefixCls}__document`}>
            <div class={`${prefixCls}-document__wrapper`}>
              <div class={`${prefixCls}-document__title`}>
                <input
                  class="input"
                  placeholder={i18n.tv('page_templates.title_placeholder', '请输入标题')}
                  value={props.title}
                  onInput={(e: any) => onUpdateTitle?.(e.target.value)}
                />
                <p class="sub-line">{formatDate(Date.now(), 'L HH:mm', props.locale)}</p>
              </div>
              <div class={`${prefixCls}-document__content`}>
                <CKEditor.component
                  {...{
                    props: editProps,
                    on: editListeners,
                    scopedSlots: slots,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    };
  },
});
