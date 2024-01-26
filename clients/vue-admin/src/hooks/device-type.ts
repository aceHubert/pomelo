import { ref, reactive, computed, inject } from 'vue-demi';
import { DeviceType } from 'antdv-layout-pro/types';
import { DEVICE_TYPE_INJECT_KEY } from '@/mixins/device';

/**
 * 使用前请在root组件中使用`useDeviceMixin`注入
 */
export const useDeviceType = (defaultValue = DeviceType.Desktop) => {
  const deviceType = inject(DEVICE_TYPE_INJECT_KEY, () => ref(defaultValue));
  const isMobile = computed(() => deviceType.value === DeviceType.Mobile);
  const isDesktop = computed(() => deviceType.value === DeviceType.Desktop);
  const isTablet = computed(() => deviceType.value === DeviceType.Tablet);

  return reactive({
    type: deviceType,
    isMobile,
    isDesktop,
    isTablet,
  });
};
