import { gql } from '@apollo/client';

export interface SiteInitArgsInput {
  title: string;
  password: string;
  email: string;
  locale: string;
  homeUrl: string;
}

export interface CheckSiteInitialRequiredData {
  result: boolean;
}

export interface StartSiteInitialData {
  result: boolean;
}

export interface StartSiteInitialVariables {
  model: SiteInitArgsInput;
}

export const CHECK_SITE_INITIAL_REQUIRED = gql`
  query CheckSiteInitialRequired {
    result: checkSiteInitialRequired
  }
`;

export const START_SITE_INITIAL = gql`
  mutation StartSiteInitial($model: SiteInitArgsInput!) {
    result: startSiteInitial(model: $model)
  }
`;
