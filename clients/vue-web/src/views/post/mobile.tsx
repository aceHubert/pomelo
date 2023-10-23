import moment from 'moment';
import hljs from 'highlight.js/lib/core';
import { defineComponent, computed, onMounted } from '@vue/composition-api';
import { isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { OptionPresetKeys, PostMetaPresetKeys, TemplatePageType } from '@pomelo/shared-web';
import { useI18n, useOptions } from '@/hooks';
import classes from './mobile.module.less';

// Types
import type { SchemaFramework } from '@pomelo/shared-web';

export interface MobilePostProps {
  title: string;
  excerpt: string;
  content: any;
  createdAt: string;
  metas: Record<string, string>;
  framework: SchemaFramework;
}

export default defineComponent({
  name: 'MobilePost',
  props: {
    title: String,
    excerpt: String,
    content: String,
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
  setup(props: MobilePostProps) {
    const i18n = useI18n();
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);

    const featureImage = computed(() => {
      const value = props.metas[PostMetaPresetKeys.FeatureImage];
      if (!value) return undefined;
      if (isAbsoluteUrl(value)) return value;

      return trailingSlash(siteUrl.value) + (value.startsWith('/') ? value.slice(1) : value);
    });

    const template = computed(() => {
      return (props.metas[PostMetaPresetKeys.Template] as TemplatePageType) ?? TemplatePageType.Default;
    });

    onMounted(() => {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el as HTMLElement);
      });
    });

    return () => (
      <div class={classes.container}>
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
              <p class={classes.subtitle}>{moment(props.createdAt).locale(i18n.locale).format('L HH:mm')}</p>
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
