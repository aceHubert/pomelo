import { defineComponent, computed } from '@vue/composition-api';
import { transformToSchema, transformToTreeNode } from '@designable/formily-transformer';
import { codemirror as CodeMirror } from 'vue-codemirror';
import { debounce } from 'lodash-es';

// import base style
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';

// Types
import { TreeNode } from '@designable/core';

export type SchemaEditorWidgetProps = {
  tree: TreeNode;
};

export const SchemaEditorWidget = defineComponent({
  name: 'SchemaEditorWidget',
  props: ['tree'],
  emits: ['change'],
  setup(props, { emit }) {
    const code = computed(() => {
      return JSON.stringify(transformToSchema(props.tree), null, 2);
    });

    const handleEmitChanges = debounce((cm) => {
      emit('change', transformToTreeNode(JSON.parse(cm.getValue())));
    }, 200);

    const cmReady = (mirror: any) => {
      mirror.setSize('100%', '100%');
      mirror.on('changes', handleEmitChanges);
    };

    return () => {
      return (
        <CodeMirror
          onReady={cmReady}
          style="height:100%;width:100%;"
          value={code.value}
          props={{
            options: {
              tabSize: 4,
              lineNumbers: true,
              line: true,
              mode: 'text/javascript',
            },
          }}
        />
      );
    };
  },
});
