import moment from 'moment';
import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { Skeleton } from 'vant';
import { useRoute } from 'vue2-helpers/vue-router';
import { createResource } from '@vue-async/resource-manager';
import { warn } from '@ace-util/core';
import { useTemplateApi } from '@pomelo/shared-web';
import { Result } from '@/components';
import { useI18n } from '@/hooks';
import { TemplateStyleLinkMetaKey, TemplateStyleCssTextMetaKey } from '../constants';
import classes from './index.module.less';

export default defineComponent({
  name: 'PostView',
  head() {
    return {
      title: this.pageTitle as string,
      meta: [
        {
          name: 'description',
          content: this.pageDescription as string,
        },
      ],
      link: [
        {
          vmid: 'ckeditor5-style',
          href: '/static/ckeditor5/content-style.css',
          rel: 'stylesheet',
        },
        ...(this.links as string[]).map((href) => ({ href, rel: 'stylesheet' })),
      ],
      style: this.cssText
        ? [
            {
              cssText: this.cssText as string,
            },
          ]
        : [],
    };
  },
  setup() {
    const i18n = useI18n();
    const route = useRoute();
    const templateApi = useTemplateApi();

    // post /p/:id
    const postRes = createResource(async (id: string) => {
      const { data: post } = await templateApi.getPost({
        params: {
          id,
          metaKeys: [TemplateStyleLinkMetaKey, TemplateStyleCssTextMetaKey],
        },
      });

      return post;
    });

    watch(
      () => route.params.id,
      (id) => {
        postRes.read(id);
      },
      { immediate: true },
    );

    const renderError = ref<false | string>(false);

    // page title
    const pageTitle = computed(() => {
      const { $error, $loading, $result } = postRes;
      return $loading
        ? ''
        : $error
        ? i18n.tv('post.page_load_error_title', '内容加载错误')
        : $result?.title ?? i18n.tv('post.page_not_found_title', '未找到内容');
    });

    // description meta
    const pageDescription = computed(() => {
      const { $loading, $result } = postRes;
      return $loading ? '' : $result?.excerpt || '';
    });

    // stylesheets
    const links = computed<string[]>(() => {
      const { $error, $loading, $result } = postRes;
      return $error || $loading
        ? []
        : JSON.parse($result?.metas?.find(({ metaKey }) => metaKey === TemplateStyleLinkMetaKey)?.metaValue || '[]');
    });

    // css text
    const cssText = computed(() => {
      const { $error, $loading, $result } = postRes;
      return $error || $loading
        ? ''
        : $result?.metas?.find(({ metaKey }) => metaKey === TemplateStyleCssTextMetaKey)?.metaValue || '';
    });

    return {
      postRes,
      pageTitle,
      pageDescription,
      links,
      cssText,
      renderError,
    };
  },
  errorCaptured(err, vm, info) {
    warn(process.env.NODE_ENV === 'production', info || err.message);
    this.renderError = info || err.message;
    return false;
  },
  render() {
    const { $error, $loading, $result: postData } = this.postRes;

    const isConfigInvalid = () => {
      return !postData?.content;
    };

    return (
      <div class={classes.container}>
        {$loading ? (
          <Skeleton title row={3} />
        ) : $error ? (
          <Result
            status="error"
            title={this.$tv('post_template.index.load_error_text', '内容加载错误！') as string}
            subTitle={$error.message}
          ></Result>
        ) : !postData ? (
          <Result
            status="error"
            title="404"
            subTitle={this.$tv('post_template.index.not_found_text', '内容不存在！') as string}
          ></Result>
        ) : isConfigInvalid() ? (
          <Result
            status="error"
            title={this.$tv('post_template.index.schema_error_text', '内容配置错误！') as string}
            subTitle={this.$tv('post_template.index.contact_administrator_tips', '请联系管理员。') as string}
          ></Result>
        ) : this.renderError ? (
          <Result
            status="error"
            title={this.$tv('post_template.index.render_error_text', '内容渲染错误！') as string}
            subTitle={this.renderError}
          ></Result>
        ) : (
          [
            <div class={classes.title}>
              <p class={classes.titleMainLine}>{postData.title}</p>
              <p class={classes.titleSubLine}>
                {moment(postData.createdAt).locale(this.$i18n.locale).format('L HH:mm')}
              </p>
            </div>,
            <div class={['ck-content', classes.content]} domPropsInnerHTML={postData.content}></div>,
          ]
        )}
      </div>
    );
  },
});
