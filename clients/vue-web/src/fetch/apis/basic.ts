import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/infrastructure-request';

// Types
import type { TypedQueryDocumentNode, TypedSubscriptionDocumentNode } from '@ace-pomelo/shared-client';

export type Message =
  // event message
  | { type: 'EventMessageSubscriotion'; eventName: string }
  | { type: 'StringPayloadEventMessageSubscriotion'; eventName: string; payload: string }
  | { type: 'NumberPayloadEventMessageSubscriotion'; eventName: string; payload: number }
  | { type: 'BooleanPayloadEventMessageSubscriotion'; eventName: string; payload: boolean }
  | { type: 'ObjectPayloadEventMessageSubscriotion'; eventName: string; payload: object }
  // content message
  | { content: string; to?: string };

/**
 * prefix 需要注册到window._ENV上
 */
export const useBasicApi = defineRegistApi('basic', {
  apis: {
    // 获取程序初始化自动加载配置
    getAutoloadOptions: gql`
      query getAutoloadOptions {
        options: autoloadOptions
      }
    ` as TypedQueryDocumentNode<{ options: Record<string, string> }>,
    // 获取 optionName 的项
    getOptionValue: gql`
      query getOptionValue($name: String!) {
        value: optionValue(name: $name)
      }
    ` as TypedQueryDocumentNode<{ value: string }, { name: string }>,
    // 消息订阅
    onMessage: gql`
      subscription OnMessage {
        message: onMessage {
          type: __typename
          ... on EventMessageSubscriotion {
            eventName
          }
          ... on StringPayloadEventMessageSubscriotion {
            eventName
            payload
          }
          ... on NumberPayloadEventMessageSubscriotion {
            eventName
            payload
          }
          ... on BooleanPayloadEventMessageSubscriotion {
            eventName
            payload
          }
          ... on ObjectPayloadEventMessageSubscriotion {
            eventName
            payload
          }
          ... on ContentMessageSubscriotion {
            content
            to
          }
        }
      }
    ` as TypedSubscriptionDocumentNode<{
      message: Message;
    }>,
  },
  request,
});
