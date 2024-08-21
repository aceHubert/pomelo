import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '@/fetch/graphql-request/basic';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-pomelo/shared-client';

export interface SiteInitArgs {
  // 站点标题
  title: string;
  // 管理员密码
  password: string;
  // 管理员邮箱
  email: string;
  // 站点默认语言
  locale: string;
  // 用户端访问地址
  homeUrl: string;
}

export const useSiteInitApi = defineRegistApi('site-init', {
  apis: {
    check: gql`
      query checkSiteInitialRequired {
        result: checkSiteInitialRequired
      }
    ` as TypedQueryDocumentNode<{ result: boolean }>,
    start: gql`
      mutation startSiteInitial($model: SiteInitArgsInput!) {
        result: startSiteInitial(model: $model)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { model: SiteInitArgs }>,
  },
  request,
});
