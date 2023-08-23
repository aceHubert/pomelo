import { onBeforeUnmount, ref, watch } from '@vue/composition-api';

// Types
import type { WatchSource } from '@vue/composition-api';

export function useEffect(func: () => void | (() => void | null), dependency: WatchSource | WatchSource[]) {
  const disposes: Array<void | (() => void | null)> = [];

  // watch 空数组不会立即执行
  if (Array.isArray(dependency) && !dependency.length) {
    dependency.push(ref('FAKEVALUE'));
  }

  watch(
    dependency,
    () => {
      disposes.forEach((fn) => fn?.());
      disposes.push(func());
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    disposes.forEach((fn) => fn?.());
  });
}
