import Lazyload from 'lazyload';
import { defineComponent, computed, onMounted } from '@vue/composition-api';
import { createSchemaField, FragmentComponent } from '@formily/vue';
import { Card } from 'ant-design-vue';
import { FormGrid, FormCollapse, FormTab, Space } from '@formily/antdv';
import * as Antdv from '@formily-portal/antdv';
import { Page } from '@formily-portal/antdv';
import { Spin, Result } from '@/components';
import { useI18n } from '@/composables';
import { checkSchemaValid, type IFormilySchema } from '../form/utils';

// Types
import type { SchemaComponents } from '@formily/vue';
import type { SchemaFramework } from '@ace-pomelo/shared/client';

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

    onMounted(() => {
      if (props.framework === 'HTML') {
        new Lazyload(document.querySelectorAll('img[data-lazy]'));
      }
    });

    // TODO: 外面不包一层，上面的解构类型错误
    return () => (
      <FragmentComponent>
        {!isSchemaValid.value ? (
          <Result
            status="error"
            title={i18n.tv('page_template.index.schema_error_text', '页面配置错误！') as string}
            subTitle={i18n.tv('page_template.index.contact_administrator_tips', '请联系管理员。') as string}
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
              title={i18n.tv('page_template.index.render_error_text', '页面渲染错误！') as string}
            ></Result>
          </suspense>
        )}
      </FragmentComponent>
    );
  },
});
