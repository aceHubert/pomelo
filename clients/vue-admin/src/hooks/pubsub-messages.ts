import { getCurrentInstance } from '@vue/composition-api';
import { warn } from '@ace-util/core';

// Types
import type { UnwrapRef } from '@vue/composition-api';
import type { MessageConfig } from '@/types';

export function usePubSubMessages(): UnwrapRef<{
  value: MessageConfig[];
  count: number;
}> {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return undefined as any;
  }

  // provide from plugins/pubsub-messages
  const pubsubMessages = instance.proxy.$pubSubMessages;

  return pubsubMessages;
}
