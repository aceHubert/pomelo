import moment from 'moment';
import { defineComponent, ref, computed, onErrorCaptured } from '@vue/composition-api';
import { warn, isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { OptionPresetKeys, PostMetaPresetKeys, TemplatePageType } from '@pomelo/shared-web';
import { Skeleton } from 'vant';
import { Result } from '@/components';
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
  loading?: boolean;
  error?: Error;
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
    loading: Boolean,
    error: Object,
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

    const renderError = ref<false | string>(false);
    onErrorCaptured((err, vm, info) => {
      warn(process.env.NODE_ENV === 'production', info || err.message, vm);
      renderError.value = info || err.message;
      return false;
    });

    return () => (
      <div class={classes.container}>
        {props.loading ? (
          <Skeleton title row={3} />
        ) : props.error ? (
          <Result
            status="error"
            title={i18n.tv('post_template.index.load_error_text', '内容加载错误！') as string}
            subTitle={props.error.message}
          ></Result>
        ) : !props.content ? (
          <Result
            status="error"
            title="404"
            subTitle={i18n.tv('post_template.index.not_found_text', '内容不存在！') as string}
          ></Result>
        ) : renderError.value ? (
          <Result
            status="error"
            title={i18n.tv('post_template.index.render_error_text', '内容渲染错误！') as string}
            subTitle={renderError.value}
          ></Result>
        ) : (
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
        )}
      </div>
    );
  },
});
