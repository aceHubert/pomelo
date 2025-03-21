import { reactive } from '@vue/composition-api';
import { warn } from '@ace-util/core';
import { useBasicApi } from '@/fetch/apis';
import { notification } from '@/components/antdv-helper';

// Types
import type { UnwrapRef } from '@vue/composition-api';
import type { MessageConfig, Plugin } from '@/types';

type To =
  | string
  | {
      href: string;
      target: '_self' | '_blank';
    };

const plugin: Plugin = ({ app }, inject) => {
  const basicApi = useBasicApi(app.graphqlFetch);

  const messages = reactive({
    value: [] as (MessageConfig<To> & {
      originalData?: any;
    })[],
    count: 0,
  });

  const unsubscribes: Array<(() => void) | null> = [];

  const notice = (message: MessageConfig<To>) => {
    const key = Math.random().toString(16).substring(2);
    notification.info({
      key,
      top: '48px',
      message: message.title,
      description: message.content,
      btn: (h: any) =>
        message.to
          ? h(
              'a',
              {
                attrs:
                  typeof message.to === 'string'
                    ? { href: message.to, target: '_blank' }
                    : { href: message.to.href, target: message.to.target },
                on: {
                  click: () => {
                    messages.value = messages.value.filter((item) => item !== message);
                    messages.count -= 1;
                    // TODO: make as read in server
                    notification.close(key);
                  },
                },
              },
              '查看',
            )
          : null,
    });
  };

  const startSubscribe = () => {
    return [
      basicApi.onMessage({
        onData: (data) => {
          if (!data?.message) return;

          let title = '',
            content = '',
            to: To | undefined;
          const message = data.message;
          if ('content' in message) {
            title = 'New message';
            content = message.content;
            to = message.to;
          } else if (message.eventName) {
            // eslint-disable-next-line no-console
            console.log('message.eventName', message.eventName);
            // TODO: handle event message types
          } else {
            // TODO: handle other message types
          }

          if (content) {
            const messageConfig = {
              title,
              content,
              to,
              originalData: message,
            };

            messages.value.push(messageConfig);
            messages.count += 1;
            notice(messageConfig);
          }
        },
        onError: (err: any) => {
          warn(process.env.NODE_ENV === 'production', `Message subscription error, ${err.message}!`);
        },
        onComplete: () => {
          warn(process.env.NODE_ENV === 'production', 'Message subscription complete!');
        },
      }),
    ];
  };

  const mounted = app.mounted;
  app.mounted = function () {
    unsubscribes.push(...startSubscribe());
    mounted?.call(this);
  };

  const beforeDestroy = app.beforeDestroy;
  app.beforeDestroy = function () {
    unsubscribes.map((unsubscribe) => unsubscribe?.());
    beforeDestroy?.call(this);
  };

  inject('pubSubMessages', messages);
};

export default plugin;

declare module 'vue/types/vue' {
  interface Vue {
    $pubSubMessages: UnwrapRef<{
      value: MessageConfig[];
      count: number;
    }>;
  }
}
