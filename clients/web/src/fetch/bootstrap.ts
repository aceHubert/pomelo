import gql from 'graphql-tag';
import { envConfig } from '@/configs/env';
import { createClient } from './graphql/utils/client';
import { createHttpLink } from './graphql/utils/links';

export interface BootstrapOptionValue {
  key: string;
  value?: string | null;
  isSet: boolean;
  useDefault: boolean;
  message?: string | null;
}

const GetBootstrapOptionByNameDocument = gql`
  query getBootstrapOptionByName($name: String!) {
    option: optionByName(name: $name) {
      key
      value
      isSet
      useDefault
      message
    }
  }
`;

const GetBootstrapOptionValueDocument = gql`
  query getBootstrapOptionValue($name: String!) {
    value: optionValue(name: $name)
  }
`;

// 启动期匿名 GraphQL client，不能依赖 Authoriztion / graphqlFetch / basicLink。
export const bootstrapGraphqlClient = createClient(
  createHttpLink(envConfig.basicGraphqlBase, {
    headers: {
      apikey: 'pomelo-local',
    },
  }),
);

export async function getBootstrapOptionByName(name: string) {
  const { data } = await bootstrapGraphqlClient.query<{ option: BootstrapOptionValue }, { name: string }>({
    query: GetBootstrapOptionByNameDocument,
    variables: {
      name,
    },
  });
  return data.option;
}

export async function getBootstrapOptionValue(name: string) {
  const { data } = await bootstrapGraphqlClient.query<{ value?: string | null }, { name: string }>({
    query: GetBootstrapOptionValueDocument,
    variables: {
      name,
    },
  });
  return data.value;
}
