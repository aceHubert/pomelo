import { defineComponent, getCurrentInstance, nextTick } from '@vue/composition-api';
import { errorRef } from '@/shared';
import RouterChild from './router-child';
import RouterError from './router-error';

export default defineComponent({
  name: 'RouterView2', // 命名与 <router-view> 冲突，会死循环
  props: {
    keepAlive: Boolean,
    keepAliveProps: {
      type: Object,
      default: undefined,
    },
  },
  errorCaptured(error) {
    // if we receive and error while showing the NuxtError component
    // capture the error and force an immediate update so we re-render
    if (this.displayingSharedError) {
      this.errorFromRouterError = error;
      this.$forceUpdate();
    }
  },
  setup(props) {
    const instance = getCurrentInstance();

    return () => {
      if (!errorRef.value) {
        return <RouterChild {...{ props }} />;
      }

      const _this = instance?.proxy as any;
      if (_this.errorFromRouterError) {
        nextTick(() => (_this.errorFromRouterError = false));

        return (
          <div>
            <h2>An error occurred while showing the error page</h2>
            <p>Unfortunately an error occurred and while showing the error page another error occurred</p>
            <p>{`Error details: ${(_this.errorFromNuxtError as Error).toString()}`}</p>
            <router-link to="/">Go back to home</router-link>
          </div>
        );
      }

      _this.displayingSharedError = true;
      nextTick(() => (_this.displayingSharedError = false));

      return (
        <RouterError
          error={{
            statusCode: errorRef.value.statusCode,
            message: errorRef.value.message,
          }}
        />
      );
    };
  },
});
