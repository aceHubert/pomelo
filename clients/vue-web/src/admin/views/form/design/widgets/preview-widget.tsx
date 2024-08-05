import { defineComponent, computed } from '@vue/composition-api';
import { ScreenType } from '@designable/core';
import { useScreen } from '@formily/antdv-designable';
import { transformToSchema } from '@designable/formily-transformer';
import { createForm } from '@formily/core';
import { createSchemaField } from '@formily/vue';
import { Card, Rate } from 'ant-design-vue';
import { Form as AntForm, FormButtonGroup as AntFormButtonGroup, Submit as AntSubmit } from '@formily/antdv';
import * as Antdv from '@formily/antdv';
import { Text } from '@formily/antdv-prototypes';
import { Form as VanForm, Submit as VanSubmit } from '@formily/vant';
import * as Vant from '@formily/vant';
import { Text as VanText } from '@formily/vant-prototypes';
import { useI18n } from '@/hooks';

// Types
import type { TreeNode } from '@designable/core';
import type { SchemaComponents } from '@formily/vue';

const AntSchemaFields = createSchemaField({
  components: {
    Card,
    Rate,
    Text,
    ...(Antdv as SchemaComponents),
  },
});

const VanSchemaFields = createSchemaField({
  components: {
    Text: VanText,
    ...(Vant as SchemaComponents),
  },
});

export type PreviewWidgetProps = {
  tree: TreeNode;
};

export const PreviewWidget = defineComponent({
  name: 'PreviewWidget',
  props: ['tree'],
  setup(props) {
    const i18n = useI18n();
    const form = createForm();
    const screen = useScreen();

    const treeSchema = computed(() => transformToSchema(props.tree));

    return () => {
      const { form: { style, ...formProps } = {}, schema } = treeSchema.value;
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            overflowY: 'auto',
          }}
        >
          {screen.value.type === ScreenType.Mobile ? (
            <VanForm style={style} attrs={formProps} form={form}>
              <VanSchemaFields.SchemaField schema={schema} />
              <div style="padding: 20px 16px;">
                <VanSubmit round block>
                  {i18n.tv('common.btn_text.submit', '提交')}
                </VanSubmit>
              </div>
            </VanForm>
          ) : (
            <AntForm style={style} attrs={formProps} form={form}>
              <AntSchemaFields.SchemaField schema={schema} />
              <AntFormButtonGroup align-form-item>
                <AntSubmit shape="round">{i18n.tv('common.btn_text.submit', '提交')}</AntSubmit>
                {/* <AntReset validate forceClear>
                  {i18n.tv('common.btn_text.reset', '重置')}
                </AntReset> */}
              </AntFormButtonGroup>
            </AntForm>
          )}
        </div>
      );
    };
  },
});
