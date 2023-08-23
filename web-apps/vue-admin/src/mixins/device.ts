import { ref, reactive, computed, provide, onMounted, onBeforeUnmount } from '@vue/composition-api';
import { createMediaQueryDispatcher } from '@pomelo/shared-web';
import { DeviceType } from '@/types';

// screen and (max-width: 1087.99px)
const defaultQueries = {
  [DeviceType.Desktop]: 'screen and (min-width: 1200px)',
  [DeviceType.Tablet]: 'screen and (min-width: 576px) and (max-width: 1199px)',
  [DeviceType.Mobile]: 'screen and (max-width: 576px)',
};

export const DEVICE_INJECT_KEY = '__DEVICE__';
export const IS_MOBILE_INJECT_KEY = '__IS_MOBILE__';
export const IS_DESKTOP_INJECT_KEY = '__IS_DESKTOP__';
export const IS_TABLET_INJECT_KEY = '__IS_TABLET__';

export const useDeviceMixin = (queries = defaultQueries) => {
  const device = ref(DeviceType.Desktop);
  const isMobile = computed(() => device.value === DeviceType.Mobile);
  const isDesktop = computed(() => device.value === DeviceType.Desktop);
  const isTablet = computed(() => device.value === DeviceType.Tablet);

  provide(DEVICE_INJECT_KEY, device);
  provide(IS_MOBILE_INJECT_KEY, isMobile);
  provide(IS_DESKTOP_INJECT_KEY, isDesktop);
  provide(IS_TABLET_INJECT_KEY, isTablet);

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
