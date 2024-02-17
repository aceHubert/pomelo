import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/infrastructure-request';

// Types
import type { TypedQueryDocumentNode } from '@ace-pomelo/shared-client';

export const useSiteInitApi = defineRegistApi('site-init', {
  apis: {
    check: gql`
      query checkSiteInitialRequired {
        result: checkSiteInitialRequired
      }
    ` as TypedQueryDocumentNode<{ result: boolean }>,
  },
  request,
});
