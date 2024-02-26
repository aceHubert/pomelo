import { reactive } from '@vue/composition-api';
import { warn } from '@ace-util/core';
import { useBasicApi } from '@/fetch/apis';
import { notification } from '@/components/antdv-helper';

// Types
import type { UnwrapRef } from '@vue/composition-api';
import type { MessageConfig } from 'antdv-layout-pro/types';
import type { Plugin } from '@/types';
import type { Message } from '@/fetch/apis';

const plugin: Plugin = ({ app }, inject) => {
  const basicApi = useBasicApi();

  const messages = reactive({
    value: [] as (MessageConfig & {
      originalData?: Message;
    })[],
    count: 0,
  });

  const unsubscribes: Array<(() => void) | null> = [];

  const notice = (message: MessageConfig) => {
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
                attrs: {
                  href: message.to,
                },
                on: {
                  click: () => {
                    messages.value = messages.value.filter((item) => item !== message);
                    messages.count -= 1;
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
          if (data) {
            let title = '',
              content = '',
              to: string | undefined;
            const { message } = data;
            if ('content' in message) {
              title = '您有一条新消息';
              content = message.content;
              to = message.to;
            } else {
              let existMessage;
              switch (message.eventName) {
                case 'createPostReview':
                case 'updatePostReview':
                  if (
                    (existMessage = messages.value.find(
                      (item) =>
                        item.originalData &&
                        'eventName' in item.originalData &&
                        item.originalData.eventName === message.eventName &&
                        message.objectPayload.id === message.objectPayload.id,
                    ))
                  ) {
                    // 相同类型消息不添加
                    notice(existMessage);
                  } else {
                    title = '内容申请审核';
                    content =
                      message.eventName === 'createPostReview'
                        ? '用户新建了一篇文章需要您审核！'
                        : '用户修改了文章内容需要您审核！';
                    to = app.router!.resolve({
                      name: 'post-edit',
                      params: {
                        id: message.objectPayload.id,
                      },
                    }).href;
                  }
                  break;
                case 'createPageReview':
                case 'updatePageReview':
                  if (
                    (existMessage = messages.value.find(
                      (item) =>
                        item.originalData &&
                        'eventName' in item.originalData &&
                        item.originalData.eventName === message.eventName &&
                        message.objectPayload.id === message.objectPayload.id,
                    ))
                  ) {
                    // 相同类型消息不添加
                    notice(existMessage);
                  } else {
                    title = '内容申请审核';
                    content =
                      message.eventName === 'createPageReview'
                        ? '用户新建了页面需要您审核！'
                        : '用户修改了页面需要您审核！';
                    to = app.router!.resolve({
                      name: 'page-edit',
                      params: {
                        id: message.objectPayload.id,
                      },
                    }).href;
                  }
                  break;
                case 'createFormReview':
                case 'updateFormReview':
                  if (
                    (existMessage = messages.value.find(
                      (item) =>
                        item.originalData &&
                        'eventName' in item.originalData &&
                        item.originalData.eventName === message.eventName &&
                        message.objectPayload.id === message.objectPayload.id,
                    ))
                  ) {
                    // 相同类型消息不添加
                    notice(existMessage);
                  } else {
                    title = '内容申请审核';
                    content =
                      message.eventName === 'createFormReview'
                        ? '用户新建了表单需要您审核！'
                        : '用户修改了表单需要您审核！';
                    to = app.router!.resolve({
                      name: 'form-edit',
                      params: {
                        id: message.objectPayload.id,
                      },
                    }).href;
                  }
                  break;
              }
            }

            if (content) {
              const message = {
                title,
                content,
                to,
                originalData: data.message,
              };

              messages.value.push(message);
              messages.count += 1;
              notice(message);
            }
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
