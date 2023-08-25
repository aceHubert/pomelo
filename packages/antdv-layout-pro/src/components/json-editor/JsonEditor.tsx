import { defineComponent, onMounted, computed } from 'vue-demi';
import JsonEditor from 'jsoneditor';
import { equals } from '@ace-util/core';
import { useEffect } from '../../shared';

// Types
import type { JSONEditorOptions } from 'jsoneditor';

export type JsonEditorProps = {
  value: any;
  schema?: Record<string, any>;
  options?: JSONEditorOptions;
};

export default defineComponent({
  name: 'JsonEditor',
  props: {
    value: {
      type: [Array, Object] as any,
      default: () => [],
    },
    schema: Object,
    options: Object,
  },
  emits: ['input', 'change', 'error'],
  setup(props: JsonEditorProps, { emit, refs }) {
    const containerRef = computed(() => refs['container'] as HTMLDivElement);

    let editor: InstanceType<typeof JsonEditor> | null = null;

    useEffect(() => {
      !equals(props.value, editor?.get()) && editor?.set(props.value);
    }, [() => props.value]);

    onMounted(() => {
      editor = new JsonEditor(containerRef.value, {
        mode: 'tree',
        navigationBar: false,
        statusBar: false,
        enableTransform: false,
        ...props.options,
        schema: props.schema,
        onChange: () => {
          editor!.validate().then((errs) => {
            const json = errs?.length ? {} : editor!.get();
            emit('change', json, errs);
            if (errs.length) {
              emit('input', json);
            }
          });

          props.options?.onChange?.();
        },
        onError: (err: Error) => {
          emit('error', err);

          props.options?.onError?.(err);
        },
      });
    });

    return () => <div ref="container"></div>;
  },
});
