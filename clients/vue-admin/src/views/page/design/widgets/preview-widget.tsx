import { defineComponent, computed } from '@vue/composition-api';
import { ScreenType } from '@designable/core';
import { useScreen } from '@formily/antdv-designable';
import { createForm } from '@formily/core';
import { Card } from 'ant-design-vue';
import { FormGrid, FormCollapse, FormTab, Space } from '@formily/antdv';
import { Page as AntPage } from '@formily-portal/antdv';
import * as PortalAntdv from '@formily-portal/antdv';
import { Space as VanSpace } from '@formily/vant';
import { Page as VanPage } from '@formily-portal/vant';
import * as PortalVant from '@formily-portal/vant';
import { createSchemaField } from '@formily/vue';
import { transformToPageSchema } from '../utils';

// Types
import type { TreeNode } from '@designable/core';
import type { SchemaVueComponents } from '@formily/vue';

const AntSchemaFields = createSchemaField({
  components: {
    Card,
    FormGrid,
    FormCollapse,
    FormTab,
    Space,
    ...(PortalAntdv as SchemaVueComponents),
  },
});

const VanSchemaFields = createSchemaField({
  components: {
    Space: VanSpace,
    ...(PortalVant as SchemaVueComponents),
  },
});

export type PreviewWidgetProps = {
  tree: TreeNode;
};

export const PreviewWidget = defineComponent({
  name: 'PreviewWidget',
  props: ['tree'],
  setup(props) {
    const form = createForm();
    const screen = useScreen();

    const treeSchema = computed(() => transformToPageSchema(props.tree));

    return () => {
      const { page: pageProps = {}, schema } = treeSchema.value;
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            overflowY: 'auto',
          }}
        >
          {screen.value.type === ScreenType.Mobile ? (
            <VanPage form={form} style={pageProps.style} attrs={pageProps}>
              <VanSchemaFields.SchemaField schema={schema} />
            </VanPage>
          ) : (
            <AntPage form={form} style={pageProps.style} attrs={pageProps}>
              <AntSchemaFields.SchemaField schema={schema} />
            </AntPage>
          )}
        </div>
      );
    };
  },
});
