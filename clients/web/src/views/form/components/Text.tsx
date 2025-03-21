import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: ['mode', 'value', 'content'],
  setup(props, { attrs }) {
    const TagName = props.mode === 'normal' || !props.mode ? 'div' : props.mode;
    return () => {
      return <TagName attrs={attrs}>{props.value || props.content}</TagName>;
    };
  },
});
