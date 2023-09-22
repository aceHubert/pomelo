import { defineComponent, ref, computed, onErrorCaptured } from '@vue/composition-api';
import { warn } from '@ace-util/core';
import { createSchemaField, FragmentComponent } from '@formily/vue';
import { Card, Result, Skeleton } from 'ant-design-vue';
import { FormGrid, FormCollapse, FormTab, Space } from '@formily/antdv';
import * as Antdv from '@formily-portal/antdv';
import { Page } from '@formily-portal/antdv';
import { Spin } from '@/components';
import { useI18n } from '@/hooks';
import { checkSchemaValid, type IFormilySchema } from '../form/utils';

// Types
import type { SchemaComponents } from '@formily/vue';
import type { SchemaFramework } from '@pomelo/shared-web';

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

export interface DesktopPageProps {
  title: string;
  content: any;
  metas: Record<string, string>;
  framework: SchemaFramework;
  loading?: boolean;
  error?: Error;
}

export default defineComponent({
  name: 'DesktopPage',
  props: {
    title: String,
    content: [],
    metas: {
      type: Object,
      default: () => ({}),
    },
    framework: {
      type: String,
      default: 'FORMILYJS',
    },
    loading: Boolean,
    error: Object,
  },
  setup(props: DesktopPageProps) {
    const i18n = useI18n();

    const schema = computed(() => {
      if (props.framework === 'FORMILYJS') {
        const schema = (props.content ?? {}) as {
          responsive?: IFormilySchema;
          mobile?: IFormilySchema;
          desktop?: IFormilySchema;
        };
        return schema.desktop && checkSchemaValid(schema.desktop) ? schema.desktop : schema.responsive;
      }
      return props.content;
    });

    const isSchemaValid = computed(() => {
      if (props.framework === 'FORMILYJS') {
        return schema.value && checkSchemaValid(schema.value);
      }
      // TODO: other framework
      return true;
    });

    const renderError = ref<false | string>(false);
    onErrorCaptured((err, vm, info) => {
      warn(process.env.NODE_ENV === 'production', info || err.message, vm);
      renderError.value = info || err.message;
      return false;
    });

    // TODO: 外面不包一层，上面的解构类型错误
    return () => (
      <FragmentComponent>
        {props.loading ? (
          <Skeleton active />
        ) : props.error ? (
          <Result
            status="error"
            title={i18n.tv('page_template.index.load_error_text', '页面加载错误！')}
            subTitle={props.error.message}
          ></Result>
        ) : !props.content ? (
          <Result
            status="error"
            title="404"
            subTitle={i18n.tv('page_template.index.not_found_text', '未找到页面！')}
          ></Result>
        ) : !isSchemaValid.value ? (
          <Result
            status="error"
            title={i18n.tv('page_template.index.schema_error_text', '页面配置错误！')}
            subTitle={i18n.tv('page_template.index.contact_administrator_tips', '请联系管理员。')}
          ></Result>
        ) : renderError.value ? (
          <Result
            status="error"
            title={i18n.tv('page_template.index.render_error_text', '页面渲染错误！')}
            subTitle={renderError.value}
          ></Result>
        ) : (
          <suspense>
            {props.framework === 'FORMILYJS' ? (
              <Page attrs={schema.value.page} style={schema.value.page?.style}>
                <SchemaField schema={schema.value.schema}></SchemaField>
              </Page>
            ) : props.framework === 'HTML' ? (
              <div class="ck-content" domPropsInnerHTML={schema.value}></div>
            ) : (
              <div>{`内容格式"${props.framework}"不支持渲染`}</div>
            )}
            <div class="text-center py-10" slot="fallback">
              <Spin />
            </div>
            <Result
              slot="error"
              status="error"
              title={i18n.tv('page_template.index.render_error_text', '页面渲染错误！')}
            ></Result>
          </suspense>
        )}
      </FragmentComponent>
    );
  },
});
