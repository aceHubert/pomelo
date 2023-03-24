import { getCurrentInstance, UnwrapRef } from '@vue/composition-api';
import { warn } from '@pomelo/shared-web';

// Types
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
