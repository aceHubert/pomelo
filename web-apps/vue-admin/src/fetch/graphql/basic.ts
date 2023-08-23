import { defineRegistApi, gql } from './core';

// Types
import type { TypedQueryDocumentNode, TypedSubscriptionDocumentNode } from './core/request';

export type Message =
  | { content: string; to?: string }
  // post review
  | { eventName: 'createPostReview' | 'updatePostReview'; objectPayload: { id: string } }
  // page review
  | { eventName: 'createPageReview' | 'updatePageReview'; objectPayload: { id: string } }
  // form review
  | { eventName: 'createFormReview' | 'updateFormReview'; objectPayload: { id: string } }
  // tempalte review
  | { eventName: 'createTemplateReview' | 'updateTemplateReview'; objectPayload: { id: string } };

export const useBasicApi = defineRegistApi('basic', {
  /**
   * 获取程序初始化自动加载配置
   */
  getAutoloadOptions: gql`
    query getAutoloadOptions {
      options: autoloadOptions
    }
  ` as TypedQueryDocumentNode<{ options: Record<string, any> }>,
  // 消息订阅
  onMessage: gql`
    subscription OnMessage {
      message {
        ... on EventMessageSubscriotion {
          eventName
        }
        ... on StringPayloadEventMessageSubscriotion {
          eventName
          stringPayload: payload
        }
        ... on IntPayloadEventMessageSubscriotion {
          eventName
          numberPayload: payload
        }
        ... on BooleanPayloadEventMessageSubscriotion {
          eventName
          booleanPayload: payload
        }
        ... on ObjectPayloadEventMessageSubscriotion {
          eventName
          objectPayload: payload
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
});
