import { defineComponent, computed } from '@vue/composition-api';
import { createSchemaField, FragmentComponent } from '@formily/vue';
import { Space } from '@formily/vant';
import { Loading } from 'vant';
import * as Vant from '@formily-portal/vant';
import { Page } from '@formily-portal/vant';
import { Result } from '@/components';
import { useI18n } from '@/hooks';
import { checkSchemaValid, type IFormilySchema } from '../form/utils';

// Types
import type { SchemaComponents } from '@formily/vue';
import type { SchemaFramework } from '@pomelo/shared-web';

const { SchemaField } = createSchemaField({
  components: {
    Space,
    ...(Vant as SchemaComponents),
  },
});

export interface MobilePageProps {
  content: any;
  framework: SchemaFramework;
}

export default defineComponent({
  name: 'MobilePage',
  props: {
    content: [],
    framework: { type: String, default: 'FORMILYJS' },
  },
  setup(props: MobilePageProps) {
    const i18n = useI18n();

    const schema = computed(() => {
      if (props.framework === 'FORMILYJS') {
        const schema = (props.content ?? {}) as {
          responsive?: IFormilySchema;
          mobile?: IFormilySchema;
          desktop?: IFormilySchema;
        };
        return schema.mobile && checkSchemaValid(schema.mobile) ? schema.mobile : schema.responsive;
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
            <div style="text-align:center" slot="fallback">
              <Loading />
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
