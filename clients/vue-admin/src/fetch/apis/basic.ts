import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/infrastructure-request';

// Types
import type { TypedQueryDocumentNode, TypedSubscriptionDocumentNode } from '@ace-pomelo/shared-client';

export enum OptionAutoload {
  Yes = 'Yes',
  No = 'No',
}

export interface OptionModel {
  id: string;
  name: string;
  value: string;
  autoload: OptionAutoload;
}

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
  apis: {
    // 获取程序初始化自动加载配置
    getAutoloadOptions: gql`
      query getAutoloadOptions {
        options: autoloadOptions
      }
    ` as TypedQueryDocumentNode<{ options: Record<string, string> }>,
    // 获取Option
    getOption: gql`
      query getOption($id: ID!) {
        option(id: $id) {
          id
          name: optionName
          value: optionValue
          autoload
        }
      }
    ` as TypedQueryDocumentNode<{ option: OptionModel | null }, { id: string }>,
    // 获取 Option Value
    getOptionValue: gql`
      query getOptionValue($name: String!) {
        value: optionValue(name: $name)
      }
    ` as TypedQueryDocumentNode<{ value: string | null }, { name: string }>,
    // 消息订阅
    onMessage: gql`
      subscription OnMessage {
        message: onMessage {
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
  },
  request,
});
