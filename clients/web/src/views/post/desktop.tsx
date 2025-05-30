import moment from 'moment';
import hljs from 'highlight.js/lib/core';
import Lazyload from 'lazyload';
import { defineComponent, computed, onMounted } from '@vue/composition-api';
import { useI18n } from '@/composables';
import { useLocationMixin } from '@/mixins';
import { PostMetaPresetKeys, TemplatePageType } from '@/fetch/apis';
import { safeJSONParse } from '@/utils';
import classes from './desktop.module.less';

// Types
import type { SchemaFramework } from '@ace-pomelo/shared/client';

export interface DesktopPostProps {
  title: string;
  excerpt: string;
  content: any;
  author: string;
  createdAt: string;
  metas: Record<string, string>;
  framework: SchemaFramework;
}

export default defineComponent({
  name: 'DesktopPost',
  props: {
    title: String,
    excerpt: String,
    content: String,
    author: String,
    createdAt: String,
    metas: {
      type: Object,
      default: () => ({}),
    },
    framework: {
      type: String,
      default: 'HTML',
    },
  },
  setup(props: DesktopPostProps) {
    const i18n = useI18n();
    const locationMixin = useLocationMixin();

    const featureImage = computed(() => {
      const value = props.metas[PostMetaPresetKeys.FeatureImage];
      if (!value) return undefined;

      return locationMixin.getMediaPath(safeJSONParse(value)?.path ?? value);
    });

    const template = computed(() => {
      return (props.metas[PostMetaPresetKeys.Template] as TemplatePageType) ?? TemplatePageType.Default;
    });

    onMounted(() => {
      if (props.framework === 'HTML') {
        document.querySelectorAll('pre code').forEach((el) => {
          hljs.highlightElement(el as HTMLElement);
        });
        new Lazyload(document.querySelectorAll('img[data-lazy]'));
      }
    });

    return () => (
      <div class={[classes.container]}>
        <div
          class={[
            classes.wrapper,
            template.value === TemplatePageType.Cover
              ? classes.cover
              : template.value === TemplatePageType.FullWidth
              ? classes.fullWidth
              : '',
          ]}
        >
          <div
            class={classes.titleWrapper}
            style={{
              backgroundImage: featureImage.value ? `url(${featureImage.value})` : undefined,
            }}
          >
            <p class={classes.title}>{props.title || ''}</p>
            {props.createdAt && (
              <p class={classes.subtitle}>
                <span>{moment(props.createdAt).locale(i18n.locale).format('L HH:mm')}</span>
                <span>{props.author}</span>
              </p>
            )}
          </div>
          {props.framework === 'HTML' ? (
            <div class={['ck-content', classes.contentWrapper]} domPropsInnerHTML={props.content}></div>
          ) : (
            <div class={classes.contentWrapper}>{`内容格式"${props.framework}"不支持渲染`}</div>
          )}
        </div>
      </div>
    );
  },
});
