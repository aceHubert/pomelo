import { defineComponent, computed } from '@vue/composition-api';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { useConfigProvider } from '../shared';

// eslint-disable-next-line import/order
import 'highlight.js/styles/vs.css';

// Types
import type { PropType } from '@vue/composition-api';
import type { Options } from 'markdown-it';

export default defineComponent({
  name: 'MarkdownRender',
  props: {
    source: {
      type: String as PropType<string>,
      required: true,
    },
    options: {
      type: Object as PropType<Options>,
      default: () => ({
        html: true,
        linkify: true,
        typographer: true,
      }),
    },
    prefixCls: {
      type: String as PropType<string>,
    },
  },
  setup(props) {
    const md = MarkdownIt({
      ...{
        html: true,
        linkify: true,
        typographer: true,
        highlight: (str: string, lang: string): string => {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return (
                '<pre class="hljs"><code>' +
                hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                '</code></pre>'
              );
            } catch (__) {
              // ate by dog
            }
          }

          // @eslint-ignore @typescript-eslint/no-use-before-define
          return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        },
      },
      ...props.options,
    });
    const content = computed(() => md.render(props.source));

    const configProvider = useConfigProvider();
    const prefixCls = configProvider.getPrefixCls('md-render', props.prefixCls);

    return () => <div class={prefixCls} domPropsInnerHTML={content.value}></div>;
  },
});
