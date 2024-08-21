import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql-request/basic';

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
  // event message
  // | { eventName: string }
  // post/form/page/template review
  | {
      eventName:
        | 'createPostReview'
        | 'updatePostReview'
        | 'createPageReview'
        | 'updatePageReview'
        | 'createFormReview'
        | 'updateFormReview'
        | 'createTemplateReview'
        | 'updateTemplateReview';
      objectPayload: { id: string };
    }
  // content message
  | { content: string; to?: string };

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
