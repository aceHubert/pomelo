import { defineRegistGraphql, gql } from '@ace-fetch/graphql-vue';

// Types
import type { TypedQueryDocumentNode, TypedSubscriptionDocumentNode } from '@ace-fetch/graphql';

export enum OptionAutoload {
  Yes = 'Yes',
  No = 'No',
}

export interface OptionModel {
  id: number;
  name: string;
  value: string;
  autoload: OptionAutoload;
}

export interface NewOptionModel extends Omit<OptionModel, 'id'> {}

export interface UpdateOptionModel extends Partial<NewOptionModel> {}

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

export const useBasicApi = defineRegistGraphql('basic', {
  definition: {
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
    ` as TypedQueryDocumentNode<{ option: OptionModel | null }, { id: number }>,
    // 根据name获取Option
    getOptionByName: gql`
      query getOptionByName($name: String!) {
        option: optionByName(name: $name) {
          id
          name: optionName
          value: optionValue
          autoload
        }
      }
    ` as TypedQueryDocumentNode<{ option: OptionModel | null }, { name: string }>,
    // 获取 optionName 的项
    getOptionValue: gql`
      query getOptionValue($name: String!) {
        value: optionValue(name: $name)
      }
    ` as TypedQueryDocumentNode<{ value: string }, { name: string }>,
    // 创建配置选项
    createOption: gql`
      mutation createOption($model: NewOptionInput!) {
        option: createOption(model: $model) {
          id
          optionName
          optionValue
          autoload
        }
      }
    ` as TypedQueryDocumentNode<{ option: OptionModel }, { model: NewOptionModel }>,
    // 更新配置选项
    updateOption: gql`
      mutation updateOption($id: ID!, $model: UpdateOptionInput!) {
        updateOption(id: $id, model: $model)
      }
    ` as TypedQueryDocumentNode<{ updateOption: void }, { id: number; model: UpdateOptionModel }>,
    // 清除配置缓存
    clearOptionCache: gql`
      mutation clearOptionCache {
        clearOptionCache
      }
    ` as TypedQueryDocumentNode<{ clearOptionCache: void }>,
    deleteOption: gql`
      mutation deleteOption($id: ID!) {
        deleteOption(id: $id)
      }
    ` as TypedQueryDocumentNode<{ deleteOption: void }, { id: number }>,
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
            stringPayload: payload
          }
          ... on NumberPayloadEventMessageSubscriotion {
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
});
