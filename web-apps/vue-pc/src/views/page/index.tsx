import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { createSchemaField, FragmentComponent } from '@formily/vue';
import { Card, Result, Skeleton } from 'ant-design-vue';
import { FormGrid, FormCollapse, FormTab, Space } from '@formily/antdv';
import * as Antdv from '@formily-portal/antdv';
import { Page } from '@formily-portal/antdv';
import { useRoute } from 'vue2-helpers/vue-router';
import { createResource } from '@vue-async/resource-manager';
import { jsonDeserializeReviver, warn } from '@ace-util/core';
import { useTemplateApi } from '@pomelo/shared-web';
import { Spin } from '@/components';
import { useI18n } from '@/hooks';
import { TemplateSchemaPcMetaKey, TemplateStyleLinkMetaKey, TemplateStyleCssTextMetaKey } from '../constants';

// Types
import type { SchemaComponents } from '@formily/vue';
import type { PageTemplateWithMetasModel } from '@pomelo/shared-web';

const { SchemaField } = createSchemaField({
  components: {
    Card,
    FormGrid,
    FormCollapse,
    FormTab,
    Space,
    ...(Antdv as SchemaComponents),
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
    const i18n = useI18n();
    const route = useRoute();
    const templateApi = useTemplateApi();

    const pageRes = createResource(async ({ id, name }: { id?: string; name: string }) => {
      const metaKeys = [TemplateSchemaPcMetaKey, TemplateStyleLinkMetaKey, TemplateStyleCssTextMetaKey];
      let promise: Promise<{ data: PageTemplateWithMetasModel | undefined }> = Promise.resolve({
        data: undefined,
      });
      if (id) {
        // from /p/:id
        promise = templateApi.getPage({
          params: {
            id,
            metaKeys,
          },
        });
      } else if (name) {
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
          page.metas?.find((meta) => meta.metaKey === TemplateSchemaPcMetaKey)?.metaValue ||
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
      return $loading
        ? ''
        : $error
        ? i18n.tv('page.page_load_error_title', '页面加载错误')
        : $result?.title ?? i18n.tv('page.page_not_found_title', '未找到页面');
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
      links,
      cssText,
      pageTitle,
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
          <Skeleton active />
        ) : $error ? (
          <Result
            status="error"
            title={this.$tv('page_template.index.load_error_text', '页面加载错误！')}
            subTitle={$error.message}
          ></Result>
        ) : !pageData ? (
          <Result
            status="error"
            title="404"
            subTitle={this.$tv('page_template.index.not_found_text', '未找到页面！')}
          ></Result>
        ) : isConfigInvalid() ? (
          <Result
            status="error"
            title={this.$tv('page_template.index.schema_error_text', '页面配置错误！')}
            subTitle={this.$tv('page_template.index.contact_administrator_tips', '请联系管理员。')}
          ></Result>
        ) : this.renderError ? (
          <Result
            status="error"
            title={this.$tv('page_template.index.render_error_text', '页面渲染错误！')}
            subTitle={this.renderError}
          ></Result>
        ) : (
          <suspense>
            <Page attrs={pageData.schema.page} style={pageData.schema.page?.style}>
              <SchemaField schema={pageData.schema.schema}></SchemaField>
            </Page>
            <div class="text-center py-10" slot="fallback">
              <Spin />
            </div>
            <Result
              slot="error"
              status="error"
              title={this.$tv('page_template.index.render_error_text', '页面渲染错误！')}
            ></Result>
          </suspense>
        )}
      </FragmentComponent>
    );
  },
});
