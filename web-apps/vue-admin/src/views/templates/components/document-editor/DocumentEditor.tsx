import moment from 'moment';
import { defineComponent } from '@vue/composition-api';
import { useI18n } from '@/hooks';
import { HtmlEditor } from '../html-editor';
import './index.less';

export type Editor = {
  ui: any;
};

export type DocumentEditorProps = {
  value?: string;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default defineComponent({
  name: 'DocumentEditor',
  inheritAttrs: false,
  props: {
    value: String,
    title: String,
    placeholder: String,
    disabled: Boolean,
  },
  setup(props: DocumentEditorProps, { attrs, listeners }) {
    const prefixCls = 'document-editor';
    const i18n = useI18n();

    const { 'update:title': onUpdateTitle, ...restListeners } = listeners;

    return () => {
      return (
        <HtmlEditor
          {...{
            props: {
              value: props.value,
              placeholder: props.placeholder,
              disabled: props.disabled,
            },
            attrs,
            on: restListeners,
          }}
        >
          <template slot="contentPrefix">
            <div class={`${prefixCls}-title`}>
              <input
                class="input"
                placeholder={i18n.tv('page_templates.title_placeholder', '请输入标题')}
                value={props.title}
                onInput={(e: any) => onUpdateTitle?.(e.target.value)}
              />
              <p class="sub-line">{moment(Date.now()).locale(i18n.locale).format('L HH:mm')}</p>
            </div>
          </template>
        </HtmlEditor>
      );
    };
  },
});
