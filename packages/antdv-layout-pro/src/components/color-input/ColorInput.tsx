import { defineComponent, computed } from 'vue-demi';
import { Input, Popover } from 'ant-design-vue';
import VueColor from 'vue-color';
import { useConfigProvider } from '../../shared';

// Types
import type { Popover as PopoverProps } from 'ant-design-vue/types/popover';

export interface ColorInputProps {
  value?: string;
  disableAlpha?: boolean;
  disableFields?: boolean;
  presetColors?: string[];
  popupProps?: Pick<
    PopoverProps,
    | 'arrowPointAtCenter'
    | 'autoAdjustOverflow'
    | 'mouseEnterDelay'
    | 'mouseLeaveDelay'
    | 'overlayClassName'
    | 'overlayStyle'
    | 'placement'
    | 'destroyTooltipOnHide'
    | 'align'
  >;
  prefixCls?: string;
}

export default defineComponent({
  name: 'ColorInput',
  emits: ['change'],
  props: {
    value: String,
    disableAlpha: Boolean,
    disableFields: Boolean,
    presetColors: Array,
    popupProps: Object,
    colorPickerProps: Object,
    prefixCls: String,
  },
  setup(props: ColorInputProps, { attrs, emit, refs }) {
    const configProvider = useConfigProvider();
    const containerRef = computed<HTMLDivElement>(() => refs.container as HTMLDivElement);

    const customizePrefixCls = props.prefixCls;
    const getPrefixCls = configProvider.getPrefixCls;
    const prefixCls = getPrefixCls('color-input', customizePrefixCls);

    return () => (
      <div ref="container" class={prefixCls}>
        <Input
          value={props.value}
          attrs={attrs}
          scopedSlots={{
            prefix: () => (
              <Popover
                props={{
                  ...props.popupProps,
                  trigger: 'click',
                  overlayInnerStyle: { padding: 0 },
                  getPopupContainer: () => containerRef.value,
                }}
                scopedSlots={{
                  content: () => (
                    <VueColor.Sketch
                      props={{
                        disableAlpha: props.disableAlpha,
                        disableFields: props.disableFields,
                        presetColors: props.presetColors,
                        value: props.value || {},
                      }}
                      onInput={({ hex, rgba }) => {
                        emit('change', props.disableAlpha ? hex : `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`);
                      }}
                    />
                  ),
                }}
              >
                <div
                  class={`${prefixCls}-color-tips`}
                  style={{
                    backgroundColor: props.value,
                  }}
                ></div>
              </Popover>
            ),
          }}
          onChange={(e) => {
            emit('change', e.target.value);
          }}
        ></Input>
      </div>
    );
  },
});
