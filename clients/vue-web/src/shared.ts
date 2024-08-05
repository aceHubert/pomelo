import { ref } from '@vue/composition-api';

/**
 * 全局的request loading 状态
 */
export const loadingRef = ref(false);

export class SharedError extends Error {
  statusCode: number;

  constructor(message: string, code = 500) {
    super(message);

    this.statusCode = code;
  }
}

/**
 * 全局的request error
 */
export const errorRef = ref<SharedError | false>(false);
