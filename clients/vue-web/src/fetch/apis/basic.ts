import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/infrastructure-request';

// Types
import type { TypedQueryDocumentNode } from '@ace-pomelo/shared-client';

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
  },
  request,
});
