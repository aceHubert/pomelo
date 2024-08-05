import { defineComponent, computed } from '@vue/composition-api';
import { ScreenType } from '@designable/core';
import { observer } from '@formily/reactive-vue';
import { FragmentComponent as Fragment } from '@formily/vue';
import { ResourceWidget, ComponentTreeWidget, useScreen } from '@formily/antdv-designable';
import {
  Form,
  FormTab,
  FormCollapse,
  FormLayout,
  FormGrid,
  ArrayCards,
  ArrayItems,
  ArrayTable,
  Field,
  ObjectContainer,
  Card,
  Cascader,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Password,
  Radio,
  Rate,
  Slider,
  Switch,
  Select,
  Space,
  TimePicker,
  Text,
  Transfer,
  TreeSelect,
  Upload,
} from '@formily/antdv-prototypes';
import {
  Form as VanForm,
  ArrayItems as VanArrayItems,
  Group as VanGroup,
  Field as VanField,
  Input as VanInput,
  Picker as VanPicker,
  Checkbox as VanCheckbox,
  Radio as VanRadio,
  DatetimePicker as VanDatetimePicker,
  Switch as VanSwitch,
  Stepper as VanStepper,
  Calendar as VanCalendar,
  Cascader as VanCascader,
  Rate as VanRate,
  Slider as VanSlider,
  Uploader as VanUploader,
  Space as VanSpace,
  Area as VanArea,
  Text as VanText,
  ObjectContainer as VanObjectContainer,
} from '@formily/vant-prototypes';

export const ResourceWidgets = defineComponent({
  name: 'DnResourceWidgets',
  setup() {
    const screen = useScreen();

    const sources = computed(() => {
      switch (screen.value.type) {
        case ScreenType.Mobile:
          return {
            Inputs: [
              VanInput,
              VanPicker,
              VanCheckbox,
              VanRadio,
              VanSwitch,
              VanCalendar,
              VanDatetimePicker,
              VanCascader,
              VanStepper,
              VanRate,
              VanSlider,
              VanUploader,
              VanArea,
              VanObjectContainer,
            ],
            Layouts: [VanGroup, VanSpace],
            Arrays: [VanArrayItems],
            Displays: [VanText],
          };
        case ScreenType.PC:
          return {
            Inputs: [
              Input,
              Password,
              InputNumber,
              Checkbox,
              Radio,
              DatePicker,
              TimePicker,
              TreeSelect,
              Select,
              Rate,
              Slider,
              Switch,
              Cascader,
              Transfer,
              Upload,
              ObjectContainer,
            ],
            Layouts: [Card, FormGrid, FormTab, FormLayout, FormCollapse, Space],
            Arrays: [ArrayItems, ArrayCards, ArrayTable],
            Displays: [Text],
          };

        default:
          return {
            Inputs: [Input],
            Displays: [Text],
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
    name: 'DnComponentWidget',
    setup() {
      const screen = useScreen();

      const components = computed(() => {
        switch (screen.value.type) {
          case ScreenType.Mobile:
            return {
              Form: VanForm,
              Group: VanGroup,
              ArrayItems: VanArrayItems,
              Field: VanField,
              ObjectContainer: VanObjectContainer,
              Input: VanInput,
              Picker: VanPicker,
              Checkbox: VanCheckbox,
              Radio: VanRadio,
              DatetimePicker: VanDatetimePicker,
              Switch: VanSwitch,
              Stepper: VanStepper,
              Space: VanSpace,
              Calendar: VanCalendar,
              Cascader: VanCascader,
              Rate: VanRate,
              Slider: VanSlider,
              Uploader: VanUploader,
              Area: VanArea,
              Text: VanText,
            };
          case ScreenType.PC:
            return {
              Form,
              FormTab,
              FormCollapse,
              FormLayout,
              FormGrid,
              ArrayCards,
              ArrayItems,
              ArrayTable,
              Field,
              ObjectContainer,
              Card,
              Cascader,
              Checkbox,
              DatePicker,
              Input,
              InputNumber,
              Password,
              Radio,
              Rate,
              Slider,
              Switch,
              Select,
              Space,
              TimePicker,
              Text,
              Transfer,
              TreeSelect,
              Upload,
            };
          default:
            return {
              Form,
              Field,
              Input,
              Text,
            };
        }
      });

      return () => <ComponentTreeWidget components={components.value} />;
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
