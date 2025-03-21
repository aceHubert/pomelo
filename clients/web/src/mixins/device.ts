import {
  ref,
  reactive,
  computed,
  provide,
  onMounted,
  onBeforeUnmount,
  type Ref,
  type InjectionKey,
} from '@vue/composition-api';
import { createMediaQueryDispatcher } from '@ace-util/core';
import { DeviceType } from '@/types';

// screen and (max-width: 1087.99px)
const defaultQueries = {
  [DeviceType.Desktop]: 'screen and (min-width: 1200px)',
  [DeviceType.Tablet]: 'screen and (min-width: 576px) and (max-width: 1199px)',
  [DeviceType.Mobile]: 'screen and (max-width: 576px)',
};

export const DEVICE_TYPE_INJECT_KEY: InjectionKey<Ref<DeviceType>> = Symbol('__DEVICE_TYPE__');

/**
 * 设备类型
 * 在 root 上引用后，在children component中可以使用 inject (useDeviceType) 获取
 * default queries:
 *  Desktop: > 1200px
 *  Tablet: 576px - 1199px
 *  Mobile: < 576px
 */
export const useDeviceMixin = (queries: Record<DeviceType, string> = defaultQueries) => {
  const device = ref(DeviceType.Desktop);
  const isMobile = computed(() => device.value === DeviceType.Mobile);
  const isDesktop = computed(() => device.value === DeviceType.Desktop);
  const isTablet = computed(() => device.value === DeviceType.Tablet);

  provide(DEVICE_TYPE_INJECT_KEY, device);

  let enquireJs!: ReturnType<typeof createMediaQueryDispatcher>;
  onMounted(() => {
    enquireJs = createMediaQueryDispatcher();
    enquireJs
      .register(queries[DeviceType.Mobile], () => (device.value = DeviceType.Mobile))
      .register(queries[DeviceType.Tablet], () => (device.value = DeviceType.Tablet))
      .register(queries[DeviceType.Desktop], () => (device.value = DeviceType.Desktop));
  });

  onBeforeUnmount(() => {
    enquireJs
      .unregister(queries[DeviceType.Mobile])
      .unregister(queries[DeviceType.Tablet])
      .unregister(queries[DeviceType.Desktop]);
  });

  return reactive({
    device,
    isMobile,
    isDesktop,
    isTablet,
  });
};
