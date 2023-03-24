import { ref } from '@vue/composition-api';
import { router } from '@/router';

export class SharedError extends Error {
  statusCode: number;

  constructor(message: string, code = 500) {
    super(message);

    this.statusCode = code;
  }
}

/**
 * 全局的request loading 状态
 */
export const loadingRef = ref(false);

/**
 * 全局的request error
 */
export const errorRef = ref<SharedError | false>(false);

router.beforeEach((to, from, next) => {
  if (to.path !== from.path) {
    errorRef.value = false;
  }
  next();
});
