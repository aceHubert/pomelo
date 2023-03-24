import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { useRoute } from 'vue2-helpers/vue-router';
import { createResource } from '@vue-async/resource-manager';
import { useTemplateApi, formatDate, vueWarn } from '@pomelo/shared-web';
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
      return $error || $loading ? '' : $result?.title || '';
    });

    // description meta
    const pageDescription = computed(() => {
      const { $error, $loading, $result } = postRes;
      return $error || $loading ? '' : $result?.excerpt || '';
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
    vueWarn(process.env.NODE_ENV === 'production', info || err.message, vm);
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
          <div class="loading text-center py-10">{this.$tv('common.tips.loading', '加载中')}</div>
        ) : $error ? (
          <div class="error--text text-center py-10">{$error.message}</div>
        ) : !postData ? (
          <div class="error--text text-center py-10">
            {this.$tv('post_template.index.not_found_text', '内容不存在！')}
          </div>
        ) : isConfigInvalid() ? (
          <div class="error--text text-center py-10">
            {this.$tv('post_template.index.schema_error_text', '内容配置错误！')}
          </div>
        ) : this.renderError ? (
          <div class="error--text text-center py-10">
            {this.$tv('post_template.index.render_error_text', '内容渲染错误！')}
            <p>{this.renderError}</p>
          </div>
        ) : (
          [
            <div class={classes.title}>
              <p class={classes.titleMainLine}>{postData.title}</p>
              <p class={classes.titleSubLine}>{formatDate(postData.createdAt, 'L HH:mm', this.$i18n.locale)}</p>
            </div>,
            <div class={['ck-content', classes.content]} domPropsInnerHTML={postData.content}></div>,
          ]
        )}{' '}
      </div>
    );
  },
});
