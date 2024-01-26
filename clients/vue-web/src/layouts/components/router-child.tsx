import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'RouterChild',
  props: {
    keepAlive: Boolean,
    keepAliveProps: {
      type: Object,
      default: undefined,
    },
  },
  setup(props) {
    return () => {
      let routerView = <router-view></router-view>;

      if (props.keepAlive) {
        routerView = <keep-alive {...{ props: props.keepAliveProps }}>{routerView}</keep-alive>;
      }
      return routerView;
    };
  },
});
