import { defineComponent } from 'vue-demi';
import MavonEditor from 'mavon-editor';
import { expose } from '../../shared';

// Types
import type { DefineComponent } from '../../types';

export default defineComponent({
  name: 'MarkdownInput',
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  emits: ['input'],
  setup(props, { emit, refs, attrs }) {
    expose({
      getEditor: () => refs['mavonEditor'] as any,
    });

    const MdEditor = MavonEditor.mavonEditor as DefineComponent<any>;

    return () => {
      return (
        <MdEditor
          ref="mavonEditor"
          value={props.value}
          props={{
            ...attrs,
          }}
          onChange={(val: string) => emit('input', val)}
        />
      );
    };
  },
});
