import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { createSchemaField, FragmentComponent } from '@formily/vue';
import { Space } from '@formily/vant';
import { Loading } from 'vant';
import * as Vant from '@formily-portal/vant';
import { Page } from '@formily-portal/vant';
import { useRoute } from 'vue2-helpers/vue-router';
import { createResource } from '@vue-async/resource-manager';
import { useTemplateApi, jsonDeserializeReviver, warn } from '@pomelo/shared-web';
import { TemplateSchemaMobileMetaKey, TemplateStyleLinkMetaKey, TemplateStyleCssTextMetaKey } from '../constants';

// Types
import type { PageTemplateWithMetasModel } from '@pomelo/shared-web';
import type { SchemaComponents } from '@formily/vue';

const { SchemaField } = createSchemaField({
  components: {
    Space,
    ...(Vant as SchemaComponents),
  },
});

export default defineComponent({
  name: 'PageView',
  head() {
    return {
      title: this.pageTitle as string,
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

    const pageRes = createResource(async ({ id, name }: { id?: string; name: string }) => {
      const metaKeys = [TemplateSchemaMobileMetaKey, TemplateStyleLinkMetaKey, TemplateStyleCssTextMetaKey];
      let promise: Promise<{ data: PageTemplateWithMetasModel | undefined }>;
      if (id) {
        // from /p/:id
        promise = templateApi.getPage({
          params: {
            id,
            metaKeys,
          },
        });
      } else {
        // from fallback
        promise = templateApi.getPageByName({
          params: {
            name,
            metaKeys,
          },
        });
      }

      const { data: page } = await promise;

      return (page && {
        ...page,
        schema: JSON.parse(
          page.metas?.find((meta) => meta.metaKey === TemplateSchemaMobileMetaKey)?.metaValue ||
            page.schema ||
            (null as any), // JSON.parse works with null but not undefined
          jsonDeserializeReviver(),
        ),
      }) as (Omit<PageTemplateWithMetasModel, 'schema'> & { schema: Record<string, any> }) | undefined;
    });

    watch(
      [() => route.params.id, () => route.path],
      ([id, path]) => {
        // path 去掉开始 "/" 作为 name
        pageRes.read({ id: id, name: encodeURIComponent(path.substring(1)) });
      },
      { immediate: true },
    );

    const renderError = ref<false | string>(false);

    // page title
    const pageTitle = computed(() => {
      const { $error, $loading, $result } = pageRes;
      return $error || $loading ? '' : $result?.title || '';
    });

    // stylesheets
    const links = computed<string[]>(() => {
      const { $error, $loading, $result } = pageRes;
      return $error || $loading
        ? []
        : JSON.parse($result?.metas?.find(({ metaKey }) => metaKey === TemplateStyleLinkMetaKey)?.metaValue || '[]');
    });

    // css text
    const cssText = computed(() => {
      const { $error, $loading, $result } = pageRes;
      return $error || $loading
        ? ''
        : $result?.metas?.find(({ metaKey }) => metaKey === TemplateStyleCssTextMetaKey)?.metaValue || '';
    });

    return {
      pageRes,
      pageTitle,
      links,
      cssText,
      renderError,
    };
  },
  errorCaptured(err, vm, info) {
    warn(process.env.NODE_ENV === 'production', info || err.message, vm);
    this.renderError = info || err.message;
    return false;
  },
  render() {
    const { $error, $loading, $result: pageData } = this.pageRes;

    const isEmptyObj = (obj: any) => JSON.stringify(obj) === '{}';
    const isConfigInvalid = () => {
      return !pageData || isEmptyObj(pageData.schema) || isEmptyObj(pageData.schema.schema);
    };

    // TODO: 外面不包一层，上面的解构类型错误
    return (
      <FragmentComponent>
        {$loading ? (
          <div class="loading text-center py-10">{this.$tv('common.tips.loading', '加载中')}</div>
        ) : $error ? (
          <div class="error--text text-center py-10">{$error.message}</div>
        ) : !pageData ? (
          <div class="error--text text-center py-10">
            {this.$tv('page_template.index.not_found_text', '未找到页面！')}
          </div>
        ) : isConfigInvalid() ? (
          <div class="error--text text-center py-10">
            {this.$tv('page_template.index.schema_error_text', '页面配置错误！')}
          </div>
        ) : this.renderError ? (
          <div class="error--text text-center py-10">
            {this.$tv('page_template.index.render_error_text', '页面渲染错误！')}
            <p>{this.renderError}</p>
          </div>
        ) : (
          <suspense>
            <Page attrs={pageData.schema.page} style={pageData.schema.page?.style}>
              <SchemaField schema={pageData.schema.schema}></SchemaField>
            </Page>
            <div style="text-align:center" slot="fallback">
              <Loading />
            </div>
            <div class="error--text text-center py-10" slot="error">
              {this.$tv('page_template.index.render_error_text', '页面渲染错误！')}
            </div>
          </suspense>
        )}
      </FragmentComponent>
    );
  },
});
