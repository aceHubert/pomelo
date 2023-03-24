import { defineComponent, computed } from '@vue/composition-api';
import { ScreenType } from '@designable/core';
import { observer } from '@formily/reactive-vue';
import { FragmentComponent as Fragment } from '@formily/vue';
import { ResourceWidget, ComponentTreeWidget, useScreen } from '@formily/antdv-designable';
import { Card, FormGrid, FormCollapse, FormTab, Space } from '@formily/antdv-prototypes';
import {
  Field,
  Page,
  PageContainer,
  PageItem,
  Navbar,
  Banner,
  Entry,
  HtmlContent,
} from '@formily-portal/antdv-prototypes';
import { Space as VanSpace } from '@formily/vant-prototypes';
import {
  Field as VanField,
  Page as VanPage,
  PageContainer as VanPageContainer,
  PageItem as VanPageItem,
  Banner as VanBanner,
  Entry as VanEntry,
  HtmlContent as VanHtmlContent,
  Tabbar as VanTabbar,
} from '@formily-portal/vant-prototypes';

export const ResourceWidgets = defineComponent({
  name: 'ResourceWidgets',
  setup() {
    const screen = useScreen();

    const sources = computed(() => {
      switch (screen.value.type) {
        case ScreenType.Mobile:
          return {
            Displays: [VanTabbar, VanBanner, VanEntry, VanHtmlContent],
            Layouts: [VanPageContainer, VanPageItem, VanSpace],
          };
        case ScreenType.PC:
          return {
            Displays: [Navbar, Banner, Entry, HtmlContent],
            Layouts: [PageContainer, PageItem, Card, FormGrid, FormCollapse, FormTab, Space],
          };

        default:
          return {
            Displays: [],
          };
      }
    });

    return () => (
      <Fragment>
        {Object.keys(sources.value).map((key, index) => (
          <ResourceWidget
            key={`${screen.value.type}-${index}`}
            title={`sources.${key}`}
            sources={sources.value[key as keyof typeof sources.value]}
          />
        ))}
      </Fragment>
    );
  },
});

export const ComponentWidget = observer(
  defineComponent({
    name: 'ComponentWidget',
    setup() {
      const screen = useScreen();

      const components = computed(() => {
        switch (screen.value.type) {
          case ScreenType.Mobile:
            return {
              Page: VanPage,
              Field: VanField,
              PageContainer: VanPageContainer,
              PageItem: VanPageItem,
              Space: VanSpace,
              Banner: VanBanner,
              Entry: VanEntry,
              HtmlContent: VanHtmlContent,
              Tabbar: VanTabbar,
            };
          case ScreenType.PC:
            return {
              Page,
              Field,
              PageContainer,
              PageItem,
              Card,
              FormGrid,
              FormCollapse,
              FormTab,
              Space,
              Navbar,
              Banner,
              Entry,
              HtmlContent,
            };
          default:
            return {
              // Form,
              // Field,
              // Input,
              // Text,
            };
        }
      });

      return () => (
        <ComponentTreeWidget
          components={components.value}
          style={{ backgroundColor: screen.value.type === ScreenType.Mobile ? '#f1f3f7' : '#f8f9fb' }}
        />
      );
      // {
      //   if (screen.value.type === ScreenType.Mobile) {
      //     return <ComponentTreeWidget components={components.value} />;
      //   }
      //   return (
      //     // 防止样式与主应用产生冲突
      //     <ConfigProvider prefixCls="ant">
      //       <ComponentTreeWidget components={components.value} />;
      //     </ConfigProvider>
      //   );
      // };
    },
  }),
);
