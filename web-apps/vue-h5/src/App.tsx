import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'App',
  head: {
    title: '',
    titleTemplate: (title: string) => (title ? `${title} | Portal` : 'Portal'),
  },
  setup() {
    return () => <router-view />;
  },
});
